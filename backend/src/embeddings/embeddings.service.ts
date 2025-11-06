import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Creates an embedding using Google's text-embedding-004 model.
   * Returns a 768-dimensional vector.
   * @param text The text to create an embedding for.
   * @returns A promise that resolves to the embedding vector.
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Use the embedding model directly
      const model = this.genAI.getGenerativeModel({
        model: 'models/text-embedding-004',
      });
      // Normalize text
      const normalizedText = text.replace(/\n/g, ' ').slice(0, 8000);
      // Get the embedding
      const result = await model.embedContent({
        content: {
          parts: [{ text: normalizedText }],
          role: 'user',
        },
      });
      // Return the embedding values
      return result.embedding?.values || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create embedding: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to create embedding: ${errorMessage}`);
    }
  }
}
