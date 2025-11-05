export declare class EmbeddingsService {
    private readonly logger;
    private readonly DIM;
    createEmbedding(text: string): Promise<number[]>;
}
