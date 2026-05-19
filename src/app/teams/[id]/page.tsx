import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: true, // Explicit roster
    }
  });

  if (!team) return notFound();

  // Fetch games played by this team
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { team1Id: id },
        { team2Id: id }
      ]
    },
    include: {
      team1: true,
      team2: true,
      tournament: true,
      picks: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Split into completed vs upcoming
  const completedGames = games.filter(g => g.winner !== "" && g.winner !== "none");
  const upcomingGames = games.filter(g => g.winner === "" || g.winner === "none");

  const matchesPlayed = completedGames.length;
  
  // Calculate wins
  const wins = completedGames.filter(g => {
    if (g.team1Id === id && g.winner === 'team1') return true;
    if (g.team2Id === id && g.winner === 'team2') return true;
    return false;
  }).length;

  const losses = matchesPlayed - wins;

  // Active tournaments
  const tournamentsMap: Record<string, any> = {};
  games.forEach(g => {
    tournamentsMap[g.tournament.id] = g.tournament;
  });
  const activeTournaments = Object.values(tournamentsMap);

  // Last 3 matches
  const lastMatches = completedGames.slice(0, 3);

  // Next 3 upcoming fixtures (closest first)
  const upcomingMatches = [...upcomingGames].reverse().slice(0, 3);

  // Roster calculation
  // 1. Explicitly registered players
  const explicitPlayers = team.players;

  // 2. Scan picks for unique player usernames that played for this team
  const pickUsernames = new Set<string>();
  games.forEach(g => {
    const isTeam1 = g.team1Id === id;
    const teamSide = isTeam1 ? 'team1' : 'team2';
    g.picks.forEach(p => {
      if (p.team === teamSide && p.playerUsername) {
        pickUsernames.add(p.playerUsername);
      }
    });
  });

  // Get profiles for pick players
  const allPlayersInDB = await prisma.player.findMany({
    where: {
      username: { in: Array.from(pickUsernames) }
    }
  });

  // Combine both sources
  const rosterMap = new Map<string, any>();
  explicitPlayers.forEach(p => rosterMap.set(p.username.toLowerCase(), p));
  allPlayersInDB.forEach(p => rosterMap.set(p.username.toLowerCase(), p));

  // If there are usernames from picks that still have no profile in DB, add placeholder profiles
  const finalRoster = Array.from(rosterMap.values());
  pickUsernames.forEach(username => {
    if (!rosterMap.has(username.toLowerCase())) {
      finalRoster.push({
        id: `temp-${username}`,
        username,
        realName: 'Roster Player',
        pictureUrl: null,
      });
    }
  });

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Roster Detail Card */}
        <div className="bg-surface border border-border-color rounded-2xl p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] font-black text-mln-green/5 tracking-wider pointer-events-none uppercase">{team.name.substring(0,3)}</div>

          <div className="w-32 h-32 rounded-2xl bg-background border-4 border-mln-green shadow-[0_0_30px_rgba(0,200,83,0.2)] flex items-center justify-center shrink-0 overflow-hidden p-3">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-mln-green font-black text-4xl">{team.name.charAt(0)}</span>
            )}
          </div>

          <div className="text-center md:text-left">
            <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Nigeria Esports Team</span>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-4">{team.name}</h1>
            
            {/* Stats grid */}
            <div className="flex gap-6 justify-center md:justify-start">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">Matches Played</span>
                <span className="text-2xl font-black text-white">{matchesPlayed}</span>
              </div>
              <div className="w-px bg-border-color"></div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">Wins</span>
                <span className="text-2xl font-black text-mln-green">{wins}</span>
              </div>
              <div className="w-px bg-border-color"></div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">Losses</span>
                <span className="text-2xl font-black text-red-400">{losses}</span>
              </div>
              <div className="w-px bg-border-color"></div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">Win Rate</span>
                <span className="text-2xl font-black text-yellow-400">{matchesPlayed > 0 ? ((wins/matchesPlayed)*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Roster list */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Active Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalRoster.length === 0 ? (
                <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500 col-span-2">No players added to this roster yet.</div>
              ) : finalRoster.map(p => (
                <Link href={`/players/${p.username}`} key={p.id} className="bg-surface border border-border-color hover:border-mln-green/40 p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.01]">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-border-color flex items-center justify-center shrink-0">
                    {p.pictureUrl ? <img src={p.pictureUrl} alt={p.username} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-bold uppercase">{p.username.charAt(0)}</span>}
                  </div>
                  <div>
                    <div className="font-black text-white text-lg leading-tight hover:text-mln-green transition-colors">{p.username}</div>
                    <div className="text-xs text-gray-400 font-semibold">{p.realName || 'Roster Player'}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tournaments competing in */}
            <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Competing Tournaments</h3>
            <div className="bg-surface border border-border-color rounded-xl p-6">
              {activeTournaments.length === 0 ? (
                <span className="text-gray-500 text-sm">Not registered in any tournaments yet.</span>
              ) : (
                <div className="space-y-4">
                  {activeTournaments.map(t => (
                    <div key={t.id} className="flex justify-between items-center border-b border-border-color/60 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-background border border-border-color flex items-center justify-center">
                          {t.logoUrl ? <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-mln-green font-bold text-xs">T</span>}
                        </div>
                        <span className="font-bold text-white text-sm">{t.name}</span>
                      </div>
                      <Link href={`/tournaments/${t.id}`} className="text-xs text-mln-green hover:underline uppercase font-bold tracking-wider">Tournament Hub →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Last Match Results & Upcoming Fixtures Side Panel */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3 mb-6">Upcoming Fixtures</h3>
              <div className="space-y-4">
                {upcomingMatches.length === 0 ? (
                  <div className="bg-surface border border-border-color rounded-xl p-6 text-center text-gray-500 text-sm">No upcoming fixtures scheduled.</div>
                ) : upcomingMatches.map(g => {
                  const isTeam1 = g.team1Id === id;
                  const opponent = isTeam1 ? g.team2 : g.team1;
                  return (
                    <div key={g.id} className="bg-surface border border-border-color p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{g.tournament.name}</span>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">UPCOMING</span>
                      </div>
                      <div className="flex items-center gap-3 justify-between">
                        <span className="font-black text-white text-sm uppercase">vs {opponent.name}</span>
                        <span className="text-xs text-gray-400 font-semibold">{g.date}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">
                        BO{g.boFormat} · Game {g.gameNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-mln-green pl-3 mb-6">Recent Match History</h3>
              <div className="space-y-4">
                {lastMatches.length === 0 ? (
                  <div className="bg-surface border border-border-color rounded-xl p-6 text-center text-gray-500 text-sm">No match records yet.</div>
                ) : lastMatches.map(g => {
                  const isTeam1 = g.team1Id === id;
                  const opponent = isTeam1 ? g.team2 : g.team1;
                  const won = (isTeam1 && g.winner === 'team1') || (!isTeam1 && g.winner === 'team2');
                  return (
                    <Link href={`/matches/${g.id}`} key={g.id} className="block bg-surface border border-border-color hover:border-mln-green/40 p-4 rounded-xl transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{g.tournament.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${won ? 'bg-mln-green/20 text-mln-green' : 'bg-red-500/20 text-red-400'}`}>
                          {won ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-between">
                        <span className="font-black text-white text-sm uppercase">vs {opponent.name}</span>
                        <span className="text-xs text-gray-400 font-semibold">{g.date}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">
                        BO{g.boFormat} · Game {g.gameNumber}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
