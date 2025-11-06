import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatRequestBody {
  projectId: number;
  question: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(@Body() body: ChatRequestBody) {
    if (!body.projectId || !body.question) {
      throw new BadRequestException(
        'projectId and question are required fields',
      );
    }

    if (typeof body.projectId !== 'number' || body.projectId <= 0) {
      throw new BadRequestException('projectId must be a positive number');
    }

    if (
      typeof body.question !== 'string' ||
      body.question.trim().length === 0
    ) {
      throw new BadRequestException('question cannot be empty');
    }

    return await this.chatService.query(body.projectId, body.question);
  }
}
