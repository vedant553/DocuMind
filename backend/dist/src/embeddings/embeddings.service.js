"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmbeddingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
}
let EmbeddingsService = EmbeddingsService_1 = class EmbeddingsService {
    logger = new common_1.Logger(EmbeddingsService_1.name);
    DIM = 1536;
    async createEmbedding(text) {
        const normalized = (text ?? '').replace(/\n/g, ' ').slice(0, 8000);
        const seed = hashString(normalized);
        const rand = mulberry32(seed);
        const vec = new Array(this.DIM);
        let sumSq = 0;
        for (let i = 0; i < this.DIM; i++) {
            const v = rand() * 2 - 1;
            vec[i] = v;
            sumSq += v * v;
        }
        const norm = Math.sqrt(sumSq) || 1;
        for (let i = 0; i < this.DIM; i++) {
            vec[i] = vec[i] / norm;
        }
        this.logger.warn('Using mock embeddings (development mode only)');
        return Promise.resolve(vec);
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = EmbeddingsService_1 = __decorate([
    (0, common_1.Injectable)()
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map