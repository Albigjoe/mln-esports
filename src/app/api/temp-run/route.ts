import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== 'mln-restore-secret-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all teams and check for trailing/leading spaces
    const teams = await prisma.team.findMany();
    const updatedTeams = [];

    for (const team of teams) {
      const trimmedName = team.name.trim();
      if (team.name !== trimmedName) {
        // Check if there is already a team with the trimmed name to avoid unique constraint conflict
        const conflict = teams.find(t => t.name === trimmedName);
        if (conflict) {
          updatedTeams.push({
            id: team.id,
            original: team.name,
            trimmed: trimmedName,
            status: `SKIPPED (Conflict with existing team ID: ${conflict.id})`
          });
        } else {
          await prisma.team.update({
            where: { id: team.id },
            data: { name: trimmedName }
          });
          updatedTeams.push({
            id: team.id,
            original: team.name,
            trimmed: trimmedName,
            status: 'UPDATED'
          });
        }
      }
    }

    // 2. Fetch all players and check for trailing/leading spaces in usernames
    const players = await prisma.player.findMany();
    const updatedPlayers = [];

    for (const player of players) {
      const trimmedUsername = player.username.trim();
      if (player.username !== trimmedUsername) {
        const conflict = players.find(p => p.username === trimmedUsername);
        if (conflict) {
          updatedPlayers.push({
            id: player.id,
            original: player.username,
            trimmed: trimmedUsername,
            status: `SKIPPED (Conflict with existing player ID: ${conflict.id})`
          });
        } else {
          const oldUsername = player.username;
          await prisma.player.update({
            where: { id: player.id },
            data: { username: trimmedUsername }
          });
          
          // Sync historical picks
          await prisma.pick.updateMany({
            where: { playerUsername: oldUsername },
            data: { playerUsername: trimmedUsername }
          });

          updatedPlayers.push({
            id: player.id,
            original: player.username,
            trimmed: trimmedUsername,
            status: 'UPDATED'
          });
        }
      }
    }

    // 3. Search specifically for "Oasis" to see what is currently in the DB
    const oasisTeams = await prisma.team.findMany({
      where: { name: { contains: 'oasis', mode: 'insensitive' } },
      include: { players: true }
    });

    return NextResponse.json({
      success: true,
      updatedTeams,
      updatedPlayers,
      oasisTeams: oasisTeams.map(t => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logoUrl,
        playerCount: t.players.length,
        players: t.players.map(p => ({ id: p.id, username: p.username, gameId: p.gameId }))
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
