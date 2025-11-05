import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './documents/documents.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';

@Module({
  imports: [
    PrismaModule, // Add this
    UsersModule,
    ProjectsModule,
    DocumentsModule,
    EmbeddingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
