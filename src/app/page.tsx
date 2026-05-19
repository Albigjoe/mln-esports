import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, ChevronRight, Users, Swords, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tournaments = await prisma.tournament.findMany({
    take: 3,
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { games: true } } }
  });
  const teamCount = await prisma.team.count();

  // MVP Leaderboard: aggregate picks by playerUsername and compute MVP score
  const allPicks = await prisma.pick.findMany({
    include: {
      game: { select: { winner: true, team1Id: true, team2Id: true } },
    },
  });

  const playerMap: Record<string, {
    games: number; wins: number; kills: number; deaths: number; assists: number;
    damage: number; savages: number; maniacs: number; mvpCount: number;
  }> = {};

  allPicks.forEach(p => {
    if (!p.playerUsername || p.playerUsername === '') return;
    const key = p.playerUsername;
    if (!playerMap[key]) playerMap[key] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, savages: 0, maniacs: 0, mvpCount: 0 };
    playerMap[key].games++;
    playerMap[key].kills += p.kills;
    playerMap[key].deaths += p.deaths;
    playerMap[key].assists += p.assists;
    playerMap[key].damage += p.damage;
    playerMap[key].savages += p.savages;
    playerMap[key].maniacs += p.maniacs;
    if ((p as any).isMvp) playerMap[key].mvpCount++;
    const isTeam1 = p.team === 'team1';
    const won = (isTeam1 && p.game.winner === 'team1') || (!isTeam1 && p.game.winner === 'team2');
    if (won) playerMap[key].wins++;
  });

  const leaderboard = Object.entries(playerMap).map(([username, s]) => {
    const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
    const wr = s.games > 0 ? (s.wins / s.games) * 100 : 0;
    const score = parseFloat(((kda * 0.4) + (wr * 0.4) + (s.savages * 2) + (s.maniacs)).toFixed(2));
    return { username, ...s, kda: parseFloat(kda.toFixed(2)), wr: parseFloat(wr.toFixed(0)), score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);


  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="relative w-full h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-background z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/rnk-vs-astral.jpeg')" }} />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-mln-green font-bold tracking-widest uppercase mb-4 text-sm md:text-base">Welcome to the Arena</span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight uppercase mb-6 drop-shadow-lg">
            Mobile Legends <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mln-green to-mln-green-light">Nigeria</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
            The premier destination for professional MLBB esports in Nigeria. {teamCount} teams competing. Track stats, view matches, support your squad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tournaments" className="bg-mln-green hover:bg-mln-green-dark text-black px-8 py-4 rounded-md font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,200,83,0.4)] flex items-center justify-center gap-2 text-lg">
              <Trophy size={20} /> View Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <section className="py-20 bg-background border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <span className="w-2 h-8 bg-mln-green rounded-full"></span>
              Active Tournaments
            </h2>
            <Link href="/tournaments" className="text-mln-green hover:text-mln-green-light flex items-center gap-1 font-bold uppercase text-sm tracking-wider transition-colors hidden sm:flex">
              View All <ChevronRight size={18} />
            </Link>
          </div>
          {tournaments.length === 0 ? (
            <div className="bg-surface border border-border-color rounded-xl p-10 text-center">
              <Trophy className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">No Tournaments Yet</h3>
              <p className="text-gray-400">Stay tuned for upcoming events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((t: any) => (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="group block overflow-hidden rounded-xl bg-surface border border-border-color hover:border-mln-green transition-all hover:-translate-y-1 shadow-lg">
                  <div className="h-48 bg-surface-hover flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10" />
                    {t.bannerUrl ? (
                      <img src={t.bannerUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Trophy size={64} className="text-gray-600 group-hover:text-mln-green transition-colors opacity-50 group-hover:scale-110 duration-500" />
                    )}
                  </div>
                  <div className="p-6 relative z-20">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm ${
                        t.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                        t.status === 'upcoming' ? 'bg-mln-green text-black' :
                        'bg-gray-700 text-gray-300'
                      }`}>{t.status}</span>
                      <span className="text-sm font-mono text-gray-400">{t._count.games} games</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-mln-green transition-colors mb-2 line-clamp-2">{t.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MVP Leaderboard */}
      <section className="py-20 bg-surface border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">Season Rankings</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider flex items-center gap-3 mt-1">
                <span className="w-2 h-8 bg-mln-green rounded-full"></span>
                MVP Leaderboard
              </h2>
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <div className="bg-background border border-border-color rounded-xl p-10 text-center">
              <Swords className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">No Player Data Yet</h3>
              <p className="text-gray-400">The MVP Race kicks off once match data is entered.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((p, i) => (
                <Link key={p.username} href={`/players/${p.username}`}
                  className="group flex items-center gap-5 bg-background border border-border-color hover:border-mln-green rounded-xl p-4 transition-all hover:-translate-x-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shrink-0 ${i === 0 ? 'bg-mln-green text-black' : i === 1 ? 'bg-white/10 text-white border border-white/20' : i === 2 ? 'bg-white/5 text-gray-400 border border-border-color' : 'bg-background text-gray-600 border border-border-color'}`}>
                    {i === 0 ? <Star size={20} /> : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-lg uppercase group-hover:text-mln-green transition-colors truncate">{p.username}</div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{p.games} games · {p.wr}% win rate</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">KDA</div>
                      <div className="font-black text-white text-lg">{p.kda}</div>
                    </div>
                    <div className="w-px h-8 bg-border-color"></div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kills</div>
                      <div className="font-black text-white text-lg">{p.kills}</div>
                    </div>
                    {p.savages > 0 && (
                      <>
                        <div className="w-px h-8 bg-border-color"></div>
                        <div className="text-center">
                          <div className="text-[10px] text-mln-green uppercase tracking-widest font-bold">Savages</div>
                          <div className="font-black text-mln-green text-lg">⚡ {p.savages}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Score</div>
                    <div className={`font-black text-2xl ${i === 0 ? 'text-mln-green' : 'text-white'}`}>{p.score}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Hero Meta Quick Link */}
      <section className="py-16 bg-background border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/heroes" className="group flex flex-col md:flex-row items-center justify-between gap-6 bg-surface border border-border-color hover:border-mln-green rounded-2xl p-8 transition-all">
            <div>
              <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">Live Meta Analysis</span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">Hero Meta Tracker</h2>
              <p className="text-gray-400 text-sm mt-2">Pick rates, ban rates, win rates, KDA and tier rankings for every hero — updated after every game.</p>
            </div>
            <div className="shrink-0 flex items-center gap-3 bg-mln-green group-hover:bg-mln-green-dark text-black font-black uppercase tracking-widest px-8 py-4 rounded-lg transition-colors">
              <Swords size={20} />
              View Meta
            </div>
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-surface border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider flex items-center gap-3 mb-6">
                <span className="w-2 h-8 bg-mln-green rounded-full"></span>
                About MLN
              </h2>
              <div className="text-gray-300 space-y-4 text-lg">
                <p>Mobile Legends Nigeria (MLN) is the home of professional MLBB esports in Nigeria. We host massive tournaments, track comprehensive player and hero statistics, and elevate the competitive gaming scene.</p>
                <p>From grassroot community cups to major national leagues, we bring the most intense matches, the best teams, and industry-standard stats tracking.</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-background p-3 rounded-full border border-border-color"><Trophy className="text-mln-green" size={24} /></div>
                  <div><h4 className="text-white font-bold">Premium Events</h4><p className="text-sm text-gray-400">High-stakes tournaments</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background p-3 rounded-full border border-border-color"><Users className="text-mln-green" size={24} /></div>
                  <div><h4 className="text-white font-bold">{teamCount} Teams</h4><p className="text-sm text-gray-400">Nigeria&apos;s finest players</p></div>
                </div>
              </div>
            </div>
            <div className="bg-background rounded-2xl border border-border-color overflow-hidden shadow-2xl relative group">
              <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" alt="MLN" className="w-full h-[350px] object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent z-20">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">Community</span>
                <h3 className="text-2xl font-bold text-white">Join the Movement</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
