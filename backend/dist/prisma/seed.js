"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    const user = await prisma.user.create({
        data: {
            email: 'demo@documind.com',
            name: 'Demo User',
            password: 'password123',
        },
    });
    console.log(`Created user with id: ${user.id}`);
    const project = await prisma.project.create({
        data: {
            name: 'My First Project',
            description: 'Seeded project for testing.',
            userId: user.id,
        },
    });
    console.log(`Created project with id: ${project.id}`);
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map