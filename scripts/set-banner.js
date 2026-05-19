const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tournaments = await prisma.tournament.findMany();
  console.log('Found tournaments:', tournaments.map(t => ({ id: t.id, name: t.name })));

  for (const t of tournaments) {
    if (t.name.toLowerCase().includes('afl')) {
      await prisma.tournament.update({
        where: { id: t.id },
        data: { bannerUrl: '/afl-banner.png' }
      });
      console.log('Updated', t.name, 'with banner /afl-banner.png');
    }
  }
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
