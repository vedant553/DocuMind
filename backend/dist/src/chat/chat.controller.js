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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async query(body) {
        if (!body.projectId || !body.question) {
            throw new common_1.BadRequestException('projectId and question are required fields');
        }
        if (typeof body.projectId !== 'number' || body.projectId <= 0) {
            throw new common_1.BadRequestException('projectId must be a positive number');
        }
        if (typeof body.question !== 'string' ||
            body.question.trim().length === 0) {
            throw new common_1.BadRequestException('question cannot be empty');
        }
        return await this.chatService.query(body.projectId, body.question);
    }
    async queryStream(body, reply) {
        if (!body.projectId || !body.question) {
            throw new common_1.BadRequestException('projectId and question are required fields');
        }
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        try {
            for await (const chunk of this.chatService.queryStream(body.projectId, body.question)) {
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            reply.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            reply.raw.end();
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('query'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "query", null);
__decorate([
    (0, common_1.Post)('query-stream'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "queryStream", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map