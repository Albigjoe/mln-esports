require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding admin ayomega2001@gmail.com...');
  
  // Check if already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email: 'ayomega2001@gmail.com' }
  });
  
  if (existing) {
    console.log('Admin already exists!');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('r4FGP2F@Egse9Hy', salt);

  await prisma.adminUser.create({
    data: {
      email: 'ayomega2001@gmail.com',
      password: adminPassword,
      name: 'Ayomega',
      role: 'admin'
    }
  });
  console.log('Added Admin user: ayomega2001@gmail.com');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
