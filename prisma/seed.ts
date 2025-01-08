import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'aaron.m.ponce@gmail.com' },
    update: {},
    create: {
      email: 'aaron.m.ponce@gmail.com',
      password: adminHashedPassword,
      role: 'ADMIN',
    },
  });

  // Create buyer user
  const buyerHashedPassword = await bcrypt.hash('buyer123', 10);
  await prisma.user.upsert({
    where: { email: 'aaron.m.ponce+buyer@gmail.com' },
    update: {},
    create: {
      email: 'aaron.m.ponce+buyer@gmail.com',
      password: buyerHashedPassword,
      role: 'BUYER',
      isManager: false,
    },
  });

  // Create lender user
  const lenderHashedPassword = await bcrypt.hash('lender123', 10);
  await prisma.user.upsert({
    where: { email: 'aaron.m.ponce+lender@gmail.com' },
    update: {},
    create: {
      email: 'aaron.m.ponce+lender@gmail.com',
      password: lenderHashedPassword,
      role: 'LENDER',
      isManager: false,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 