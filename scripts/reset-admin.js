const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'oreoluwaalawaye@gmail.com';
  const plainPassword = 'r4FGP2F@Egse9Hy';

  console.log(`Checking user with email: ${email}`);
  
  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User not found! Creating new admin user...`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const newUser = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Oreoluwa Alawaye',
        role: 'admin',
      },
    });
    console.log(`Successfully created new admin user with ID: ${newUser.id}`);
  } else {
    console.log(`User found! Stored password value: ${user.password}`);
    const isAlreadyBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2y$') || user.password.startsWith('$2b$');
    
    if (!isAlreadyBcrypt) {
      console.log(`Detected plain-text or unhashed password in database. Hashing it now...`);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await prisma.adminUser.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`Successfully updated and hashed password for ${email}`);
    } else {
      console.log(`Password is already hashed with bcrypt. Let's force re-hash to be absolutely certain...`);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await prisma.adminUser.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`Successfully forced re-hashed password for ${email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
