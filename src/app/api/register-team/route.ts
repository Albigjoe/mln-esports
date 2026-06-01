import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamName, logoUrl, lineupImageUrl, contactEmail, players, tournamentId, isExistingTeam, existingTeamId } = body;

    if (!teamName || !contactEmail || !players || players.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store registration
    const reg = await prisma.teamRegistration.create({
      data: {
        teamName,
        logoUrl: logoUrl || null,
        lineupImageUrl: lineupImageUrl || null,
        contactEmail,
        players,
        tournamentId: tournamentId || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...reg,
        meta: { isExistingTeam, existingTeamId }
      } 
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

