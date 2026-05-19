import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const awards = await prisma.award.findMany({
    include: { player: true, team: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(awards);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, description, season, imageUrl, playerId, teamId } = body;

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const award = await prisma.award.create({
    data: {
      title,
      description: description || '',
      season: season || '',
      imageUrl: imageUrl || null,
      playerId: playerId || null,
      teamId: teamId || null,
    },
  });

  return NextResponse.json({ success: true, award });
}
