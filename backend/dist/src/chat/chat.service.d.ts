import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class ChatService {
    private readonly prisma;
    private readonly embeddingsService;
    private readonly logger;
    constructor(prisma: PrismaService, embeddingsService: EmbeddingsService);
    query(projectId: number, question: string): Promise<{
        answer: string;
        chunks: {
            id: number;
            content: string;
            similarity: number;
        }[];
        sources: {
            name: string;
            id: number;
            fileUrl: string;
        }[];
    }>;
    private buildRAGPrompt;
}
