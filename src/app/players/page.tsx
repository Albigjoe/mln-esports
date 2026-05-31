import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlayersGrid from "@/components/PlayersGrid";
export const dynamic = "force-dynamic";

export default async function PlayersDirectory() {
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { username: "asc" }
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

        <PlayersGrid initialPlayers={players} />
      </div>
    </main>
  );
}
