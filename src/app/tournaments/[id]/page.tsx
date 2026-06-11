import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TournamentTabs from "@/components/TournamentTabs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TournamentHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("Tournament Hub loading for ID:", id);
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      games: {
        include: { team1: true, team2: true, bans: true, picks: true },
        orderBy: { createdAt: 'desc' }
      },
    }
  });

  if (!tournament) return notFound();

  const participantsList = await prisma.tournamentParticipant.findMany({
    where: { tournamentId: id },
    include: {
      team: {
        include: {
          players: true
        }
      }
    }
  });

  const teams = participantsList.map(p => p.team).sort((a, b) => a.name.localeCompare(b.name));
  const players = teams.flatMap(t => t.players);


  const bracketMatches = await prisma.bracketMatch.findMany({
    where: { tournamentId: id },
    include: {
      team1: { select: { id: true, name: true, logoUrl: true } },
      team2: { select: { id: true, name: true, logoUrl: true } }
    },
    orderBy: [
      { round: 'asc' },
      { matchOrder: 'asc' }
    ]
  });

  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId: id },
    select: { teamId: true, seed: true, wins: true, losses: true, points: true }
  });

  return (
    <div className="w-full">
      {/* Dynamic Custom Banner */}
      <div 
        className="relative bg-surface border-b border-border-color pt-24 pb-12 px-4 overflow-hidden min-h-[300px] flex items-end"
        style={{
          backgroundImage: tournament.bannerUrl ? `linear-gradient(to bottom, rgba(5,9,5,0.4), rgba(5,9,5,0.95)), url(${tournament.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Glow Effects */}
        {!tournament.bannerUrl && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-mln-green/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          </>
        )}
        
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl bg-background border-4 border-mln-green shadow-[0_0_30px_rgba(0,200,83,0.3)] flex items-center justify-center shrink-0 overflow-hidden">
            {tournament.logoUrl ? (
              <img src={tournament.logoUrl} alt={tournament.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-mln-green font-black text-4xl">AFL</span>
            )}
          </div>
          <div className="text-center md:text-left md:mb-2">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm mb-4 inline-block ${
              tournament.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
              tournament.status === 'upcoming' ? 'bg-mln-green text-black' :
              'bg-gray-700 text-gray-300'
            }`}>{tournament.status}</span>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-lg">{tournament.name}</h1>
            <p className="text-gray-300 text-lg max-w-2xl font-semibold drop-shadow">{tournament.games.length} games played · {teams.length} teams competing</p>
            {tournament.status === 'upcoming' && (
              <div className="mt-4">
                <Link href="/register-team" className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,200,83,0.3)] inline-block">
                  Register Your Squad
                </Link>
              </div>
            )}
            {tournament.status === 'live' && (
              <div className="mt-4">
                <Link href="/register-team" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all inline-block shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Roster Submission
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TournamentTabs tournament={tournament} games={tournament.games} teams={teams} players={players} bracketMatches={bracketMatches} participants={participants} />
      </div>
    </div>
  );
}
