import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/teams/apply — Players apply to join a specific squad
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the player profile for this user
    const player = await prisma.player.findFirst({
      where: { realName: `admin:${session.user.email}` }
    });
    if (!player) {
      return NextResponse.json({ error: 'You must set up a player profile first before applying to squads.' }, { status: 400 });
    }

    if (player.teamId) {
      return NextResponse.json({ error: 'You are already registered on a team. Leave your current team to apply to others.' }, { status: 400 });
    }

    const body = await req.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    // Check if there is already a pending join request for this player to this team
    const existing = await prisma.joinRequest.findFirst({
      where: {
        playerId: player.id,
        teamId,
        status: 'PENDING'
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending application to this squad.' }, { status: 400 });
    }

    // Create join request
    const request = await prisma.joinRequest.create({
      data: {
        playerId: player.id,
        teamId,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/teams/apply — Captains accept or decline a join request
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action } = body; // action is 'accept' or 'decline'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { team: true, player: true }
    });

    if (!request) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: 'This request has already been processed.' }, { status: 400 });
    }

    // Validate that the logged-in user is the owner (captain) of the team
    if (request.team.ownerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized: Only the team captain can manage join requests.' }, { status: 403 });
    }

    if (action === 'accept') {
      // 1. Assign player to the team
      await prisma.player.update({
        where: { id: request.playerId },
        data: { teamId: request.teamId }
      });

      // 2. Mark this request as accepted
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // 3. Automatically decline all other pending requests for this player
      await prisma.joinRequest.updateMany({
        where: {
          playerId: request.playerId,
          status: 'PENDING'
        },
        data: { status: 'DECLINED' }
      });

      return NextResponse.json({ success: true, message: 'Player added to squad successfully.' });
    } else if (action === 'decline') {
      // Mark request as declined
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' }
      });

      return NextResponse.json({ success: true, message: 'Request declined.' });
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be accept or decline.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
