import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DocumentChunk {
  id: number;
  content: string;
  document_id: number;
  similarity: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private readonly modelNames = ['gemini-pro', 'gemini', 'gemini-1.5-pro'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Get a generative model with fallback support
   */
  private getGenerativeModel() {
    // Check if we have an API key
    if (!process.env.GEMINI_API_KEY) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    for (const modelName of this.modelNames) {
      try {
        this.logger.log(`Attempting to initialize model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        });
        this.logger.log(`Successfully initialized model: ${modelName}`);
        return model;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Model ${modelName} failed: ${errorMessage}`);

        // If it's a 404 error, it means the model doesn't exist in the current API
        if (errorMessage.includes('404') && errorMessage.includes('v1beta')) {
          this.logger.warn(
            `Model ${modelName} is not available in v1beta API. This may require updating the Google Generative AI library or using different model names.`,
          );
        }
        continue;
      }
    }

    // If we get here, all models failed
    const allModelsFailed = this.modelNames
      .map((name) => `  - ${name}`)
      .join('\n');
    throw new Error(
      `All Google Generative AI models failed to initialize. The current @google/generative-ai library (v0.24.1) uses the v1beta API, but the following models are not available in this API version:\n${allModelsFailed}\n\nPossible solutions:\n1. Update to a newer version of @google/generative-ai\n2. Use different model names that are compatible with v1beta API\n3. Switch to a different LLM provider\n4. Check Google AI documentation for available models`,
    );
  }

  /**
   * RAG query with streaming: Retrieval → Augmentation → Generation (streaming)
   */
  async *queryStream(
    projectId: number,
    question: string,
  ): AsyncGenerator<string> {
    this.logger.log(
      `RAG streaming query for project ${projectId}: "${question}"`,
    );

    try {
      // Verify project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project ${projectId} not found`);
      }

      // Step 1: Create embedding for the question
      const questionEmbedding =
        await this.embeddingsService.createEmbedding(question);
      const vector = `[${questionEmbedding.join(',')}]`;

      // Step 2: Similarity search (cosine distance with 768-dim vectors)
      const similarChunks = await this.prisma.$queryRaw<DocumentChunk[]>`
        SELECT
          id,
          content,
          "documentId" as document_id,
          1 - (embedding <=> ${vector}::vector) as similarity
        FROM "DocumentChunk"
        WHERE "documentId" IN (
          SELECT id FROM "Document"
          WHERE "projectId" = ${projectId}
          AND status = 'completed'
        )
        ORDER BY similarity DESC
        LIMIT 5;
      `;

      if (similarChunks.length === 0) {
        yield 'No documents have been processed yet. Please upload and process documents first.';
        return;
      }

      this.logger.log(
        `Found ${similarChunks.length} chunks, avg similarity: ${
          similarChunks.reduce((sum, c) => sum + c.similarity, 0) /
          similarChunks.length
        }`,
      );

      // Step 3: Build context
      const context = similarChunks
        .map((chunk) => chunk.content)
        .join('\n\n---\n\n');

      // Step 4: Build RAG prompt
      const prompt = this.buildRAGPrompt(context, question);

      // Step 5: Stream LLM response
      const model = this.getGenerativeModel();

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessageStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      this.logger.error(
        `Error in queryStream: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to process query: ${errorMessage}`);
    }
  }

  /**
   * Non-streaming version (for backward compatibility with existing frontend)
   */
  async query(projectId: number, question: string) {
    this.logger.log(`RAG query for project ${projectId}: "${question}"`);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const questionEmbedding =
      await this.embeddingsService.createEmbedding(question);
    const vector = `[${questionEmbedding.join(',')}]`;

    const similarChunks = await this.prisma.$queryRaw<
      Array<{
        id: number;
        content: string;
        similarity: number;
        document_id: number;
      }>
    >`
      SELECT
        id,
        content,
        "documentId" as document_id,
        1 - (embedding <=> ${vector}::vector) as similarity
      FROM "DocumentChunk"
      WHERE "documentId" IN (
        SELECT id FROM "Document"
        WHERE "projectId" = ${projectId}
        AND status = 'completed'
      )
      ORDER BY similarity DESC
      LIMIT 5;
    `;

    if (similarChunks.length === 0) {
      return {
        answer:
          'No documents have been processed yet. Please upload and process documents first.',
        chunks: [],
        sources: [],
      };
    }

    const context = similarChunks
      .map((chunk) => chunk.content)
      .join('\n\n---\n\n');
    const documentIds = [...new Set(similarChunks.map((c) => c.document_id))];
    const sources = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, name: true, fileUrl: true },
    });

    const prompt = this.buildRAGPrompt(context, question);

    try {
      // Generate complete response using generateContent (NOT chat.sendMessage)
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      return {
        answer,
        chunks: similarChunks.map((c) => ({
          id: c.id,
          content: c.content,
          similarity: c.similarity,
        })),
        sources,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to generate content:', error);
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }

  private buildRAGPrompt(context: string, question: string): string {
    return `You are a helpful AI assistant for the DocuMind document analysis platform.

Your task is to answer the user's question based ONLY on the context provided below.

STRICT RULES:
1. If the answer is not in the context, respond with: "I cannot find that information in the uploaded documents."
2. Do not use any external knowledge or assumptions.
3. Quote relevant parts of the context when possible.
4. Be concise but complete in your answers.

CONTEXT:
"""
${context}
"""

USER QUESTION:
"""
${question}
"""

ANSWER:`;
  }
}
