import { Injectable, Logger } from '@nestjs/common';

// Dev-only helper to create deterministic pseudo-random numbers from a string
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable 32-bit hash of a string
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly DIM = 1536;

  /**
   * Dev-mode mock embedding: deterministic, fast, no network calls.
   * Returns a 1536-length float vector normalized to unit length.
   */
  async createEmbedding(text: string): Promise<number[]> {
    const normalized = (text ?? '').replace(/\n/g, ' ').slice(0, 8000);
    const seed = hashString(normalized);
    const rand = mulberry32(seed);

    const vec = new Array<number>(this.DIM);
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
}
