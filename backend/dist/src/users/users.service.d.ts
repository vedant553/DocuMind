import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }[]>;
    create(email: string, name: string, password: string): Promise<{
        id: number;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
