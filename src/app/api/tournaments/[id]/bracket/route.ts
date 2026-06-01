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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    // 3. Calculate bracket size
    const numTeams = participants.length;
    const rounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, rounds);
    const byes = bracketSize - numTeams;

    // 4. Shuffle teams for random seeding (could be improved with proper seeding later)
    const shuffledTeams = shuffleArray(participants.map(p => p.teamId));

    // Array to store generated matches locally before batch inserting
    // We need to generate from Final down to Round 1 to easily link nextMatchId
    const matches: any[] = [];
    
    // We'll create a tree. Root is the final match.
    // round ranges from 1 to `rounds`
    let currentMatchId = 1;
    
    const generateMatches = (round: number, matchOrder: number, nextMatchLocalId: number | null): any => {
      const localId = currentMatchId++;
      const match = {
        localId,
        tournamentId: id,
        stage: 'KNOCKOUT',
        round,
        matchOrder,
        nextMatchLocalId, // temporary reference
        isBye: false,
        status: 'PENDING',
        team1Id: null,
        team2Id: null,
      };
      
      matches.push(match);

      if (round > 1) {
        // Create two children in the previous round
        generateMatches(round - 1, matchOrder * 2 - 1, localId);
        generateMatches(round - 1, matchOrder * 2, localId);
      }
      
      return match;
    };

    // Generate the empty tree starting from the Final
    generateMatches(rounds, 1, null);

    // 5. Assign teams to Round 1
    const round1Matches = matches.filter(m => m.round === 1).sort((a, b) => a.matchOrder - b.matchOrder);
    
    // Distribute teams and byes
    // A standard approach for byes is to distribute them evenly or give them to top seeds.
    // Since we randomized, we'll just fill teams sequentially.
    let teamIndex = 0;
    let byesRemaining = byes;

    for (let match of round1Matches) {
      // If we have teams left
      if (teamIndex < shuffledTeams.length) {
        match.team1Id = shuffledTeams[teamIndex++];
      }
      
      // Should this match get a bye for team2?
      // For a perfectly balanced bracket, byes are distributed. 
      // Simplest approach: if we have byes remaining, this match gets a bye.
      if (byesRemaining > 0) {
        match.isBye = true;
        match.status = 'COMPLETED'; // automatically advance team1
        match.winnerId = match.team1Id;
        byesRemaining--;
      } else if (teamIndex < shuffledTeams.length) {
        match.team2Id = shuffledTeams[teamIndex++];
      }
    }

    // 6. Insert matches into DB and resolve nextMatchIds
    // We need to map localId to actual DB cuid
    // Prisma createMany doesn't return IDs, so we have to create one by one, 
    // starting from round 1 up to `rounds` so we can link `nextMatchId`?
    // Wait, it's easier to create them top-down (Finals first), get the ID, then pass it to children.
    
    const sortedMatchesToInsert = matches.sort((a, b) => b.round - a.round); // Final first
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

    // 7. Auto-advance Byes to Round 2
    // If a match in Round 1 is a bye, team1 advances to the nextMatchId
    const generatedMatches = await prisma.bracketMatch.findMany({ where: { tournamentId: id } });
    
    for (let m of generatedMatches) {
      if (m.isBye && m.winnerId && m.nextMatchId) {
        const nextMatch = generatedMatches.find(x => x.id === m.nextMatchId);
        if (nextMatch) {
          // Is it team1 or team2 slot in the next match?
          // Since we generate left child then right child, odd matchOrder feeds team1, even feeds team2
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

    return NextResponse.json({ success: true, message: 'Bracket generated successfully' });
  } catch (error: any) {
    console.error('Bracket Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
