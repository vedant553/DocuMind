"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessingException = exports.FileUploadException = void 0;
const common_1 = require("@nestjs/common");
class FileUploadException extends common_1.HttpException {
    constructor(message) {
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: message,
            error: 'File Upload Error',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.FileUploadException = FileUploadException;
class DocumentProcessingException extends common_1.HttpException {
    constructor(message) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: message,
            error: 'Document Processing Error',
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.DocumentProcessingException = DocumentProcessingException;
//# sourceMappingURL=file-upload.exception.js.map