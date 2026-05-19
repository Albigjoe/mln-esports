import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { games: true } } }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-4">
          All <span className="text-mln-green">Tournaments</span>
        </h1>
      </div>
      {tournaments.length === 0 ? (
        <div className="bg-surface border border-border-color rounded-xl p-16 text-center">
          <Trophy className="mx-auto text-gray-600 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-white mb-2">No Tournaments Found</h3>
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
                  <span className="text-sm font-mono text-gray-400 flex items-center gap-1">
                    <Calendar size={14} /> {t._count.games} games
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-mln-green transition-colors mb-2 line-clamp-2">{t.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
