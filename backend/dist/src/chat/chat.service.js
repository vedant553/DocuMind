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
let ChatService = ChatService_1 = class ChatService {
    prisma;
    embeddingsService;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(prisma, embeddingsService) {
        this.prisma = prisma;
        this.embeddingsService = embeddingsService;
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
            this.logger.warn(`No chunks found for project ${projectId}`);
            return {
                answer: 'No documents have been processed yet. Please upload and process documents first.',
                chunks: [],
                sources: [],
            };
        }
        this.logger.log(`Found ${similarChunks.length} similar chunks with avg similarity: ${similarChunks.reduce((sum, c) => sum + c.similarity, 0) /
            similarChunks.length}`);
        const context = similarChunks
            .map((chunk) => chunk.content)
            .join('\n\n---\n\n');
        const documentIds = [...new Set(similarChunks.map((c) => c.document_id))];
        const sources = await this.prisma.document.findMany({
            where: { id: { in: documentIds } },
            select: { id: true, name: true, fileUrl: true },
        });
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