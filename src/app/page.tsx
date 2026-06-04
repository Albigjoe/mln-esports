import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, ChevronRight, Users, Swords, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tournaments = await prisma.tournament.findMany({
    take: 3,
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { games: true } } }
  });
  const teamCount = await prisma.team.count();

  // Latest News
  const latestPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });


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
            <Link href="/register-team" className="bg-surface hover:bg-surface-hover border border-mln-green/40 hover:border-mln-green text-white px-8 py-4 rounded-md font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 text-lg">
              Register Squad
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

      {/* Latest News */}
      <section className="py-20 bg-surface border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">Stay Updated</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider flex items-center gap-3 mt-1">
                <span className="w-2 h-8 bg-mln-green rounded-full"></span>
                Latest News
              </h2>
            </div>
            <Link href="/news" className="text-mln-green hover:text-mln-green-light flex items-center gap-1 font-bold uppercase text-sm tracking-wider transition-colors hidden sm:flex">
              View All <ChevronRight size={18} />
            </Link>
          </div>
          {latestPosts.length === 0 ? (
            <div className="bg-background border border-border-color rounded-xl p-10 text-center">
              <Newspaper className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">No News Yet</h3>
              <p className="text-gray-400">Check back soon for updates and match recaps.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post: any) => (
                <Link key={post.id} href={`/news/${post.slug}`}
                  className="group flex flex-col bg-background border border-border-color hover:border-mln-green rounded-xl overflow-hidden transition-all hover:-translate-y-1 shadow-lg">
                  {post.imageUrl ? (
                    <div className="h-44 overflow-hidden relative">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-44 bg-surface-hover flex items-center justify-center">
                      <Newspaper size={48} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-mln-green/10 text-mln-green border border-mln-green/30">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-black text-white text-lg leading-snug group-hover:text-mln-green transition-colors line-clamp-2 mb-2">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-gray-400 text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                    )}
                    <div className="mt-4 text-mln-green text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      Read More <ChevronRight size={14} />
                    </div>
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
