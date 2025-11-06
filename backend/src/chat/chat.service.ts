import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * RAG query: Retrieval → Augmentation → Generation
   * 1. Convert question to embedding
   * 2. Find similar chunks via cosine similarity
   * 3. Build context and return relevant chunks
   */
  async query(projectId: number, question: string) {
    this.logger.log(`RAG query for project ${projectId}: "${question}"`);

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Step 1: Create embedding for the user's question
    const questionEmbedding =
      await this.embeddingsService.createEmbedding(question);
    const vector = `[${questionEmbedding.join(',')}]`;

    // Step 2: Similarity search using pgvector's cosine distance operator
    // <=> calculates cosine distance (0 = identical, 2 = opposite)
    // We subtract from 1 to get similarity (1 = identical, -1 = opposite)
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
      this.logger.warn(`No chunks found for project ${projectId}`);
      return {
        answer:
          'No documents have been processed yet. Please upload and process documents first.',
        chunks: [],
        sources: [],
      };
    }

    this.logger.log(
      `Found ${similarChunks.length} similar chunks with avg similarity: ${
        similarChunks.reduce((sum, c) => sum + c.similarity, 0) /
        similarChunks.length
      }`,
    );

    // Step 3: Build context from retrieved chunks
    const context = similarChunks
      .map((chunk) => chunk.content)
      .join('\n\n---\n\n');

    // Get unique document sources
    const documentIds = [...new Set(similarChunks.map((c) => c.document_id))];
    const sources = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, name: true, fileUrl: true },
    });

    // Step 4: Build RAG prompt (constrains LLM to use only provided context)
    const prompt = this.buildRAGPrompt(context, question);

    return {
      answer: prompt,
      chunks: similarChunks.map((c) => ({
        id: c.id,
        content: c.content,
        similarity: c.similarity,
      })),
      sources,
    };
  }
  /**
   * Constructs a prompt that forces the LLM to answer only from context.
   * This is the key to preventing hallucinations in RAG systems.
   */
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
