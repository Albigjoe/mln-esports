import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams?q=searchterm — for autocomplete
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const teams = await prisma.team.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      take: 10,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    });
    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logoUrl, ownerEmail } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const team = await prisma.team.create({
      data: { 
        name, 
        logoUrl: logoUrl || null,
        ownerEmail: ownerEmail || null
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, ids, deleteAll } = body;

    let teamIds: string[] = [];

    if (deleteAll) {
      const allTeams = await prisma.team.findMany({ select: { id: true } });
      teamIds = allTeams.map(t => t.id);
    } else if (ids && Array.isArray(ids)) {
      teamIds = ids;
    } else if (id) {
      teamIds = [id];
    }

    if (teamIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No teams to delete' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update players referencing these teamIds to set teamId: null
      await tx.player.updateMany({
        where: { teamId: { in: teamIds } },
        data: { teamId: null }
      });

      // 2. Update awards referencing these teamIds to set teamId: null
      await tx.award.updateMany({
        where: { teamId: { in: teamIds } },
        data: { teamId: null }
      });

      // 3. Delete scrim requests referencing these teams
      await tx.scrimRequest.deleteMany({
        where: {
          OR: [
            { challengerTeamId: { in: teamIds } },
            { receiverTeamId: { in: teamIds } }
          ]
        }
      });

      // 4. Delete games referencing these teamIds as team1Id or team2Id
      await tx.game.deleteMany({
        where: {
          OR: [
            { team1Id: { in: teamIds } },
            { team2Id: { in: teamIds } }
          ]
        }
      });

      // 4.5 Delete Join Requests
      await tx.joinRequest.deleteMany({
        where: { teamId: { in: teamIds } }
      });

      // 5. Delete the teams
      await tx.team.deleteMany({
        where: { id: { in: teamIds } }
      });
    });

    return NextResponse.json({ success: true, count: teamIds.length });
  } catch (error: any) {
    console.error('Delete teams error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
