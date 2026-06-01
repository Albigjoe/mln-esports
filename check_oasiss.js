require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const teams = await prisma.team.findMany();
  const players = await prisma.player.findMany();
  
  const oasissTeams = teams.filter(t => t.name.toLowerCase().includes('oasis'));
  const oasissPlayers = players.filter(p => p.username.toLowerCase().includes('oasis') || (p.realName && p.realName.toLowerCase().includes('oasis')));

  console.log(`Found ${oasissTeams.length} Team(s) matching 'oasis'`);
  oasissTeams.forEach(t => console.log(`- Team: ${t.name}`));
  
  console.log(`Found ${oasissPlayers.length} Player(s) matching 'oasis'`);
  oasissPlayers.forEach(p => console.log(`- Player: ${p.username} (${p.realName || ''})`));
  

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
