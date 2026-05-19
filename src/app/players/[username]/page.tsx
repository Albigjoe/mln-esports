import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Find player profile in database
  const player = await prisma.player.findUnique({
    where: { username },
    include: { team: true }
  });

  // Fetch all picks for this player username
  const picks = await prisma.pick.findMany({
    where: {
      playerUsername: {
        equals: username,
        mode: 'insensitive' // case insensitive matching
      }
    },
    include: {
      game: {
        include: {
          team1: true,
          team2: true,
          tournament: true,
        }
      }
    }
  });

  if (picks.length === 0 && !player) {
    return notFound();
  }

  // Calculate statistics
  const totalGames = picks.length;
  let totalWins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalGold = 0;
  let totalDamage = 0;
  let savages = 0;
  let maniacs = 0;

  const heroStats: Record<string, { picks: number; wins: number; kills: number; deaths: number; assists: number }> = {};
  const tournamentsMap: Record<string, any> = {};

  picks.forEach(p => {
    const isTeam1 = p.team === 'team1';
    const won = (isTeam1 && p.game.winner === 'team1') || (!isTeam1 && p.game.winner === 'team2');
    
    if (won) totalWins++;
    totalKills += p.kills;
    totalDeaths += p.deaths;
    totalAssists += p.assists;
    totalGold += p.gold;
    totalDamage += p.damage;
    savages += p.savages;
    maniacs += p.maniacs;

    // Track hero specific stats
    if (!heroStats[p.hero]) {
      heroStats[p.hero] = { picks: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    }
    heroStats[p.hero].picks++;
    if (won) heroStats[p.hero].wins++;
    heroStats[p.hero].kills += p.kills;
    heroStats[p.hero].deaths += p.deaths;
    heroStats[p.hero].assists += p.assists;

    // Track tournaments
    tournamentsMap[p.game.tournament.id] = p.game.tournament;
  });

  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(0) : '0';
  const avgKills = totalGames > 0 ? (totalKills / totalGames).toFixed(1) : '0.0';
  const avgDeaths = totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : '0.0';
  const avgAssists = totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : '0.0';
  const avgKDA = totalDeaths > 0 
    ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) 
    : (totalKills + totalAssists).toFixed(2);

  const avgGold = totalGames > 0 ? (totalGold / totalGames).toFixed(0) : '0';
  const avgDamage = totalGames > 0 ? (totalDamage / totalGames).toFixed(0) : '0';

  // Sort heroes by pick count
  const sortedHeroes = Object.entries(heroStats)
    .map(([hero, stats]) => ({
      hero,
      picks: stats.picks,
      winRate: ((stats.wins / stats.picks) * 100).toFixed(0),
      kda: stats.deaths > 0 
        ? ((stats.kills + stats.assists) / stats.deaths).toFixed(1) 
        : (stats.kills + stats.assists).toFixed(1),
    }))
    .sort((a, b) => b.picks - a.picks);

  const topPicks = sortedHeroes.slice(0, 5);

  const uniqueTournaments = Object.values(tournamentsMap);

  // SVG Radar/Spider Chart stats normalization (0 to 100)
  // Max ranges for normal players: kills=15, deaths=10 (lower is better), assists=15, winrate=100%, gold=12000, damage=120000
  const normKills = Math.min(100, (parseFloat(avgKills) / 10) * 100);
  const normAssists = Math.min(100, (parseFloat(avgAssists) / 10) * 100);
  const normWinrate = parseFloat(winRate);
  const normGold = Math.min(100, (parseFloat(avgGold) / 10000) * 100);
  const normDamage = Math.min(100, (parseFloat(avgDamage) / 80000) * 100);
  
  // Calculate Radar Polygon Points
  // Center is (100, 100), radius 75
  const angleWinrate = 0; // Top
  const angleDamage = (72 * Math.PI) / 180; // Right Top
  const angleGold = (144 * Math.PI) / 180; // Right Bottom
  const angleAssists = (216 * Math.PI) / 180; // Left Bottom
  const angleKills = (288 * Math.PI) / 180; // Left Top

  const getPoint = (angle: number, value: number) => {
    const r = (value / 100) * 70;
    const x = 100 + r * Math.sin(angle);
    const y = 100 - r * Math.cos(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const points = [
    getPoint(angleWinrate, normWinrate),
    getPoint(angleDamage, normDamage),
    getPoint(angleGold, normGold),
    getPoint(angleAssists, normAssists),
    getPoint(angleKills, normKills),
  ].join(' ');

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Profile Card */}
        <div className="bg-surface border border-border-color rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-mln-green/10 border-l border-b border-mln-green/30 text-mln-green text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
            Pro Player
          </div>

          <div className="w-32 h-32 rounded-full overflow-hidden bg-background border-4 border-mln-green shadow-[0_0_30px_rgba(0,200,83,0.3)] shrink-0 flex items-center justify-center">
            {player?.pictureUrl ? (
              <img src={player.pictureUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-mln-green font-black text-5xl uppercase">{username.charAt(0)}</span>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">Player Profile</span>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">{username}</h1>
            {player?.realName && <p className="text-gray-400 font-semibold mb-4 text-sm">{player.realName}</p>}
            
            <div className="flex gap-4 justify-center md:justify-start items-center">
              {player?.team ? (
                <Link href={`/teams/${player.team.id}`} className="bg-background border border-border-color hover:border-mln-green/40 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                  <div className="w-5 h-5 rounded-full bg-surface overflow-hidden flex items-center justify-center shrink-0">
                    {player.team.logoUrl ? <img src={player.team.logoUrl} alt={player.team.name} className="w-full h-full object-contain" /> : <span className="text-[9px] text-mln-green font-black">{player.team.name.charAt(0)}</span>}
                  </div>
                  <span className="font-bold text-xs uppercase text-white">{player.team.name}</span>
                </Link>
              ) : (
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Free Agent</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Statistics Grid */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Core Stats Overview */}
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Tournament Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold mb-1">Matches</span>
                <span className="text-3xl font-black text-white">{totalGames}</span>
              </div>
              <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold mb-1">Win Rate</span>
                <span className="text-3xl font-black text-mln-green">{winRate}%</span>
              </div>
              <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold mb-1">Avg KDA</span>
                <span className="text-3xl font-black text-cyan-400">{avgKDA}</span>
              </div>
              <div className="bg-surface border border-border-color rounded-xl p-4 text-center">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold mb-1">Avg Gold</span>
                <span className="text-3xl font-black text-yellow-400">{parseInt(avgGold).toLocaleString()}</span>
              </div>
            </div>

            {/* Savages and Maniacs Highlights */}
            {(savages > 0 || maniacs > 0) && (
              <div className="bg-gradient-to-r from-purple-950/20 to-yellow-950/20 border border-purple-500/20 rounded-xl p-6 flex gap-8 justify-center">
                {savages > 0 && (
                  <div className="text-center">
                    <span className="text-[10px] text-yellow-400 block uppercase tracking-[2px] font-bold mb-1">SAVAGES</span>
                    <span className="text-4xl font-black text-yellow-400 animate-pulse">{savages}</span>
                  </div>
                )}
                {savages > 0 && maniacs > 0 && <div className="w-px bg-border-color"></div>}
                {maniacs > 0 && (
                  <div className="text-center">
                    <span className="text-[10px] text-purple-400 block uppercase tracking-[2px] font-bold mb-1">MANIACS</span>
                    <span className="text-4xl font-black text-purple-400">{maniacs}</span>
                  </div>
                )}
              </div>
            )}

            {/* Top Picks List */}
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Top Heroes Played</h3>
            <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-background text-xs uppercase text-white font-bold">
                  <tr>
                    <th className="px-6 py-4">Hero</th>
                    <th className="px-6 py-4 text-center">Games</th>
                    <th className="px-6 py-4 text-center">Win Rate</th>
                    <th className="px-6 py-4 text-center">Hero KDA</th>
                  </tr>
                </thead>
                <tbody>
                  {topPicks.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No match records yet.</td></tr>
                  ) : topPicks.map(h => (
                    <tr key={h.hero} className="border-b border-border-color hover:bg-background/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{h.hero}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-white">{h.picks}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-mln-green">{h.winRate}%</td>
                      <td className="px-6 py-4 text-center font-mono text-cyan-400">{h.kda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Competing Tournaments */}
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Tournaments Competed</h3>
            <div className="bg-surface border border-border-color rounded-xl p-6">
              {uniqueTournaments.length === 0 ? (
                <span className="text-gray-500 text-sm">No tournament records.</span>
              ) : (
                <div className="space-y-4">
                  {uniqueTournaments.map(t => (
                    <div key={t.id} className="flex justify-between items-center border-b border-border-color/60 pb-3 last:border-b-0 last:pb-0">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      <Link href={`/tournaments/${t.id}`} className="text-xs text-mln-green hover:underline uppercase font-bold tracking-wider">Tournament Stats →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Performance Radar Diagram Side Panel */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Performance Radar</h3>
            
            <div className="bg-surface border border-border-color rounded-2xl p-6 flex flex-col items-center">
              <svg viewBox="0 0 200 200" className="w-full max-w-[280px] h-auto">
                {/* Radar Grid Circles */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#222" strokeWidth="1" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#222" strokeWidth="1" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="#222" strokeWidth="1" strokeDasharray="3" />
                
                {/* Axis lines */}
                <line x1="100" y1="30" x2="100" y2="170" stroke="#333" strokeWidth="0.5" />
                <line x1="33" y1="149" x2="167" y2="51" stroke="#333" strokeWidth="0.5" />
                <line x1="33" y1="51" x2="167" y2="149" stroke="#333" strokeWidth="0.5" />

                {/* Radar Area Polygon */}
                {totalGames > 0 && (
                  <polygon
                    points={points}
                    fill="rgba(0, 200, 83, 0.2)"
                    stroke="#00C853"
                    strokeWidth="1.5"
                  />
                )}

                {/* Point Dots */}
                {totalGames > 0 && points.split(' ').map((pt, index) => {
                  const [x, y] = pt.split(',');
                  return <circle key={index} cx={x} cy={y} r="3" fill="#00C853" />;
                })}

                {/* Axis Labels */}
                <text x="100" y="24" textAnchor="middle" fill="#aaa" fontSize="8" fontWeight="bold">WIN RATE ({winRate}%)</text>
                <text x="175" y="85" textAnchor="start" fill="#aaa" fontSize="8" fontWeight="bold">DMG ({parseFloat(avgDamage).toLocaleString()})</text>
                <text x="165" y="160" textAnchor="start" fill="#aaa" fontSize="8" fontWeight="bold">GOLD ({parseFloat(avgGold).toLocaleString()})</text>
                <text x="35" y="160" textAnchor="end" fill="#aaa" fontSize="8" fontWeight="bold">ASTS ({avgAssists})</text>
                <text x="25" y="85" textAnchor="end" fill="#aaa" fontSize="8" fontWeight="bold">KILLS ({avgKills})</text>
              </svg>
              
              <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Norm. Index against competitive levels</p>
                <div className="mt-4 flex gap-4 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-mln-green/20 border border-mln-green"></span>Player</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-transparent border border-gray-800"></span>Baseline</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
