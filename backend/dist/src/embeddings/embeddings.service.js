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
var EmbeddingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
let EmbeddingsService = EmbeddingsService_1 = class EmbeddingsService {
    logger = new common_1.Logger(EmbeddingsService_1.name);
    genAI;
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    async createEmbedding(text) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'models/text-embedding-004',
            });
            const normalizedText = text.replace(/\n/g, ' ').slice(0, 8000);
            const result = await model.embedContent({
                content: {
                    parts: [{ text: normalizedText }],
                    role: 'user',
                },
            });
            return result.embedding?.values || [];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to create embedding: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            throw new Error(`Failed to create embedding: ${errorMessage}`);
        }
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = EmbeddingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map