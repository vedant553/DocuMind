export declare class EmbeddingsService {
    private readonly logger;
    private openai;
    constructor();
    createEmbedding(text: string): Promise<number[]>;
}
