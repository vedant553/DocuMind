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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmbeddingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
let EmbeddingsService = EmbeddingsService_1 = class EmbeddingsService {
    logger = new common_1.Logger(EmbeddingsService_1.name);
    openai;
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async createEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text.replace(/\n/g, ' '),
            });
            return response.data[0].embedding;
        }
        catch (error) {
            this.logger.error('Failed to create embedding:', error);
            throw new Error('Failed to create embedding with OpenAI');
        }
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = EmbeddingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map