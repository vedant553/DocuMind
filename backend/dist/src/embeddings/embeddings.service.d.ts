export declare class EmbeddingsService {
    private readonly logger;
    private genAI;
    constructor();
    createEmbedding(text: string): Promise<number[]>;
}
