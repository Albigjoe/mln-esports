import fs from 'fs';
import path from 'path';

// Load .env manually
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error("Error loading .env manually:", e);
}

import { prisma } from './lib/prisma';

async function main() {
  const games = await prisma.game.findMany({
    include: {
      team1: true,
      team2: true,
      picks: true,
      tournament: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log("=== COMPILING LIST OF GAMES ===");
  games.forEach(g => {
    console.log(`\nGame ID: ${g.id}`);
    console.log(`Tournament: ${g.tournament.name} | Week: ${g.week} | Game: ${g.gameNumber} | Date: ${g.date}`);
    console.log(`Matchup: ${g.team1.name} vs ${g.team2.name} | Winner: ${g.winner}`);
    console.log(`Picks:`);
    g.picks.forEach(p => {
      console.log(` - [${p.team}] ${p.hero} (${p.playerUsername || 'unnamed'}): DMG=${p.damage}, DMG_TAKEN=${p.damageTaken}`);
    });
  });
  process.exit(0);
}
main().catch(console.error);
