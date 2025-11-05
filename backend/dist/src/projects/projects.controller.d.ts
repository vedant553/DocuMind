import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    createProject(body: {
        name: string;
        description: string;
        userId: number;
    }): Promise<{
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        description: string | null;
        userId: number;
    }>;
    getProjects(userId: string): Promise<({
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
