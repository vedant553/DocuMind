import { PrismaService } from '../prisma/prisma.service';
import { DocumentUploadResponse } from './types/cloudinary.types';
export declare class DocumentsService {
    private readonly prisma;
    private readonly logger;
    private readonly ALLOWED_FILE_TYPES;
    private readonly MAX_FILE_SIZE;
    constructor(prisma: PrismaService);
    uploadDocument(file: Buffer, filename: string, projectId: number): Promise<DocumentUploadResponse>;
    private uploadToCloudinary;
    private processDocument;
    private chunkText;
    private getFileType;
    getDocumentsByProject(projectId: number): Promise<({
        _count: {
            chunks: number;
        };
    } & {
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        status: string;
        projectId: number;
    })[]>;
    getDocumentById(documentId: number): Promise<{
        _count: {
            chunks: number;
        };
    } & {
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        status: string;
        projectId: number;
    }>;
}
