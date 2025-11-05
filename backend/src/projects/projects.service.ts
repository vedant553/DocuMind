import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, description: string, userId: number) {
    return await this.prisma.project.create({
      data: { name, description, userId },
    });
  }

  async findAll(userId: number) {
    return await this.prisma.project.findMany({
      where: { userId },
      include: { documents: true },
    });
  }
}
