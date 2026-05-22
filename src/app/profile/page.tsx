import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import ProfileClient from '@/components/ProfileClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Your Profile</h1>
          <p className="text-gray-400 mb-8">Sign in to view and edit your player profile, track your stats, and manage your account details.</p>
          <Link
            href="/admin/login"
            className="inline-block bg-mln-green hover:bg-mln-green-dark text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Fetch admin user record
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: session.user.email },
  });

  // Try to find a Player record associated with this admin by matching email-based username
  // Convention: we store admin email in player record's username field with a special lookup
  // We use a separate convention: find player where username starts with the first part of their email
  const emailPrefix = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  // Look for an existing player linked by admin email stored in a special metadata field
  // We store the adminEmail in a Player record via the realName or a tag
  // Simplest: look up player by username that matches adminUser name slug
  const nameSlug = adminUser?.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || emailPrefix;

  // Find any player the admin might have already created for themselves
  let player = await prisma.player.findFirst({
    where: {
      OR: [
        { username: nameSlug },
        { username: emailPrefix },
        { realName: adminUser?.name || '' },
      ]
    },
    include: { team: true }
  });

  return (
    <ProfileClient
      adminEmail={session.user.email}
      adminName={adminUser?.name || session.user.name || ''}
      adminRole={(adminUser as any)?.role || 'staff'}
      player={player ? JSON.parse(JSON.stringify(player)) : null}
    />
  );
}
