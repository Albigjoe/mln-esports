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

    const games = await prisma.game.findMany({
      include: {
        team1: { select: { name: true } },
        team2: { select: { name: true } },
        picks: true,
        tournament: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = games.map(g => ({
      id: g.id,
      tournament: g.tournament.name,
      week: g.week,
      gameNumber: g.gameNumber,
      date: g.date,
      matchup: `${g.team1.name} vs ${g.team2.name}`,
      winner: g.winner,
      picks: g.picks.map(p => ({
        hero: p.hero,
        team: p.team,
        player: p.playerUsername,
        damage: p.damage,
        damageTaken: p.damageTaken
      }))
    }));

    return NextResponse.json({ games: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
