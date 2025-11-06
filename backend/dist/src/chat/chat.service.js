"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const generative_ai_1 = require("@google/generative-ai");
let ChatService = ChatService_1 = class ChatService {
    prisma;
    embeddingsService;
    logger = new common_1.Logger(ChatService_1.name);
    genAI;
    modelNames = ['gemini-pro', 'gemini', 'gemini-1.5-pro'];
    constructor(prisma, embeddingsService) {
        this.prisma = prisma;
        this.embeddingsService = embeddingsService;
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    getGenerativeModel() {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`Model ${modelName} failed: ${errorMessage}`);
                if (errorMessage.includes('404') && errorMessage.includes('v1beta')) {
                    this.logger.warn(`Model ${modelName} is not available in v1beta API. This may require updating the Google Generative AI library or using different model names.`);
                }
                continue;
            }
        }
        const allModelsFailed = this.modelNames
            .map((name) => `  - ${name}`)
            .join('\n');
        throw new Error(`All Google Generative AI models failed to initialize. The current @google/generative-ai library (v0.24.1) uses the v1beta API, but the following models are not available in this API version:\n${allModelsFailed}\n\nPossible solutions:\n1. Update to a newer version of @google/generative-ai\n2. Use different model names that are compatible with v1beta API\n3. Switch to a different LLM provider\n4. Check Google AI documentation for available models`);
    }
    async *queryStream(projectId, question) {
        this.logger.log(`RAG streaming query for project ${projectId}: "${question}"`);
        try {
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project) {
                throw new common_1.NotFoundException(`Project ${projectId} not found`);
            }
            const questionEmbedding = await this.embeddingsService.createEmbedding(question);
            const vector = `[${questionEmbedding.join(',')}]`;
            const similarChunks = await this.prisma.$queryRaw `
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
            this.logger.log(`Found ${similarChunks.length} chunks, avg similarity: ${similarChunks.reduce((sum, c) => sum + c.similarity, 0) /
                similarChunks.length}`);
            const context = similarChunks
                .map((chunk) => chunk.content)
                .join('\n\n---\n\n');
            const prompt = this.buildRAGPrompt(context, question);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            this.logger.error(`Error in queryStream: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            throw new Error(`Failed to process query: ${errorMessage}`);
        }
    }
    async query(projectId, question) {
        this.logger.log(`RAG query for project ${projectId}: "${question}"`);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project ${projectId} not found`);
        }
        const questionEmbedding = await this.embeddingsService.createEmbedding(question);
        const vector = `[${questionEmbedding.join(',')}]`;
        const similarChunks = await this.prisma.$queryRaw `
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
                answer: 'No documents have been processed yet. Please upload and process documents first.',
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to generate content:', error);
            throw new Error(`Failed to generate response: ${errorMessage}`);
        }
    }
    buildRAGPrompt(context, question) {
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        embeddings_service_1.EmbeddingsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map