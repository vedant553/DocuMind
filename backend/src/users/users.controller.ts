import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.findAll();
  }

  @Post()
  async createUser(
    @Body() body: { email: string; name: string; password: string },
  ) {
    return await this.usersService.create(body.email, body.name, body.password);
  }
}
