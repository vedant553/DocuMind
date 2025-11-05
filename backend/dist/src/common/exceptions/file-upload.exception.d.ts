import { HttpException } from '@nestjs/common';
export declare class FileUploadException extends HttpException {
    constructor(message: string);
}
export declare class DocumentProcessingException extends HttpException {
    constructor(message: string);
}
