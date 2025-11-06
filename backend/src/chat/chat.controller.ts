import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
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

  @Post('query-stream')
  async queryStream(@Body() body: ChatRequestBody, @Res() reply: FastifyReply) {
    if (!body.projectId || !body.question) {
      throw new BadRequestException(
        'projectId and question are required fields',
      );
    }

    // Set headers for Server-Sent Events (SSE)
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.chatService.queryStream(
        body.projectId,
        body.question,
      )) {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      reply.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      reply.raw.end();
    }
  }
}
