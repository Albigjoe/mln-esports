import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/profile — fetch current session user's linked player
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { email: session.user.email },
  });
  if (!adminUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Find player linked by adminEmail stored in realName field as "admin:<email>"
  const player = await prisma.player.findFirst({
    where: { realName: `admin:${session.user.email}` },
    include: { team: true },
  });

  return NextResponse.json({ adminUser, player });
}

// PUT /api/profile — upsert the player record for this admin user
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { email: session.user.email },
  });
  if (!adminUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { username, realName, state, rank, role } = body;

  if (!username?.trim() || username.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
  }

  // We store admin identity in Player.realName as "admin:<email>" so we can look it up
  const adminTag = `admin:${session.user.email}`;

  // Check if another player already has this username (that isn't ours)
  const conflict = await prisma.player.findFirst({
    where: {
      username: username.trim(),
      NOT: { realName: adminTag },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: 'That username is already taken by another player' }, { status: 400 });
  }

  // Upsert by our admin tag
  const player = await prisma.player.upsert({
    where: {
      // We need a unique field — use username, but first try to find existing by adminTag
      username: username.trim(),
    },
    update: {
      realName: realName?.trim() ? realName.trim() : adminTag,
      state:    state  || 'Lagos',
      rank:     rank   || 'Epic',
      role:     role   || 'PLAYER',
    },
    create: {
      username: username.trim(),
      realName: adminTag, // Tag it so we can find it later
      state:    state  || 'Lagos',
      rank:     rank   || 'Epic',
      role:     role   || 'PLAYER',
    },
  });

  return NextResponse.json({ success: true, player });
}
