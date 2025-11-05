import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import Prisma module
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService], // Export for use in other modules
})
export class DocumentsModule {}
