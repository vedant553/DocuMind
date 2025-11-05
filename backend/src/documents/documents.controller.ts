import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { type FastifyRequest } from 'fastify';
import { FileUploadException } from '../common/exceptions/file-upload.exception';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Upload a document
   * POST /documents/upload/:projectId
   */
  @Post('upload/:projectId')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() request: FastifyRequest,
  ) {
    // Get uploaded file from request
    const data = await request.file();

    if (!data) {
      throw new FileUploadException('No file uploaded. Please attach a file.');
    }

    // Read file into buffer
    const buffer = await data.toBuffer();

    // Upload and process
    return await this.documentsService.uploadDocument(
      buffer,
      data.filename,
      projectId,
    );
  }

  /**
   * Get all documents for a project
   * GET /documents/project/:projectId
   */
  @Get('project/:projectId')
  async getDocuments(@Param('projectId', ParseIntPipe) projectId: number) {
    return await this.documentsService.getDocumentsByProject(projectId);
  }

  /**
   * Get a specific document by ID
   * GET /documents/:documentId
   */
  @Get(':documentId')
  async getDocument(@Param('documentId', ParseIntPipe) documentId: number) {
    return await this.documentsService.getDocumentById(documentId);
  }
}
