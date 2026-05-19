import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  news: { bg: 'bg-mln-green/15 border-mln-green/30', text: 'text-mln-green', label: 'NEWS' },
  transfer: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', label: 'TRANSFER' },
  announcement: { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', label: 'ANNOUNCEMENT' },
  recap: { bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', label: 'MATCH RECAP' },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) {
    notFound();
  }

  const cat = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.news;

  // Get related posts
  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-mln-green transition-colors">Home</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-mln-green transition-colors">News</Link>
        <span>/</span>
        <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
      </div>

      {/* Category + Date */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${cat.bg} ${cat.text}`}>
          {cat.label}
        </span>
        <span className="text-gray-500 text-sm">
          {new Date(post.createdAt).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wide mb-6 leading-tight">
        {post.title}
      </h1>

      {/* Author */}
      <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border-color">
        <div className="w-10 h-10 rounded-full bg-mln-green/20 border border-mln-green/40 flex items-center justify-center text-mln-green font-bold text-sm">
          {post.authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{post.authorName}</p>
          <p className="text-gray-500 text-xs">MLN Staff</p>
        </div>
      </div>

      {/* Banner Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border-color mb-10 shadow-2xl">
          <img src={post.imageUrl} alt={post.title} className="w-full h-auto rounded-xl" />
        </div>
      )}

      {/* Content */}
      <article className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed whitespace-pre-line">
        {post.content}
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="mt-16 pt-10 border-t border-border-color">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-mln-green rounded-full"></span>
            More News
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r: any) => {
              const rc = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.news;
              return (
                <Link key={r.id} href={`/news/${r.slug}`} className="group bg-surface border border-border-color rounded-lg p-4 hover:border-mln-green transition-all">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${rc.bg} ${rc.text} inline-block mb-2`}>
                    {rc.label}
                  </span>
                  <h4 className="text-white font-bold text-sm group-hover:text-mln-green transition-colors line-clamp-2">{r.title}</h4>
                  <p className="text-gray-500 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
