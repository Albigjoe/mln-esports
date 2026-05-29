import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, gameId, realName, teamId, role, rank, state, pictureUrl } = body;

    const player = await prisma.player.update({
      where: { id },
      data: {
        username,
        gameId:     gameId     || null,
        realName:   realName   || '',
        teamId:     teamId     || null,
        role:       role       || '',
        rank:       rank       || '',
        state:      state      || '',
        pictureUrl: pictureUrl || '',
      },
    });

    return NextResponse.json({ success: true, player });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
