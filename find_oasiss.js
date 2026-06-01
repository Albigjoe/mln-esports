const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: {
      name: {
        contains: 'oasiss',
        mode: 'insensitive',
      },
    },
  });
  console.log('Oasiss Teams found:', teams.length);
  console.dir(teams, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
