import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  const allTeams = await prisma.team.findMany({ select: { name: true } });
  console.log('All teams:', allTeams.map(t => t.name).sort().join(', '));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
