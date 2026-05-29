import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, teamName, logoUrl, lineupImageUrl, players } = await req.json();

    const reg = await prisma.teamRegistration.update({
      where: { id },
      data: { status }
    });

    if (status === 'APPROVED') {
      // Create team
      const newTeam = await prisma.team.create({
        data: {
          name: teamName,
          logoUrl: logoUrl || '',
          lineupImageUrl: lineupImageUrl || ''
        }
      });

      // Create or update players (upsert by username to avoid duplicate errors on re-approval)
      const playerPromises = players.map((p: any) => {
        const data = {
          username:   p.username,
          gameId:     p.gameId     || null,
          realName:   p.realName   || '',
          role:       p.role       || 'PLAYER',
          pictureUrl: p.pictureUrl || '',
          teamId:     newTeam.id,
          state:      p.state      || 'Lagos',
          rank:       p.rank       || 'Mythic',
        };
        return prisma.player.upsert({
          where:  { username: p.username },
          update: { ...data },
          create: { ...data },
        });
      });
      await Promise.all(playerPromises);
    }

    return NextResponse.json({ success: true, data: reg });
  } catch (error: any) {
    console.error('Registration Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await prisma.teamRegistration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
