import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams/[id]/roster — returns all players on a team
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const players = await prisma.player.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        rank: true,
        state: true,
        pictureUrl: true,
        gameId: true,
      },
    });
    return NextResponse.json({ players });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
