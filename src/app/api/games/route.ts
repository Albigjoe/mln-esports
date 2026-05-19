import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tournamentId, team1Id, team2Id, winner, week, gameNumber, date, bans, picks } = body;

    if (!tournamentId || !team1Id || !team2Id || !winner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        tournamentId,
        team1Id,
        team2Id,
        winner,
        week: parseInt(week) || 1,
        gameNumber: parseInt(gameNumber) || 1,
        date: date || '',
        bans: {
          create: (bans || []).filter((b: any) => b.hero?.trim()).map((b: any) => ({
            team: b.team,
            hero: b.hero.trim(),
            banOrder: b.banOrder,
          })),
        },
        picks: {
          create: (picks || []).filter((p: any) => p.hero?.trim()).map((p: any) => ({
            team: p.team,
            hero: p.hero.trim(),
            playerUsername: p.playerUsername || '',
            role: p.role || '',
            kills: parseInt(p.kills) || 0,
            deaths: parseInt(p.deaths) || 0,
            assists: parseInt(p.assists) || 0,
            gold: parseInt(p.gold) || 0,
            damage: parseInt(p.damage) || 0,
            pickOrder: p.pickOrder || 0,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, gameId: game.id });
  } catch (error: any) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
