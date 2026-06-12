import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, logoUrl, playerId, pictureUrl, username, gameId } = body;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Validate that the user is the owner
    if (team.ownerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized: Only the team owner can edit team details' }, { status: 403 });
    }

    // Support updating player details directly
    if (playerId) {
      const playerRecord = await prisma.player.findFirst({
        where: { id: playerId, teamId: id }
      });
      if (!playerRecord) {
        return NextResponse.json({ error: 'Player not found on this team' }, { status: 404 });
      }

      const updateData: any = {};
      if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.rank !== undefined) updateData.rank = body.rank;
      if (body.state !== undefined) updateData.state = body.state;

      // Handle username update if provided and changed
      if (username !== undefined && username.trim() !== playerRecord.username) {
        const newUsername = username.trim();
        if (newUsername.length < 2) {
          return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
        }
        
        // Conflict check
        const conflict = await prisma.player.findUnique({
          where: { username: newUsername }
        });
        if (conflict) {
          return NextResponse.json({ error: 'That username is already taken by another player' }, { status: 400 });
        }
        
        updateData.username = newUsername;
      }

      // Handle gameId update if provided and changed
      if (gameId !== undefined && gameId.trim() !== playerRecord.gameId) {
        const newGameId = gameId.trim();
        if (!newGameId) {
          return NextResponse.json({ error: 'Game ID cannot be empty' }, { status: 400 });
        }
        
        // Conflict check
        const conflict = await prisma.player.findUnique({
          where: { gameId: newGameId }
        });
        if (conflict) {
          return NextResponse.json({ error: 'That Game ID is already linked to another player account' }, { status: 400 });
        }
        
        updateData.gameId = newGameId;
      }

      const updatedPlayer = await prisma.player.update({
        where: { id: playerId },
        data: updateData
      });

      // Update historical picks if username changed
      if (updateData.username && playerRecord.username !== updateData.username) {
        await prisma.pick.updateMany({
          where: { playerUsername: playerRecord.username },
          data: { playerUsername: updateData.username }
        });
      }

      return NextResponse.json({ success: true, player: updatedPlayer });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: name ? name.trim() : team.name,
        logoUrl: logoUrl !== undefined ? logoUrl : team.logoUrl,
      },
    });

    return NextResponse.json({ success: true, team: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Validate that the user is the owner
    if (team.ownerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized: Only the team owner can add players' }, { status: 403 });
    }

    const body = await req.json();
    const { username, gameId, realName, role, rank, state, pictureUrl } = body;

    if (!username?.trim() || !gameId?.trim()) {
      return NextResponse.json({ error: 'IGN and Game ID are required' }, { status: 400 });
    }

    // Check if player already exists by username
    const existingPlayer = await prisma.player.findUnique({
      where: { username: username.trim() }
    });

    // Check if gameId is already taken by a DIFFERENT player
    const existingGameIdPlayer = await prisma.player.findUnique({
      where: { gameId: gameId.trim() }
    });

    if (existingPlayer) {
      if (existingGameIdPlayer && existingGameIdPlayer.id !== existingPlayer.id) {
        return NextResponse.json({ error: 'That Game ID is already linked to another player account' }, { status: 400 });
      }

      // If player is already on another team, don't allow stealing them unless owner kicks them first
      if (existingPlayer.teamId && existingPlayer.teamId !== id) {
        return NextResponse.json({ error: 'Player is already registered on another team' }, { status: 400 });
      }

      // Add to team and update fields
      const updatedPlayer = await prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          teamId: id,
          gameId: gameId.trim(),
          realName: realName || existingPlayer.realName,
          role: role || existingPlayer.role || 'PLAYER',
          rank: rank || existingPlayer.rank || 'Mythic',
          state: state || existingPlayer.state || 'Lagos',
          pictureUrl: pictureUrl || existingPlayer.pictureUrl,
        }
      });
      return NextResponse.json({ success: true, player: updatedPlayer });
    } else {
      if (existingGameIdPlayer) {
        return NextResponse.json({ error: 'That Game ID is already linked to another player account' }, { status: 400 });
      }

      // Create new player record and link to team
      const newPlayer = await prisma.player.create({
        data: {
          username: username.trim(),
          gameId: gameId.trim(),
          realName: realName || '',
          role: role || 'PLAYER',
          rank: rank || 'Mythic',
          state: state || 'Lagos',
          pictureUrl: pictureUrl || null,
          teamId: id,
        }
      });
      return NextResponse.json({ success: true, player: newPlayer });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId query param is required' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const playerToRemove = await prisma.player.findUnique({ where: { id: playerId } });
    if (!playerToRemove || playerToRemove.teamId !== id) {
      return NextResponse.json({ error: 'Player not found on this team' }, { status: 404 });
    }

    // Check permissions:
    // User can remove player if they are the owner OR if they are removing themselves (leaving the team)
    const isOwner = team.ownerEmail === session.user.email;

    // Look up the calling user's player record to check if they're removing themselves
    const callingPlayer = await prisma.player.findFirst({
      where: { realName: `admin:${session.user.email}` }
    });
    const isSelf = callingPlayer ? playerToRemove.id === callingPlayer.id : false;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Unauthorized: You can only remove players if you are the owner, or remove yourself to leave the team' }, { status: 403 });
    }

    // Perform removal: set teamId to null (do NOT delete the player record entirely)
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { teamId: null }
    });

    return NextResponse.json({ success: true, message: 'Player removed from team successfully', player: updatedPlayer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
