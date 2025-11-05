import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<{
        email: string;
        name: string | null;
        createdAt: Date;
        id: number;
    }[]>;
    createUser(body: {
        email: string;
        name: string;
        password: string;
    }): Promise<{
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}
