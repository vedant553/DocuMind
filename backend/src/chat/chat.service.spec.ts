import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockEmbeddingsService = {
    createEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingsService, useValue: mockEmbeddingsService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    const projectId = 1;
    const question = 'test question';
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockProject = { id: projectId, name: 'Test Project' };
    const mockChunks = [
      {
        id: 1,
        content: 'test content 1',
        similarity: 0.9,
        document_id: 1,
      },
    ];
    const mockDocuments = [
      { id: 1, name: 'doc1.pdf', fileUrl: 'http://example.com/doc1' },
    ];

    beforeEach(() => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockEmbeddingsService.createEmbedding.mockResolvedValue(mockEmbedding);
      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
    });

    it('should return RAG response with relevant chunks', async () => {
      const result = await service.query(projectId, question);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(mockEmbeddingsService.createEmbedding).toHaveBeenCalledWith(
        question,
      );
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        select: { id: true, name: true, fileUrl: true },
      });

      expect(result).toHaveProperty('answer');
      expect(result.chunks).toHaveLength(1);
      expect(result.sources).toHaveLength(1);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.query(999, question)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle case when no chunks are found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.query(projectId, question);

      expect(result.answer).toContain('No documents have been processed yet');
      expect(result.chunks).toHaveLength(0);
      expect(result.sources).toHaveLength(0);
    });
  });
});
