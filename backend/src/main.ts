import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }), // Enable logging
  );

  // Enable CORS (so Next.js frontend can call this API)
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js default port
    credentials: true,
  });

  // Listen on all network interfaces (required for deployment)
  await app.listen(3001, '0.0.0.0');
  console.log('🚀 Backend running on http://localhost:3001');
}

bootstrap();
