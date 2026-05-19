import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      team1: true,
      team2: true,
      tournament: true,
      bans: true,
      picks: true,
    }
  });

  if (!game) return notFound();

  const team1Picks = game.picks.filter(p => p.team === 'team1').sort((a,b) => a.pickOrder - b.pickOrder);
  const team2Picks = game.picks.filter(p => p.team === 'team2').sort((a,b) => a.pickOrder - b.pickOrder);

  const team1Bans = game.bans.filter(b => b.team === 'team1').sort((a,b) => a.banOrder - b.banOrder);
  const team2Bans = game.bans.filter(b => b.team === 'team2').sort((a,b) => a.banOrder - b.banOrder);

  const winnerTeam = game.winner === 'team1' ? game.team1 : game.team2;

  // Calculate totals
  const getKDA = (picks: any[]) => {
    let k = 0, d = 0, a = 0;
    picks.forEach(p => { k += p.kills; d += p.deaths; a += p.assists; });
    return `${k}/${d}/${a}`;
  };

  const getGold = (picks: any[]) => {
    const total = picks.reduce((acc, p) => acc + p.gold, 0);
    return (total / 1000).toFixed(1) + 'k';
  };

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb / Back button */}
        <div className="mb-8">
          <Link href={`/tournaments/${game.tournamentId}`} className="text-mln-green hover:underline text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            ← Back to {game.tournament.name}
          </Link>
        </div>

        {/* Header Match Match Card */}
        <div className="bg-surface border border-border-color rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-mln-green/10 border-l border-b border-mln-green/30 text-mln-green text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
            BO{game.boFormat} · Game {game.gameNumber}
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[4px]">{game.tournament.name}</span>
            <div className="text-gray-400 text-xs mt-1 font-semibold">{game.date} · Duration: {game.duration || 'N/A'}</div>
          </div>

          {/* Versus Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:px-12">
            {/* Team 1 */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right flex-1">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-background border border-border-color p-2 mb-3 flex items-center justify-center">
                {game.team1.logoUrl ? <img src={game.team1.logoUrl} alt={game.team1.name} className="w-full h-full object-contain" /> : <span className="text-mln-green font-black">T1</span>}
              </div>
              <Link href={`/teams/${game.team1Id}`} className="text-xl md:text-2xl font-black uppercase hover:text-mln-green transition-colors">{game.team1.name}</Link>
              <span className="text-gray-500 text-xs font-semibold mt-1">Gold: {getGold(team1Picks)} · KDA: {getKDA(team1Picks)}</span>
            </div>

            {/* VS Node */}
            <div className="text-center shrink-0 py-2 px-6 bg-background border border-border-color rounded-xl">
              <span className="text-gray-600 font-black text-lg uppercase tracking-wider block">VS</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${game.winner ? 'text-mln-green' : 'text-gray-400'}`}>
                {game.winner ? 'COMPLETED' : 'LIVE'}
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-background border border-border-color p-2 mb-3 flex items-center justify-center">
                {game.team2.logoUrl ? <img src={game.team2.logoUrl} alt={game.team2.name} className="w-full h-full object-contain" /> : <span className="text-mln-green font-black">T2</span>}
              </div>
              <Link href={`/teams/${game.team2Id}`} className="text-xl md:text-2xl font-black uppercase hover:text-mln-green transition-colors">{game.team2.name}</Link>
              <span className="text-gray-500 text-xs font-semibold mt-1">Gold: {getGold(team2Picks)} · KDA: {getKDA(team2Picks)}</span>
            </div>
          </div>

          <div className="mt-8 border-t border-border-color/60 pt-6 text-center">
            <span className="text-xs text-gray-400 font-semibold">Match Winner: </span>
            <span className="text-mln-green font-black uppercase tracking-wider text-lg ml-1">{winnerTeam.name}</span>
          </div>
        </div>

        {/* Bans Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h3 className="text-xs text-red-400 font-bold uppercase tracking-[3px] mb-4">Bans · {game.team1.name}</h3>
            <div className="flex flex-wrap gap-3">
              {team1Bans.length === 0 ? <span className="text-gray-500 text-sm">No bans recorded</span> : team1Bans.map(b => (
                <span key={b.id} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{b.hero}</span>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h3 className="text-xs text-red-400 font-bold uppercase tracking-[3px] mb-4">Bans · {game.team2.name}</h3>
            <div className="flex flex-wrap gap-3">
              {team2Bans.length === 0 ? <span className="text-gray-500 text-sm">No bans recorded</span> : team2Bans.map(b => (
                <span key={b.id} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{b.hero}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Pick Details & Stats */}
        <div className="grid grid-cols-1 gap-6">
          {/* Team 1 Roster & Picks */}
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h3 className="text-md font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3 flex items-center justify-between">
              <span>{game.team1.name} Performance</span>
              <span className="text-xs text-gray-500 font-semibold">{game.winner === 'team1' ? 'WINNER' : 'DEFEATED'}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-background text-xs uppercase text-white font-bold">
                  <tr>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Hero</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">K / D / A</th>
                    <th className="px-4 py-3 text-right">Gold</th>
                    <th className="px-4 py-3 text-right">Damage</th>
                    <th className="px-4 py-3 text-center">S / M</th>
                  </tr>
                </thead>
                <tbody>
                  {team1Picks.map(p => (
                    <tr key={p.id} className="border-b border-border-color hover:bg-background/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/players/${p.playerUsername}`} className="font-bold text-white hover:text-mln-green transition-colors">
                          {p.playerUsername || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-300">{p.hero}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">{p.role}</td>
                      <td className="px-4 py-3 text-center font-mono text-white font-bold">{p.kills}/{p.deaths}/{p.assists}</td>
                      <td className="px-4 py-3 text-right font-mono text-yellow-400 font-semibold">{(p.gold/1000).toFixed(1)}k</td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-400 font-semibold">{p.damage.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {p.savages > 0 && <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[10px] mr-1">S:{p.savages}</span>}
                        {p.maniacs > 0 && <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">M:{p.maniacs}</span>}
                        {p.savages === 0 && p.maniacs === 0 && <span className="text-gray-600">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team 2 Roster & Picks */}
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h3 className="text-md font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3 flex items-center justify-between">
              <span>{game.team2.name} Performance</span>
              <span className="text-xs text-gray-500 font-semibold">{game.winner === 'team2' ? 'WINNER' : 'DEFEATED'}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-background text-xs uppercase text-white font-bold">
                  <tr>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Hero</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">K / D / A</th>
                    <th className="px-4 py-3 text-right">Gold</th>
                    <th className="px-4 py-3 text-right">Damage</th>
                    <th className="px-4 py-3 text-center">S / M</th>
                  </tr>
                </thead>
                <tbody>
                  {team2Picks.map(p => (
                    <tr key={p.id} className="border-b border-border-color hover:bg-background/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/players/${p.playerUsername}`} className="font-bold text-white hover:text-mln-green transition-colors">
                          {p.playerUsername || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-300">{p.hero}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">{p.role}</td>
                      <td className="px-4 py-3 text-center font-mono text-white font-bold">{p.kills}/{p.deaths}/{p.assists}</td>
                      <td className="px-4 py-3 text-right font-mono text-yellow-400 font-semibold">{(p.gold/1000).toFixed(1)}k</td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-400 font-semibold">{p.damage.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {p.savages > 0 && <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[10px] mr-1">S:{p.savages}</span>}
                        {p.maniacs > 0 && <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">M:{p.maniacs}</span>}
                        {p.savages === 0 && p.maniacs === 0 && <span className="text-gray-600">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
