import { prisma } from "@/lib/prisma";
import Link from "next/link";


export const dynamic = "force-dynamic";

export default async function PlayersDirectory({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const playersPerPage = 20;

  const totalPlayersCount = await prisma.player.count();
  const totalPages = Math.ceil(totalPlayersCount / playersPerPage) || 1;
  
  // Ensure current page is within valid bounds
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  const skip = (validPage - 1) * playersPerPage;

  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { username: "asc" },
    skip,
    take: playersPerPage,
  });

  return (
    <main className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            PLAYER <span className="text-mln-green">DIRECTORY</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base uppercase tracking-wider font-bold">
            Explore the rosters of Nigeria's top Mobile Legends squads and free agents.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
          {players.map(player => (
            <Link 
              key={player.id} 
              href={`/players/${encodeURIComponent(player.username)}`}
              className="bg-surface border border-border-color hover:border-mln-green rounded-xl overflow-hidden group transition-all"
            >
              <div className="aspect-square bg-surface-hover relative overflow-hidden">
                {player.pictureUrl ? (
                  <img src={player.pictureUrl} alt={player.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-700 bg-gradient-to-br from-surface to-background">
                    {player.username.substring(0,2).toUpperCase()}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {player.team ? (
                    <span className="bg-mln-green text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow">
                      {player.team.name}
                    </span>
                  ) : (
                    <span className="bg-gray-700 text-gray-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow">
                      Free Agent
                    </span>
                  )}
                  <span className="bg-background/80 backdrop-blur text-white border border-white/10 text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow">
                    {player.role || 'Player'}
                  </span>
                </div>
              </div>
              <div className="p-3 md:p-4 text-center">
                <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-wider truncate">
                  {player.username}
                </h3>
                {player.realName && !player.realName.startsWith('admin:') && (
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mt-1">
                    {player.realName}
                  </p>
                )}
                {player.gameId && (
                  <p className="text-[9px] text-mln-green font-black uppercase tracking-widest mt-1">
                    ✓ Verified
                  </p>
                )}
              </div>
            </Link>
          ))}
          {players.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold uppercase tracking-widest">
              No players found. Check back later.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pb-12">
            {validPage > 1 ? (
              <Link
                href={`/players?page=${validPage - 1}`}
                className="bg-surface border border-border-color text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-surface-hover hover:border-mln-green transition-colors"
              >
                Previous
              </Link>
            ) : (
              <div className="bg-background border border-border-color/50 text-gray-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest cursor-not-allowed">
                Previous
              </div>
            )}
            
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">
              Page {validPage} of {totalPages}
            </div>
            
            {validPage < totalPages ? (
              <Link
                href={`/players?page=${validPage + 1}`}
                className="bg-mln-green text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-mln-green-dark transition-colors shadow-lg shadow-mln-green/10"
              >
                Next
              </Link>
            ) : (
              <div className="bg-background border border-border-color/50 text-gray-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest cursor-not-allowed">
                Next
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
