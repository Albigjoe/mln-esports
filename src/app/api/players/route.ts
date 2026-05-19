import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: { team: true },
      orderBy: { username: 'asc' },
    });
    return NextResponse.json({ success: true, players });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, pictureUrl, realName, teamId } = body;

    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

    const player = await prisma.player.create({
      data: { 
        username, 
        pictureUrl: pictureUrl || null, 
        realName: realName || null,
        teamId: teamId || null
      },
    });

    return NextResponse.json({ success: true, player });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
