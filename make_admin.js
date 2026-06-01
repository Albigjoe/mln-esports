const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  const email = 'ayomega2001@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log(`Successfully made ${email} an ADMIN.`);
  } else {
    // If the user hasn't signed up yet, we can't make them admin. Or maybe we can create a dummy?
    // They must sign up first via Discord/Google before we can change their role.
    console.log(`User ${email} not found in the database. They must sign in at least once first.`);
  }
  process.exit(0);
}

makeAdmin();
