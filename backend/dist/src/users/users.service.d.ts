import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        email: string;
        name: string | null;
        createdAt: Date;
        id: number;
    }[]>;
    create(email: string, name: string, password: string): Promise<{
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}
