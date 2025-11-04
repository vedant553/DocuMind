import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }[]>;
    createUser(body: {
        email: string;
        name: string;
        password: string;
    }): Promise<{
        id: number;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
