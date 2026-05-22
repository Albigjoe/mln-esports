import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Build hero meta stats from all picks across all games
async function buildHeroMeta() {
  const allGames = await prisma.game.findMany({
    include: {
      picks: true,
      bans: true,
    },
  });

  const totalGames = allGames.length;
  if (totalGames === 0) return { heroStats: [], totalGames: 0 };

  const heroMap: Record<string, {
    picks: number;
    bans: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    savages: number;
    maniacs: number;
  }> = {};

  allGames.forEach(game => {
    // Count bans
    (game.bans || []).forEach(ban => {
      if (!ban || !ban.hero || !ban.hero.trim()) return;
      const hKey = ban.hero.trim();
      if (!heroMap[hKey]) heroMap[hKey] = { picks: 0, bans: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, savages: 0, maniacs: 0 };
      heroMap[hKey].bans++;
    });

    // Count picks + performance
    (game.picks || []).forEach(pick => {
      if (!pick || !pick.hero || !pick.hero.trim()) return;
      const hKey = pick.hero.trim();
      if (!heroMap[hKey]) heroMap[hKey] = { picks: 0, bans: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, savages: 0, maniacs: 0 };
      heroMap[hKey].picks++;
      heroMap[hKey].kills += (pick.kills || 0);
      heroMap[hKey].deaths += (pick.deaths || 0);
      heroMap[hKey].assists += (pick.assists || 0);
      heroMap[hKey].damage += (pick.damage || 0);
      heroMap[hKey].savages += (pick.savages || 0);
      heroMap[hKey].maniacs += (pick.maniacs || 0);

      const isTeam1 = pick.team === 'team1';
      const won = (isTeam1 && game.winner === 'team1') || (!isTeam1 && game.winner === 'team2');
      if (won) heroMap[hKey].wins++;
    });
  });

  const heroStats = Object.entries(heroMap).map(([hero, s]) => {
    const presence = ((s.picks + s.bans) / totalGames) * 100;
    const pickRate = (s.picks / totalGames) * 100;
    const banRate = (s.bans / totalGames) * 100;
    const winRate = s.picks > 0 ? (s.wins / s.picks) * 100 : 0;
    const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
    const avgDamage = s.picks > 0 ? s.damage / s.picks : 0;
    return {
      hero,
      picks: s.picks,
      bans: s.bans,
      wins: s.wins,
      pickRate: parseFloat(pickRate.toFixed(1)),
      banRate: parseFloat(banRate.toFixed(1)),
      presence: parseFloat(presence.toFixed(1)),
      winRate: parseFloat(winRate.toFixed(1)),
      kda: parseFloat(kda.toFixed(2)),
      avgDamage: Math.round(avgDamage),
      savages: s.savages,
      maniacs: s.maniacs,
    };
  }).sort((a, b) => b.presence - a.presence);

  return { heroStats, totalGames };
}

const HERO_IMG = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/hp_hero/hero_${slug}.png`;
};

export default async function HeroesPage() {
  const { heroStats, totalGames } = await buildHeroMeta();

  const tierColor = (presence: number) => {
    if (presence >= 80) return 'text-mln-green border-mln-green bg-mln-green/10';
    if (presence >= 50) return 'text-white border-border-color bg-surface';
    return 'text-gray-400 border-border-color bg-background';
  };

  const tierLabel = (presence: number) => {
    if (presence >= 80) return 'S';
    if (presence >= 50) return 'A';
    if (presence >= 25) return 'B';
    return 'C';
  };

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Competitive</span>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">Hero Meta Tracker</h1>
          <p className="text-gray-400 text-sm">Real-time meta analysis based on {totalGames} competitive games. Updated after every match.</p>
        </div>

        {/* Meta Summary Cards */}
        {heroStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-surface border border-border-color rounded-xl p-5 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Total Games</span>
              <span className="text-3xl font-black text-white">{totalGames}</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-5 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Heroes Tracked</span>
              <span className="text-3xl font-black text-mln-green">{heroStats.length}</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-5 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Top Pick</span>
              <span className="text-xl font-black text-white">{heroStats[0]?.hero || '—'}</span>
              <span className="text-xs text-mln-green font-bold">{heroStats[0]?.pickRate}% pick rate</span>
            </div>
            <div className="bg-surface border border-border-color rounded-xl p-5 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Top Ban</span>
              <span className="text-xl font-black text-white">{[...heroStats].sort((a, b) => b.banRate - a.banRate)[0]?.hero || '—'}</span>
              <span className="text-xs text-gray-400 font-bold">{[...heroStats].sort((a, b) => b.banRate - a.banRate)[0]?.banRate}% ban rate</span>
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
          <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-color flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Full Hero Statistics</h2>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sorted by Presence Rate</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-[10px] uppercase text-gray-400 font-bold tracking-widest">
                  <tr>
                    <th className="px-4 py-4 w-12">Tier</th>
                    <th className="px-4 py-4">Hero</th>
                    <th className="px-4 py-4 text-center">Picks</th>
                    <th className="px-4 py-4 text-center">Bans</th>
                    <th className="px-4 py-4 text-center">Pick%</th>
                    <th className="px-4 py-4 text-center">Ban%</th>
                    <th className="px-4 py-4 text-center">Presence%</th>
                    <th className="px-4 py-4 text-center">Win%</th>
                    <th className="px-4 py-4 text-center">KDA</th>
                    <th className="px-4 py-4 text-center">Savages</th>
                  </tr>
                </thead>
                <tbody>
                  {heroStats.map((h) => (
                    <tr key={h.hero} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-7 h-7 rounded border flex items-center justify-center text-[11px] font-black ${tierColor(h.presence)}`}>
                          {tierLabel(h.presence)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={HERO_IMG(h.hero)}
                            alt={h.hero}
                            className="w-8 h-8 rounded-full object-cover bg-background border border-border-color"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                          <span className="font-bold text-white">{h.hero}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">{h.picks}</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-400">{h.bans}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-mln-green font-bold">{h.pickRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-gray-400">{h.banRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-mln-green rounded-full" style={{ width: `${Math.min(h.presence, 100)}%` }} />
                          </div>
                          <span className="font-mono font-bold text-white text-xs">{h.presence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-bold text-sm ${h.winRate >= 60 ? 'text-mln-green' : h.winRate <= 40 ? 'text-gray-500' : 'text-white'}`}>
                          {h.picks > 0 ? `${h.winRate}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-white">{h.picks > 0 ? h.kda : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {h.savages > 0 ? (
                          <span className="text-mln-green font-black text-xs">⚡ {h.savages}</span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
