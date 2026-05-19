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

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { games: true } } }
  });
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const recentGames = await prisma.game.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { team1: true, team2: true, tournament: true }
  });
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const staffUsers = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
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
    />
  );
}
