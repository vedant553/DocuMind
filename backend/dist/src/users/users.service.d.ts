export declare class UsersService {
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
