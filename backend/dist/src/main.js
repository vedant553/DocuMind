"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const multipart_1 = __importDefault(require("@fastify/multipart"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: true }));
    await app.register(multipart_1.default, {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    });
    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });
    await app.listen(3001, '0.0.0.0');
    console.log('🚀 Backend running on http://localhost:3001');
}
bootstrap();
//# sourceMappingURL=main.js.map