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
  const { username, gameId, realName, state, rank, role, pictureUrl } = body;

  if (!username?.trim() || username.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
  }

  if (!gameId?.trim()) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
  }

  // We store admin identity in Player.realName as "admin:<email>" so we can look it up
  const adminTag = `admin:${session.user.email}`;

  // Check if another player already has this username (that isn't ours)
  const usernameConflict = await prisma.player.findFirst({
    where: {
      username: username.trim(),
      NOT: { realName: adminTag },
    },
  });
  if (usernameConflict) {
    return NextResponse.json({ error: 'That username is already taken by another player' }, { status: 400 });
  }

  // Check if another player already has this gameId (that isn't ours)
  const gameIdConflict = await prisma.player.findFirst({
    where: {
      gameId: gameId.trim(),
      NOT: { realName: adminTag },
    },
  });
  if (gameIdConflict) {
    return NextResponse.json({ error: 'That Game ID is already linked to another account' }, { status: 400 });
  }

  // Find the existing player record for this admin (by stable adminTag)
  const existing = await prisma.player.findFirst({
    where: { realName: adminTag },
  });

  let player;
  if (existing) {
    // Update in place — never changes the realName (admin tag)
    player = await prisma.player.update({
      where: { id: existing.id },
      data: {
        username:   username.trim(),
        gameId:     gameId.trim(),
        state:      state      || 'Lagos',
        rank:       rank       || 'Epic',
        role:       role       || 'PLAYER',
        pictureUrl: pictureUrl || existing.pictureUrl,
        // Keep realName as adminTag — never expose real name via this route
      },
    });
  } else {
    // Create a brand-new player record tagged to this admin account
    player = await prisma.player.create({
      data: {
        username:   username.trim(),
        gameId:     gameId.trim(),
        realName:   adminTag,
        state:      state      || 'Lagos',
        rank:       rank       || 'Epic',
        role:       role       || 'PLAYER',
        pictureUrl: pictureUrl || null,
      },
    });
  }

  return NextResponse.json({ success: true, player });
}
