import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(name: string, description: string, userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: number;
    }>;
    findAll(userId: number): Promise<({
        documents: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            fileUrl: string;
            fileType: string;
            fileSize: number;
            status: string;
            projectId: number;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: number;
    })[]>;
}
