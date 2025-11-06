import type { FastifyReply } from 'fastify';
import { ChatService } from './chat.service';
interface ChatRequestBody {
    projectId: number;
    question: string;
}
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    query(body: ChatRequestBody): Promise<{
        answer: string;
        chunks: {
            id: number;
            content: string;
            similarity: number;
        }[];
        sources: {
            id: number;
            name: string;
            fileUrl: string;
        }[];
    }>;
    queryStream(body: ChatRequestBody, reply: FastifyReply): Promise<void>;
}
export {};
