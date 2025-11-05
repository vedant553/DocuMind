import { DocumentsService } from './documents.service';
import { type FastifyRequest } from 'fastify';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    uploadDocument(projectId: number, request: FastifyRequest): Promise<import("./types/cloudinary.types").DocumentUploadResponse>;
    getDocuments(projectId: number): Promise<({
        _count: {
            chunks: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        status: string;
        projectId: number;
    })[]>;
    getDocument(documentId: number): Promise<{
        _count: {
            chunks: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        status: string;
        projectId: number;
    }>;
}
