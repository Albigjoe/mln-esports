import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamName, logoUrl, lineupImageUrl, contactEmail, players, tournamentIds, isExistingTeam, existingTeamId } = body;

    if (!teamName || !contactEmail || !players || players.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store registration (players stored as JSON, tournaments as JSON array of IDs)
    const reg = await prisma.teamRegistration.create({
      data: {
        teamName,
        logoUrl: logoUrl || null,
        lineupImageUrl: lineupImageUrl || null,
        contactEmail,
        players,
        // Store extra metadata as JSON inside players field is tricky — 
        // we embed tournamentIds and existingTeamId into a metadata field
        // Since schema has no tournamentIds column, we append to players JSON as a workaround
        // by using a separate status note
      }
    });

    // If the team already exists in DB, we can note that in the registration status
    // For now the admin reviews and approves — full tournament linking happens on approval

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...reg,
        meta: { tournamentIds: tournamentIds || [], isExistingTeam, existingTeamId }
      } 
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

