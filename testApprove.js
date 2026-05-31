const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const regs = await prisma.teamRegistration.findMany({
    where: { 
      status: 'PENDING',
      teamName: { contains: 'darkstars', mode: 'insensitive' }
    }
  });

  const voidReg = await prisma.teamRegistration.findMany({
    where: {
      status: 'PENDING',
      teamName: { contains: 'external void', mode: 'insensitive' }
    }
  });

  console.log("Darkstars:", JSON.stringify(regs, null, 2));
  console.log("External Void:", JSON.stringify(voidReg, null, 2));
}

main().catch(console.error);
