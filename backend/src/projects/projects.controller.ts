import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Body() body: { name: string; description: string; userId: number },
  ) {
    return await this.projectsService.create(
      body.name,
      body.description,
      body.userId,
    );
  }

  @Get()
  async getProjects(@Query('userId') userId: string) {
    return await this.projectsService.findAll(parseInt(userId));
  }
}
