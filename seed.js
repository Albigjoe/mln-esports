require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEAMS = [
  { name: 'Xenagogue', logo: '/logos/Xenagogue.jpg' },
  { name: "Reap N Kill", logo: '/logos/Reap n kill.jpg' },
  { name: 'Fluffy', logo: '/logos/fluffy.jpg' },
  { name: 'Sanctuary', logo: '/logos/sancttuary.jpg' },
  { name: 'The Sentinels', logo: '/logos/The Sentinels.jpg' },
  { name: 'SHOJIN SHU', logo: '/logos/SHOJIN SHU_.jpg' },
  { name: 'Eternal Void', logo: '/logos/eternal void.jpg' },
  { name: 'Yonko Elites', logo: '/logos/yonko elites .jpeg' },
  { name: 'RIO GRANDE VALLEY', logo: '/logos/Rio Grande Valley.jpeg' },
  { name: 'Khronocide', logo: '/logos/Khronicide.png' },
  { name: 'La Cosa Nostra', logo: '/logos/La Cosa Nostra .png' },
  { name: 'Oasiss', logo: '/logos/oasiss.jpeg' },
  { name: 'ETERNUM ESPORTS', logo: '/logos/Eternum  ESPORTS.jpeg' },
  { name: 'Ruutz Esports', logo: '/logos/ruutz esports.jpg' },
  { name: '7th Heaven Gods', logo: '/logos/7th Heaven Gods.jpg' },
  { name: 'THE AFRICAN GOLDENS', logo: '/logos/The African Golden Giants.jpg' },
  { name: 'Kurayami', logo: '/logos/kurayami.jpeg' },
  { name: 'Champions of Doom', logo: '/logos/Champs of doom.jpg' },
  { name: 'Miracle X', logo: '/logos/miracle x.jpeg' },
  { name: 'Nexus Breaker', logo: '/logos/Nexus breakers.jpeg' },
  { name: 'Nightfall', logo: '/logos/Nightfall.jpeg' },
  { name: "Ras'haghul", logo: '/logos/rasalghuls.jpg' },
  { name: 'The Disciples', logo: '/logos/The Disciples .jpeg' },
  { name: 'R1 Esports', logo: '/logos/R1.jpeg' },
  { name: 'Raging Fire', logo: '/logos/Raging fire.jpg' },
  { name: 'D Twelve', logo: '/logos/D Twelve.jpg' },
  { name: 'Realm of Kings', logo: '/logos/\u0280\u1d07\u1d00\u029f\u1d0d \u1d0f\ua730 \u1d0b\u026a\u0274\u0262\ua731 20260411_053152 - Arnold Lawson.jpg' },
  { name: 'Ordeals of Fate', logo: '/logos/ordeal of fate.jpg' },
  { name: 'ZEN INT', logo: '/logos/Zen int.jpeg' },
  { name: 'DARKSTAR', logo: '/logos/Darkstars.jpg' },
  { name: 'Night Fall X', logo: '/logos/Night fall.png' },
  { name: 'BTAR', logo: '/logos/\u00dft\u00aar\u2606\u2022\u00b0.jpeg' },
  { name: 'The Puppies', logo: '/logos/The puppies.jpeg' },
  { name: 'ECLIPSE', logo: '/logos/eclipse.jpeg' },
  { name: 'Eternum All Stars', logo: '/logos/Eternum All stars.jpg' },
  { name: 'Astral', logo: '/logos/astral.jpeg' },
  { name: 'Athlegamesports', logo: '/logos/athlegame esports.jpeg' },
  { name: 'Divine Gooners', logo: '/logos/DiViNE GOONERS.jpeg' },
  { name: 'Task Force 9', logo: '/logos/Task Force 9.jpg' },
  { name: 'La Familia', logo: '/logos/la Familia.jpg' },
  { name: 'THE OATHKEEPERS', logo: '/logos/THE OATHKEEPERS.jpg' },
  { name: 'DEATHSIRENS', logo: '/logos/DeathSirens.jpg' },
  { name: 'Death Legion', logo: '/logos/DEATH LEGION.webp' },
  { name: 'FIERCE GUARDIAN', logo: '/logos/fierce guardian.png' },
  { name: 'GPOW XTREMEX ESPORTS', logo: '/logos/GPOW XTREMEX ESPORTS.jpeg' },
];

async function main() {
  console.log('Wiping Supabase PostgreSQL database...');

  // Clean everything
  await prisma.pick.deleteMany({});
  await prisma.ban.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.tournament.deleteMany({});

  console.log('Creating admin accounts...');
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('r4FGP2F@Egse9Hy', salt);

  await prisma.adminUser.create({
    data: {
      email: 'oreoluwaalawaye@gmail.com',
      password: adminPassword,
      name: 'Oreoluwa Alawaye',
      role: 'admin'
    }
  });
  console.log('Created Admin user: oreoluwaalawaye@gmail.com');

  // Create tournament with Logo and Banner!
  const tournament = await prisma.tournament.create({
    data: {
      name: 'AFL NIGERIA SERVER',
      status: 'live',
      startDate: new Date(),
      logoUrl: '/afl-logo.png',
      bannerUrl: '/afl-banner.png'
    }
  });
  console.log(`Created tournament with custom logo and banner: ${tournament.name} (${tournament.id})`);

  // Create all 45 teams
  for (const t of TEAMS) {
    await prisma.team.create({
      data: { name: t.name, logoUrl: t.logo }
    });
  }
  console.log(`Created ${TEAMS.length} teams`);

  console.log('Database seeded successfully in Supabase!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
