import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsListPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      players: true,
      _count: {
        select: {
          homeGames: true,
          awayGames: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface to-background border border-border-color p-8 rounded-2xl shadow-lg">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[140px] font-black text-mln-green/5 tracking-widest pointer-events-none select-none">
            TEAMS
          </div>
          <div className="relative z-10">
            <span className="text-xs text-mln-green font-bold uppercase tracking-[4px] mb-2 block">
              Official MLN Nigeria
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-4">
              Esports Squads
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl">
              Meet the official teams competing in the arena. View their active rosters, statistics, and support your favorite squad.
            </p>
          </div>
        </div>

        {/* Grid of Teams */}
        {teams.length === 0 ? (
          <div className="bg-surface border border-border-color rounded-2xl p-16 text-center text-gray-500">
            <Users className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">No Teams Registered Yet</h3>
            <p className="text-gray-400">Squads will appear here once registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team: any) => {
              const totalGames = team._count.homeGames + team._count.awayGames;
              return (
                <div
                  key={team.id}
                  className="bg-surface border border-border-color hover:border-mln-green/30 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Team Header */}
                    <div className="flex items-center gap-4 border-b border-border-color/60 pb-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-background border border-border-color overflow-hidden flex items-center justify-center p-2 shrink-0">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-mln-green font-black text-2xl">
                            {team.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/teams/${team.id}`}
                          className="text-xl font-black text-white uppercase hover:text-mln-green transition-colors line-clamp-1"
                        >
                          {team.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                            Matches: {totalGames}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Roster Section */}
                    <div>
                      <div className="text-[10px] text-mln-green font-bold uppercase tracking-[2px] mb-3">
                        Active Roster ({team.players.length})
                      </div>
                      {team.players.length === 0 ? (
                        <div className="text-xs text-gray-500 py-2">Roster is empty.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {team.players.map((p: any) => (
                            <Link
                              href={`/players/${p.username}`}
                              key={p.id}
                              className="flex items-center gap-2 bg-background/55 border border-border-color/60 hover:border-mln-green/20 px-3 py-2 rounded-xl transition-colors"
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-hover shrink-0 flex items-center justify-center border border-border-color/40">
                                {p.pictureUrl ? (
                                  <img
                                    src={p.pictureUrl}
                                    alt={p.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                                    {p.username.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-white truncate hover:text-mln-green transition-colors">
                                {p.username}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Profile Button */}
                  <div className="mt-6 pt-4 border-t border-border-color/60">
                    <Link
                      href={`/teams/${team.id}`}
                      className="w-full bg-surface-hover hover:bg-mln-green hover:text-black border border-border-color/80 hover:border-mln-green text-center text-xs font-bold uppercase tracking-wider py-3 rounded-xl block transition-all"
                    >
                      Team Hub &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
