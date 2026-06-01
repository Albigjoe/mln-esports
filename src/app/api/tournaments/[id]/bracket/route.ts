import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Helper to shuffle an array
function shuffleArray(array: any[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matches = await prisma.bracketMatch.findMany({
      where: { tournamentId: id },
      include: {
        team1: { select: { id: true, name: true, logoUrl: true } },
        team2: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: [
        { round: 'asc' },
        { matchOrder: 'asc' }
      ]
    });
    
    return NextResponse.json({ matches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { generateRoundRobinMatches, generateSingleEliminationMatches, generateDoubleEliminationMatches } from '@/lib/bracketGenerator';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // 1. Fetch participants
    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: id },
      include: { team: true }
    });

    if (participants.length < 2) {
      return NextResponse.json({ error: 'At least 2 teams are required to generate a bracket.' }, { status: 400 });
    }

    // 2. Clear existing bracket for this tournament
    await prisma.bracketMatch.deleteMany({
      where: { tournamentId: id }
    });

    // 3. Prepare teams
    const numTeams = participants.length;
    const seededParticipants = participants.filter(p => p.seed !== null).sort((a, b) => a.seed! - b.seed!);
    const unseededParticipants = shuffleArray(participants.filter(p => p.seed === null));
    const orderedTeams = [...seededParticipants, ...unseededParticipants].map(p => p.teamId);

    const format = tournament.format || 'SINGLE_ELIMINATION';
    
    let generatedMatches: any[] = [];
    
    if (format === 'ROUND_ROBIN') {
      generatedMatches = generateRoundRobinMatches(id, orderedTeams, 4);
      
      // Insert RR matches (no nextMatchId needed)
      for (let m of generatedMatches) {
        await prisma.bracketMatch.create({
          data: {
            tournamentId: m.tournamentId,
            stage: m.stage,
            round: m.round,
            matchOrder: m.matchOrder,
            isBye: m.isBye,
            status: m.status,
            team1Id: m.team1Id,
            team2Id: m.team2Id,
            winnerId: m.winnerId,
          }
        });
      }

    } else {
      // KNOCKOUT BRACKETS
      if (format === 'DOUBLE_ELIMINATION') {
        generatedMatches = generateDoubleEliminationMatches(id, orderedTeams, numTeams);
      } else {
        generatedMatches = generateSingleEliminationMatches(id, orderedTeams, numTeams).matches;
      }

      // Insert and map localId to DB id
      const sortedMatchesToInsert = generatedMatches.sort((a, b) => b.round - a.round); // Final first
      const idMap = new Map<number, string>();

      for (let m of sortedMatchesToInsert) {
        const created = await prisma.bracketMatch.create({
          data: {
            tournamentId: m.tournamentId,
            stage: m.stage,
            round: m.round,
            matchOrder: m.matchOrder,
            isBye: m.isBye,
            status: m.status,
            team1Id: m.team1Id,
            team2Id: m.team2Id,
            winnerId: m.winnerId,
            nextMatchId: m.nextMatchLocalId ? idMap.get(m.nextMatchLocalId) : null,
          }
        });
        idMap.set(m.localId, created.id);
      }

      // Auto-advance Byes to Round 2
      const allMatches = await prisma.bracketMatch.findMany({ where: { tournamentId: id } });
      for (let m of allMatches) {
        if (m.isBye && m.winnerId && m.nextMatchId) {
          const nextMatch = allMatches.find(x => x.id === m.nextMatchId);
          if (nextMatch) {
            const isTeam1 = m.matchOrder % 2 !== 0;
            await prisma.bracketMatch.update({
              where: { id: nextMatch.id },
              data: {
                ...(isTeam1 ? { team1Id: m.winnerId } : { team2Id: m.winnerId })
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Bracket generated successfully' });
  } catch (error: any) {
    console.error('Bracket Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { matchId, score1, score2, winnerId, status } = body;

    if (!matchId) return NextResponse.json({ error: 'Match ID required' }, { status: 400 });

    const match = await prisma.bracketMatch.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Update match
    const updatedMatch = await prisma.bracketMatch.update({
      where: { id: matchId },
      data: { score1, score2, winnerId, status }
    });

    // Advance winner if completed and nextMatchId exists
    if (status === 'COMPLETED' && winnerId && match.nextMatchId) {
      const nextMatch = await prisma.bracketMatch.findUnique({ where: { id: match.nextMatchId } });
      if (nextMatch) {
        // Determine slot based on matchOrder parity (odd feeds team1, even feeds team2)
        const isTeam1 = match.matchOrder % 2 !== 0;
        await prisma.bracketMatch.update({
          where: { id: nextMatch.id },
          data: {
            ...(isTeam1 ? { team1Id: winnerId } : { team2Id: winnerId })
          }
        });
      }
    }

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
