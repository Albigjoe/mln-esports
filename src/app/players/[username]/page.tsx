import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export const dynamic = "force-dynamic";

export default async function PlayerProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const player = await prisma.player.findUnique({
    where: { username: decodedUsername },
    include: { team: true, awards: true }
  });

  if (!player) return notFound();

  // Fetch all picks (matches) for this player
  const picks = await prisma.pick.findMany({
    where: { playerUsername: decodedUsername },
    include: { game: { include: { tournament: true } } },
    orderBy: { game: { createdAt: "desc" } }
  });

  const totalMatches = picks.length;
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalMvps = 0;
  
  const heroStats: Record<string, { matches: number, wins: number, kills: number, deaths: number, assists: number }> = {};

  picks.forEach(p => {
    const isWin = p.game.winner === p.team;
    if (isWin) wins++;
    if (p.isMvp) totalMvps++;

    totalKills += p.kills;
    totalDeaths += p.deaths;
    totalAssists += p.assists;

    if (!heroStats[p.hero]) {
      heroStats[p.hero] = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    }
    heroStats[p.hero].matches++;
    if (isWin) heroStats[p.hero].wins++;
    heroStats[p.hero].kills += p.kills;
    heroStats[p.hero].deaths += p.deaths;
    heroStats[p.hero].assists += p.assists;
  });

  const overallWr = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";
  const overallKdaRatio = totalDeaths === 0 && totalMatches > 0 ? (totalKills + totalAssists) : totalDeaths === 0 ? 0 : ((totalKills + totalAssists) / totalDeaths);
  const overallKda = overallKdaRatio.toFixed(2);

  const topHeroes = Object.entries(heroStats)
    .sort((a, b) => b[1].matches - a[1].matches)
    .slice(0, 3)
    .map(([hero, stats]) => ({
      hero,
      matches: stats.matches,
      wr: ((stats.wins / stats.matches) * 100).toFixed(1),
      kda: stats.deaths === 0 ? (stats.kills + stats.assists).toFixed(2) : ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
    }));

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-16">
        
        {/* Profile Header */}
        <div className="bg-surface border border-border-color rounded-2xl p-6 md:p-10 mb-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start shadow-[0_0_40px_rgba(0,200,83,0.05)]">
          <div className="absolute -right-20 -top-20 text-[200px] font-black text-white/[0.02] tracking-tighter pointer-events-none uppercase">
            {player.username}
          </div>
          
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative rounded-xl overflow-hidden border-2 border-border-color bg-surface-hover flex items-center justify-center">
            {player.pictureUrl ? (
              <img src={player.pictureUrl} alt={player.username} className="w-full h-full object-cover" />
            ) : (
              <div className="text-6xl font-black text-gray-700">{player.username.substring(0,2).toUpperCase()}</div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left z-10 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              {player.team && (
                <span className="bg-mln-green text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">
                  {player.team.name}
                </span>
              )}
              <span className="border border-border-color bg-background text-gray-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                {player.role || 'Player'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-2 truncate">
              {player.username}
            </h1>
            
            {player.realName && (
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-6 truncate">
                {player.realName}
              </p>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-background border border-border-color rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Win Rate</div>
                <div className="text-xl font-black text-mln-green">{overallWr}%</div>
              </div>
              <div className="bg-background border border-border-color rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">KDA</div>
                <div className="text-xl font-black text-white">{overallKda}</div>
              </div>
              <div className="bg-background border border-border-color rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Matches</div>
                <div className="text-xl font-black text-white">{totalMatches}</div>
              </div>
              <div className="bg-background border border-border-color rounded-lg p-3 text-center">
                <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">MVPs</div>
                <div className="text-xl font-black text-yellow-400">{totalMvps}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Top Heroes */}
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-6 bg-mln-green rounded-full"></span> Top Heroes
            </h3>
            {topHeroes.length > 0 ? (
              <div className="space-y-3">
                {topHeroes.map((th, i) => (
                  <div key={i} className="bg-surface border border-border-color rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">{th.hero}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {th.matches} Matches
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-mln-green">{th.wr}% WR</div>
                      <div className="text-xs text-gray-500 font-bold">{th.kda} KDA</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-sm text-gray-500 font-bold uppercase tracking-widest">
                No hero data yet.
              </div>
            )}
          </div>

          {/* Match History */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-6 bg-mln-green rounded-full"></span> Recent Matches
            </h3>
            
            {picks.length > 0 ? (
              <div className="space-y-3">
                {picks.map((pick) => {
                  const isWin = pick.game.winner === pick.team;
                  return (
                    <div key={pick.id} className={`border-l-4 rounded-r-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${isWin ? 'bg-surface border-mln-green' : 'bg-surface border-red-500'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isWin ? 'bg-mln-green/20 text-mln-green' : 'bg-red-500/20 text-red-400'}`}>
                            {isWin ? 'VICTORY' : 'DEFEAT'}
                          </span>
                          <span className="text-xs text-gray-400 font-bold uppercase">{pick.game.tournament.name}</span>
                        </div>
                        <div className="font-black text-white uppercase tracking-wider text-lg">
                          {pick.hero}
                        </div>
                      </div>
                      
                      <div className="flex gap-6 items-center">
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">K/D/A</div>
                          <div className="font-mono text-white text-sm">
                            {pick.kills} / <span className="text-red-400">{pick.deaths}</span> / {pick.assists}
                          </div>
                        </div>
                        {pick.isMvp && (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                            MVP
                          </div>
                        )}
                        <Link href={`/tournaments/${pick.game.tournamentId}`} className="text-[10px] bg-background border border-border-color hover:border-mln-green text-gray-300 px-3 py-2 rounded uppercase font-bold transition-colors">
                          View Game
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-sm text-gray-500 font-bold uppercase tracking-widest">
                No match history available.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
