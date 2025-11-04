import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  // Get all users
  async findAll() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  // Create a new user
  async create(email: string, name: string, password: string) {
    return await prisma.user.create({
      data: { email, name, password }, // We'll hash password later
    });
  }
}
