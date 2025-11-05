import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cloudinary from '../config/cloudinary.config';
import {
  FileUploadException,
  DocumentProcessingException,
} from '../common/exceptions/file-upload.exception';
import {
  CloudinaryUploadResult,
  DocumentUploadResponse,
} from './types/cloudinary.types';

/**
 * Types and narrow helpers for loading pdf-parse safely in TS/ESM.
 * This handles different module shapes from various build tools.
 */
type PdfData = { text: string; numpages: number };
type PdfParseFunction = (dataBuffer: Buffer) => Promise<PdfData>;

function isPdfParseFunction(val: unknown): val is PdfParseFunction {
  return typeof val === 'function';
}

function isModuleWithDefault(
  val: unknown,
): val is { default: PdfParseFunction } {
  const mod = val as Record<string, unknown>;
  return (
    typeof mod === 'object' &&
    mod !== null &&
    'default' in mod &&
    typeof mod.default === 'function'
  );
}

async function loadPdfParse(): Promise<PdfParseFunction> {
  const mod = await import('pdf-parse');
  if (isPdfParseFunction(mod)) return mod;
  if (isModuleWithDefault(mod)) return mod.default;
  throw new Error('Unsupported pdf-parse module shape');
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly ALLOWED_FILE_TYPES = ['pdf', 'txt', 'md'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upload document to Cloudinary and save metadata to database.
   */
  async uploadDocument(
    file: Buffer,
    filename: string,
    projectId: number,
  ): Promise<DocumentUploadResponse> {
    try {
      const fileType = this.getFileType(filename);
      if (!this.ALLOWED_FILE_TYPES.includes(fileType)) {
        throw new FileUploadException(
          `File type .${fileType} is not supported. Allowed types: ${this.ALLOWED_FILE_TYPES.join(
            ', ',
          )}`,
        );
      }

      if (file.length > this.MAX_FILE_SIZE) {
        throw new FileUploadException(
          `File size exceeds maximum limit of ${
            this.MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        );
      }

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new FileUploadException(
          `Project with ID ${projectId} does not exist`,
        );
      }

      const uploadResult = await this.uploadToCloudinary(file, filename);

      const document = await this.prisma.document.create({
        data: {
          name: filename,
          fileUrl: uploadResult.secure_url,
          fileType: fileType,
          fileSize: uploadResult.bytes,
          projectId: projectId,
          status: 'processing',
        },
      });

      // Corrected call: Pass the 'file' buffer, not the URL.
      this.processDocument(document.id, file, fileType).catch(
        (err: unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown error';
          this.logger.error(
            `Failed to process document ${document.id}: ${errorMessage}`,
          );
        },
      );

      return {
        success: true,
        document: {
          id: document.id,
          name: document.name,
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          createdAt: document.createdAt,
        },
        message: 'Document uploaded successfully. Processing started.',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Upload error:', errorMessage);

      if (error instanceof FileUploadException) {
        throw error;
      }

      throw new FileUploadException(
        `Failed to upload document: ${errorMessage}`,
      );
    }
  }

  /**
   * Upload file to Cloudinary (returns typed result).
   */
  private async uploadToCloudinary(
    file: Buffer,
    filename: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'documind',
          resource_type: 'raw',
          public_id: `${Date.now()}-${filename}`,
        },
        (error, result) => {
          if (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Upload failed';
            reject(
              new FileUploadException(
                `Cloudinary upload failed: ${errorMessage}`,
              ),
            );
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(
              new FileUploadException(
                'Cloudinary upload returned undefined result',
              ),
            );
          }
        },
      );
      uploadStream.end(file);
    });
  }

  /**
   * Extract text from document and create chunks.
   */
  private async processDocument(
    documentId: number,
    fileBuffer: Buffer,
    fileType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing document ${documentId}...`);

      // Extract text directly from buffer
      let extractedText = '';

      if (fileType === 'pdf') {
        const pdfParse = await loadPdfParse();
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (fileType === 'txt' || fileType === 'md') {
        extractedText = fileBuffer.toString('utf-8');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      // Chunk and persist
      const chunks = this.chunkText(extractedText);
      const data = chunks.map((content, index) => ({
        content,
        chunkIndex: index,
        documentId,
      }));
      await this.prisma.documentChunk.createMany({ data });

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'completed' },
      });

      this.logger.log(
        `✅ Processed document ${documentId}: ${chunks.length} chunks created`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Processing failed';
      this.logger.error(
        `Processing error for document ${documentId}:`,
        message,
      );

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });

      throw new DocumentProcessingException(
        `Failed to process document: ${message}`,
      );
    }
  }

  /**
   * Split text into chunks for embeddings.
   */
  private chunkText(text: string): string[] {
    const chunkSize = 800;
    const overlap = 200;
    const chunks: string[] = [];

    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length === 0) {
      return [];
    }

    for (let i = 0; i < cleanText.length; i += chunkSize - overlap) {
      const chunk = cleanText.slice(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  /**
   * Detect file type from filename.
   */
  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  /**
   * Get all documents for a project.
   */
  async getDocumentsByProject(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new FileUploadException(
        `Project with ID ${projectId} does not exist`,
      );
    }

    return await this.prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });
  }

  /**
   * Get document by ID with chunks count.
   */
  async getDocumentById(documentId: number) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document) {
      throw new FileUploadException(
        `Document with ID ${documentId} does not exist`,
      );
    }

    return document;
  }
}
