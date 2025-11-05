import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a user
  const user = await prisma.user.create({
    data: {
      email: 'demo@documind.com',
      name: 'Demo User',
      password: 'password123', // In a real app, hash this!
    },
  });
  console.log(`Created user with id: ${user.id}`);

  // Create a project for that user
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
