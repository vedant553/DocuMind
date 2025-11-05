"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const file_upload_exception_1 = require("../common/exceptions/file-upload.exception");
function isPdfParseFunction(val) {
    return typeof val === 'function';
}
function isModuleWithDefault(val) {
    const mod = val;
    return (typeof mod === 'object' &&
        mod !== null &&
        'default' in mod &&
        typeof mod.default === 'function');
}
async function loadPdfParse() {
    const mod = await import('pdf-parse');
    if (isPdfParseFunction(mod))
        return mod;
    if (isModuleWithDefault(mod))
        return mod.default;
    throw new Error('Unsupported pdf-parse module shape');
}
let DocumentsService = DocumentsService_1 = class DocumentsService {
    prisma;
    embeddingsService;
    logger = new common_1.Logger(DocumentsService_1.name);
    ALLOWED_FILE_TYPES = ['pdf', 'txt', 'md'];
    MAX_FILE_SIZE = 10 * 1024 * 1024;
    constructor(prisma, embeddingsService) {
        this.prisma = prisma;
        this.embeddingsService = embeddingsService;
    }
    async uploadDocument(file, filename, projectId) {
        try {
            const fileType = this.getFileType(filename);
            if (!this.ALLOWED_FILE_TYPES.includes(fileType)) {
                throw new file_upload_exception_1.FileUploadException(`File type .${fileType} is not supported. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`);
            }
            if (file.length > this.MAX_FILE_SIZE) {
                throw new file_upload_exception_1.FileUploadException(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
            }
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project) {
                throw new file_upload_exception_1.FileUploadException(`Project with ID ${projectId} does not exist`);
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
            this.processDocument(document.id, file, fileType).catch((err) => {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                this.logger.error(`Failed to process document ${document.id}: ${errorMessage}`);
            });
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error('Upload error:', errorMessage);
            if (error instanceof file_upload_exception_1.FileUploadException) {
                throw error;
            }
            throw new file_upload_exception_1.FileUploadException(`Failed to upload document: ${errorMessage}`);
        }
    }
    async uploadToCloudinary(file, filename) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.default.uploader.upload_stream({
                folder: 'documind',
                resource_type: 'raw',
                public_id: `${Date.now()}-${filename}`,
            }, (error, result) => {
                if (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                    reject(new file_upload_exception_1.FileUploadException(`Cloudinary upload failed: ${errorMessage}`));
                }
                else if (result) {
                    resolve(result);
                }
                else {
                    reject(new file_upload_exception_1.FileUploadException('Cloudinary upload returned undefined result'));
                }
            });
            uploadStream.end(file);
        });
    }
    async processDocument(documentId, fileBuffer, fileType) {
        try {
            this.logger.log(`Processing document ${documentId}...`);
            let extractedText = '';
            if (fileType === 'pdf') {
                const pdfParse = await loadPdfParse();
                const pdfData = await pdfParse(fileBuffer);
                extractedText = pdfData.text;
            }
            else if (fileType === 'txt' || fileType === 'md') {
                extractedText = fileBuffer.toString('utf-8');
            }
            if (!extractedText || extractedText.trim().length === 0) {
                throw new Error('No text could be extracted from the document');
            }
            const chunks = this.chunkText(extractedText);
            this.logger.log(`Generating embeddings for ${chunks.length} chunks...`);
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = await this.embeddingsService.createEmbedding(chunk);
                const vector = `[${embedding.join(',')}]`;
                await this.prisma.$executeRaw `
          INSERT INTO "DocumentChunk" (content, "chunkIndex", "documentId", embedding, "createdAt")
          VALUES (${chunk}, ${i}, ${documentId}, ${vector}::vector, NOW())
        `;
            }
            await this.prisma.document.update({
                where: { id: documentId },
                data: { status: 'completed' },
            });
            this.logger.log(`✅ Processed document ${documentId}: ${chunks.length} chunks created`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Processing failed';
            this.logger.error(`Processing error for document ${documentId}:`, message);
            await this.prisma.document.update({
                where: { id: documentId },
                data: { status: 'failed' },
            });
            throw new file_upload_exception_1.DocumentProcessingException(`Failed to process document: ${message}`);
        }
    }
    chunkText(text) {
        const chunkSize = 800;
        const overlap = 200;
        const chunks = [];
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
    getFileType(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension || 'unknown';
    }
    async getDocumentsByProject(projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new file_upload_exception_1.FileUploadException(`Project with ID ${projectId} does not exist`);
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
    async getDocumentById(documentId) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                _count: {
                    select: { chunks: true },
                },
            },
        });
        if (!document) {
            throw new file_upload_exception_1.FileUploadException(`Document with ID ${documentId} does not exist`);
        }
        return document;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        embeddings_service_1.EmbeddingsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map