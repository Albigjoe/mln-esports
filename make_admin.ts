import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { prisma } from './src/lib/prisma';

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
    console.log(`User ${email} not found in the database. They must sign in at least once first.`);
  }
  process.exit(0);
}

makeAdmin();
