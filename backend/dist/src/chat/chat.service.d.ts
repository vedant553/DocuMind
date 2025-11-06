import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
export declare class ChatService {
    private readonly prisma;
    private readonly embeddingsService;
    private readonly logger;
    private genAI;
    private readonly modelNames;
    constructor(prisma: PrismaService, embeddingsService: EmbeddingsService);
    private getGenerativeModel;
    queryStream(projectId: number, question: string): AsyncGenerator<string>;
    query(projectId: number, question: string): Promise<{
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
    private buildRAGPrompt;
}
