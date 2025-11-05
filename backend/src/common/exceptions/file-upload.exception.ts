import { HttpException, HttpStatus } from '@nestjs/common';

export class FileUploadException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: message,
        error: 'File Upload Error',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DocumentProcessingException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: message,
        error: 'Document Processing Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
