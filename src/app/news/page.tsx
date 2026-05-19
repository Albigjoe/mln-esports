import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  news: { bg: 'bg-mln-green/15 border-mln-green/30', text: 'text-mln-green', label: 'NEWS' },
  transfer: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', label: 'TRANSFER' },
  announcement: { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', label: 'ANNOUNCEMENT' },
  recap: { bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', label: 'MATCH RECAP' },
};

export default async function NewsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-8 bg-mln-green rounded-full"></span>
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wider">
            News & <span className="text-mln-green">Updates</span>
          </h1>
        </div>
        <p className="text-gray-400 text-lg mt-3 ml-5">Latest from the Mobile Legends Nigeria scene — transfers, announcements, match recaps and more.</p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-3 mb-10">
        {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
          <span key={key} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="bg-surface border border-border-color rounded-xl p-16 text-center">
          <div className="text-6xl mb-6">📰</div>
          <h3 className="text-2xl font-bold text-white mb-3">No Posts Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">Stay tuned! News articles, transfer updates, and match recaps will appear here as they are published.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => {
            const cat = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.news;
            return (
              <Link key={post.id} href={`/news/${post.slug}`} className="group block overflow-hidden rounded-xl bg-surface border border-border-color hover:border-mln-green transition-all hover:-translate-y-1 shadow-lg">
                {/* Image */}
                <div className="h-48 bg-surface-hover relative overflow-hidden">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-background">
                      <span className="text-5xl opacity-30">📰</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${cat.bg} ${cat.text}`}>
                      {cat.label}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white group-hover:text-mln-green transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-400 text-sm line-clamp-3 mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{post.authorName}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
