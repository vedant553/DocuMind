import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Creates an embedding for a given text using OpenAI's API.
   * @param text The text to create an embedding for.
   * @returns A promise that resolves to the embedding vector.
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '), // API recommends replacing newlines
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to create embedding:', error);
      throw new Error('Failed to create embedding with OpenAI');
    }
  }
}
