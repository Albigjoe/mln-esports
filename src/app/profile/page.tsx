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

  // Look up the player record tagged to this admin account via the stable "admin:<email>" convention
  let player = await prisma.player.findFirst({
    where: { realName: `admin:${session.user.email}` },
    include: {
      team: {
        include: {
          players: {
            orderBy: { username: 'asc' }
          }
        }
      }
    },
  });

  // Synthesize or enhance player if they are a captain of a team but don't have a player record or their player record is not linked to their team
  const ownedTeam = await prisma.team.findFirst({
    where: { ownerEmail: session.user.email },
    include: {
      players: {
        orderBy: { username: 'asc' }
      }
    }
  });

  if (!player && ownedTeam) {
    // Synthesize a placeholder player for the squad leader so they can see and manage their team!
    player = {
      id: 'captain-placeholder',
      username: adminUser?.name || session.user.name || 'Squad Captain',
      gameId: adminUser?.gameId || '',
      realName: adminUser?.name || '',
      role: 'CAPTAIN',
      state: 'Lagos',
      rank: 'Mythic',
      pictureUrl: null,
      team: ownedTeam,
      createdAt: new Date()
    } as any;
  } else if (player && ownedTeam && !player.team) {
    // If the player record exists but is not linked to their owned team, force-link it!
    player.team = ownedTeam as any;
    player.teamId = ownedTeam.id;
  }

  // Fetch stats for the player if they exist
  let picks: any[] = [];
  if (player && player.username) {
    picks = await prisma.pick.findMany({
      where: { playerUsername: player.username },
      include: { game: { include: { tournament: true } } },
      orderBy: { game: { createdAt: "desc" } }
    });
  }

  return (
    <ProfileClient
      adminEmail={session.user.email}
      adminName={adminUser?.name || session.user.name || ''}
      adminRole={(adminUser as any)?.role || 'staff'}
      player={player ? JSON.parse(JSON.stringify(player)) : null}
      picks={JSON.parse(JSON.stringify(picks))}
    />
  );
}
