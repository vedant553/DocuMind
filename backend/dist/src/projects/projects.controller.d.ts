import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    createProject(body: {
        name: string;
        description: string;
        userId: number;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: number;
    }>;
    getProjects(userId: string): Promise<({
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
