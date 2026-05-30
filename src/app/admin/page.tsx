import { prisma } from "@/lib/prisma";
import AdminClient from "@/components/AdminClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const role = (session.user as any)?.role;
  if (role !== 'staff' && role !== 'admin') {
    redirect("/profile");
  }

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { games: true } } }
  });
  const teams = await prisma.team.findMany({ 
    orderBy: { name: 'asc' },
    include: { players: true }
  });
  const recentGames = await prisma.game.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      team1: true,
      team2: true,
      tournament: true,
      bans: true,
      picks: true,
    }
  });
  const players = await prisma.player.findMany({
    orderBy: { username: 'asc' },
  });
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const staffUsers = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const awards = await prisma.award.findMany({
    include: { player: true, team: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminClient
      session={session}
      tournaments={tournaments}
      teams={teams}
      recentGames={recentGames}
      posts={posts}
      staffUsers={staffUsers}
      players={players}
      awards={awards}
    />
  );
}
