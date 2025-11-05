import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(name: string, description: string, userId: number): Promise<{
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        description: string | null;
        userId: number;
    }>;
    findAll(userId: number): Promise<({
        documents: {
            name: string;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            fileUrl: string;
            fileType: string;
            fileSize: number;
            status: string;
            projectId: number;
        }[];
    } & {
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        description: string | null;
        userId: number;
    })[]>;
}
