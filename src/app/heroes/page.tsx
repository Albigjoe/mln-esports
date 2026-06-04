import { prisma } from '@/lib/prisma';
import { getHeroImage } from '@/lib/utils';
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

  const gamesWithDraft = allGames.filter(g => g.picks.length > 0 || g.bans.length > 0).length;
  const validGamesCount = Math.max(gamesWithDraft, 1);

  const heroStats = Object.entries(heroMap).map(([hero, s]) => {
    const presence = ((s.picks + s.bans) / validGamesCount) * 100;
    const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
    return {
      hero,
      picks:     s.picks,
      bans:      s.bans,
      wins:      s.wins,
      pickRate:  parseFloat(((s.picks / validGamesCount) * 100).toFixed(1)),
      banRate:   parseFloat(((s.bans  / validGamesCount) * 100).toFixed(1)),
      presence:  parseFloat(presence.toFixed(1)),
      winRate:   parseFloat(s.picks > 0 ? ((s.wins / s.picks) * 100).toFixed(1) : '0'),
      kda:       parseFloat(kda.toFixed(2)),
      avgDamage: s.picks > 0 ? Math.round(s.damage / s.picks) : 0,
      savages:   s.savages,
      maniacs:   s.maniacs,
    };
  }).sort((a, b) => b.presence - a.presence);

  return { heroStats, totalGames: gamesWithDraft };
}

export default async function HeroesPage() {
  const { heroStats, totalGames } = await buildHeroMeta();

  // Top 5 calculations
  const topPicks = [...heroStats]
    .sort((a, b) => b.picks - a.picks || b.presence - a.presence)
    .slice(0, 5);

  const topBans = [...heroStats]
    .sort((a, b) => b.bans - a.bans || b.presence - a.presence)
    .slice(0, 5);

  // Dynamic win rate threshold to filter out low-sample noise (e.g. 1 pick 100% WR)
  const minPicksForWinRate = totalGames <= 5 ? 1 : totalGames <= 20 ? 2 : Math.max(3, Math.ceil(totalGames * 0.05));
  let winRateFiltered = heroStats.filter(h => h.picks >= minPicksForWinRate);
  if (winRateFiltered.length < 5) {
    winRateFiltered = heroStats.filter(h => h.picks >= 1);
  }

  const topWinRates = [...winRateFiltered]
    .sort((a, b) => b.winRate - a.winRate || b.picks - a.picks)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 border-b border-border-color pb-6">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Competitive</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">Hero Meta Tracker</h1>
          <p className="text-gray-400 text-sm">Real-time meta analysis based on {totalGames} competitive game{totalGames !== 1 ? 's' : ''}. Updated after every match.</p>
        </div>

        {totalGames === 0 ? (
          <div className="bg-surface border border-border-color rounded-xl p-16 text-center">
            <div className="text-6xl mb-4">🗡️</div>
            <h2 className="text-2xl font-black text-white mb-2">No Match Data Yet</h2>
            <p className="text-gray-400">Hero stats will appear automatically once match data is entered.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Top 5 Row Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* TOP 5 HERO PICK */}
              <div className="bg-surface border border-border-color rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-mln-green/5 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-l-4 border-mln-green pl-3">
                    🔥 Top 5 Hero Pick
                  </h2>
                  <div className="grid grid-cols-5 gap-2">
                    {topPicks.map((h, i) => (
                      <div key={h.hero} className="flex flex-col items-center text-center group">
                        <div className="relative mb-2 shrink-0">
                          <span className="absolute -top-1.5 -left-1.5 bg-mln-green text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-surface z-10">
                            {i + 1}
                          </span>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-mln-green/30 group-hover:border-mln-green transition-all duration-300 overflow-hidden shadow-lg">
                            <img referrerPolicy="no-referrer" src={getHeroImage(h.hero)} alt={h.hero} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <span className="font-bold text-white text-[10px] sm:text-xs truncate w-full group-hover:text-mln-green transition-colors">{h.hero}</span>
                        <span className="text-[9px] text-gray-500 font-mono font-bold mt-0.5">{h.picks} Picks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TOP 5 HERO BAN */}
              <div className="bg-surface border border-border-color rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-l-4 border-red-500 pl-3">
                    🚫 Top 5 Hero Ban
                  </h2>
                  <div className="grid grid-cols-5 gap-2">
                    {topBans.map((h, i) => (
                      <div key={h.hero} className="flex flex-col items-center text-center group">
                        <div className="relative mb-2 shrink-0">
                          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-surface z-10">
                            {i + 1}
                          </span>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-red-500/30 group-hover:border-red-500 transition-all duration-300 overflow-hidden shadow-lg">
                            <img referrerPolicy="no-referrer" src={getHeroImage(h.hero)} alt={h.hero} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <span className="font-bold text-white text-[10px] sm:text-xs truncate w-full group-hover:text-red-400 transition-colors">{h.hero}</span>
                        <span className="text-[9px] text-gray-500 font-mono font-bold mt-0.5">{h.bans} Bans</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TOP 5 HERO WIN RATE */}
              <div className="bg-surface border border-border-color rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-l-4 border-cyan-500 pl-3">
                    🏆 Top 5 Hero Win Rate
                  </h2>
                  <div className="grid grid-cols-5 gap-2">
                    {topWinRates.map((h, i) => (
                      <div key={h.hero} className="flex flex-col items-center text-center group">
                        <div className="relative mb-2 shrink-0">
                          <span className="absolute -top-1.5 -left-1.5 bg-cyan-500 text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-surface z-10">
                            {i + 1}
                          </span>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-500/30 group-hover:border-cyan-500 transition-all duration-300 overflow-hidden shadow-lg">
                            <img referrerPolicy="no-referrer" src={getHeroImage(h.hero)} alt={h.hero} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <span className="font-bold text-white text-[10px] sm:text-xs truncate w-full group-hover:text-cyan-400 transition-colors">{h.hero}</span>
                        <span className="text-[9px] text-mln-green font-bold font-mono mt-0.5">{h.winRate}%</span>
                        <span className="text-[8px] text-gray-500 font-mono">({h.picks} Pick{h.picks !== 1 ? 's' : ''})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Full Stats Table */}
            <HeroesTable heroStats={heroStats} totalGames={totalGames} />
          </div>
        )}
      </div>
    </div>
  );
}
