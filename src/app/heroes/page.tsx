import { prisma } from '@/lib/prisma';
import HeroesTable from '@/components/HeroesTable';

export const dynamic = 'force-dynamic';

async function buildHeroMeta() {
  const allGames = await prisma.game.findMany({
    include: { picks: true, bans: true },
  });

  const totalGames = allGames.length;
  if (totalGames === 0) return { heroStats: [], totalGames: 0 };

  const heroMap: Record<string, {
    picks: number; bans: number; wins: number;
    kills: number; deaths: number; assists: number;
    damage: number; savages: number; maniacs: number;
  }> = {};

  allGames.forEach(game => {
    (game.bans || []).forEach(ban => {
      if (!ban?.hero?.trim()) return;
      const k = ban.hero.trim();
      if (!heroMap[k]) heroMap[k] = { picks: 0, bans: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, savages: 0, maniacs: 0 };
      heroMap[k].bans++;
    });
    (game.picks || []).forEach(pick => {
      if (!pick?.hero?.trim()) return;
      const k = pick.hero.trim();
      if (!heroMap[k]) heroMap[k] = { picks: 0, bans: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, savages: 0, maniacs: 0 };
      heroMap[k].picks++;
      heroMap[k].kills   += pick.kills   || 0;
      heroMap[k].deaths  += pick.deaths  || 0;
      heroMap[k].assists += pick.assists || 0;
      heroMap[k].damage  += pick.damage  || 0;
      heroMap[k].savages += pick.savages || 0;
      heroMap[k].maniacs += pick.maniacs || 0;
      const isT1 = pick.team === 'team1';
      const won  = (isT1 && game.winner === 'team1') || (!isT1 && game.winner === 'team2');
      if (won) heroMap[k].wins++;
    });
  });

  const heroStats = Object.entries(heroMap).map(([hero, s]) => {
    const presence = ((s.picks + s.bans) / totalGames) * 100;
    const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
    return {
      hero,
      picks:     s.picks,
      bans:      s.bans,
      wins:      s.wins,
      pickRate:  parseFloat(((s.picks / totalGames) * 100).toFixed(1)),
      banRate:   parseFloat(((s.bans  / totalGames) * 100).toFixed(1)),
      presence:  parseFloat(presence.toFixed(1)),
      winRate:   parseFloat(s.picks > 0 ? ((s.wins / s.picks) * 100).toFixed(1) : '0'),
      kda:       parseFloat(kda.toFixed(2)),
      avgDamage: s.picks > 0 ? Math.round(s.damage / s.picks) : 0,
      savages:   s.savages,
      maniacs:   s.maniacs,
    };
  }).sort((a, b) => b.presence - a.presence);

  return { heroStats, totalGames };
}

export default async function HeroesPage() {
  const { heroStats, totalGames } = await buildHeroMeta();

  return (
    <div className="min-h-screen bg-background text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Competitive</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">Hero Meta Tracker</h1>
          <p className="text-gray-400 text-sm">Real-time meta analysis based on {totalGames} competitive game{totalGames !== 1 ? 's' : ''}. Updated after every match.</p>
        </div>

        {/* Meta Summary Cards */}
        {heroStats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Total Games</span>
              <span className="text-3xl font-black text-white">{totalGames}</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Heroes Tracked</span>
              <span className="text-3xl font-black text-mln-green">{heroStats.length}</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Top Pick</span>
              <span className="text-lg font-black text-white">{heroStats[0]?.hero || '—'}</span>
              <span className="text-xs text-mln-green font-bold block">{heroStats[0]?.pickRate}% pick rate</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Top Ban</span>
              <span className="text-lg font-black text-white">{[...heroStats].sort((a, b) => b.banRate - a.banRate)[0]?.hero || '—'}</span>
              <span className="text-xs text-gray-400 font-bold block">{[...heroStats].sort((a, b) => b.banRate - a.banRate)[0]?.banRate}% ban rate</span>
            </div>
          </div>
        )}

        {totalGames === 0 ? (
          <div className="bg-surface border border-border-color rounded-xl p-16 text-center">
            <div className="text-6xl mb-4">🗡️</div>
            <h2 className="text-2xl font-black text-white mb-2">No Match Data Yet</h2>
            <p className="text-gray-400">Hero stats will appear automatically once match data is entered.</p>
          </div>
        ) : (
          <HeroesTable heroStats={heroStats} />
        )}
      </div>
    </div>
  );
}
