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
    getDocument(documentId: number): Promise<{
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
