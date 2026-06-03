import { prisma } from './src/lib/prisma';
const { generateDoubleEliminationMatches } = require('./src/lib/bracketGenerator');

async function runTest() {
  console.log("======================================");
  console.log("Starting DB end-to-end simulation v2");
  console.log("======================================");

  // --- PART 1: SQUAD LOGIC TEST ---
  console.log("\n--- TEST 1: SQUAD & PLAYER LOGIC ---");
  console.log("Creating 2 fake squads and 1 fake player...");
  const teamA = await prisma.team.create({ data: { name: `Team A (Leader) - ${Date.now()}`, ownerEmail: "leaderA@test.com" } });
  const teamB = await prisma.team.create({ data: { name: `Team B (Target) - ${Date.now()}`, ownerEmail: "leaderB@test.com" } });
  
  let player = await prisma.player.create({
    data: { username: `TestPlayer_${Date.now()}`, realName: "John Doe", teamId: teamA.id }
  });
  console.log(`✅ Player ${player.username} created and assigned to ${teamA.name}`);

  console.log("Simulating: Player leaves squad A voluntarily...");
  player = await prisma.player.update({ where: { id: player.id }, data: { teamId: null } });
  if (player.teamId === null) console.log("✅ Player successfully left Team A!");

  console.log("Simulating: Player joins squad B...");
  player = await prisma.player.update({ where: { id: player.id }, data: { teamId: teamB.id } });
  if (player.teamId === teamB.id) console.log("✅ Player successfully joined Team B!");

  console.log("Simulating: Leader of Team B removes player...");
  player = await prisma.player.update({ where: { id: player.id }, data: { teamId: null } });
  if (player.teamId === null) console.log("✅ Leader successfully removed player from Team B!");

  console.log("Simulating: Leader of Team A adds player back...");
  player = await prisma.player.update({ where: { id: player.id }, data: { teamId: teamA.id } });
  if (player.teamId === teamA.id) console.log("✅ Leader successfully added player to Team A!");


  // --- PART 2: DOUBLE ELIMINATION TEST ---
  console.log("\n--- TEST 2: DOUBLE ELIMINATION BRACKET ---");
  console.log("Creating 4 fake teams for tournament...");
  const tourneyTeams = [];
  for(let i=1; i<=4; i++) {
    tourneyTeams.push(await prisma.team.create({ data: { name: `DE Team ${i} - ${Date.now()}` } }));
  }
  
  console.log("Creating fake tournament...");
  const tournament = await prisma.tournament.create({
    data: { name: `DE Tournament - ${Date.now()}`, status: 'upcoming', format: 'DOUBLE_ELIMINATION', startDate: new Date() }
  });

  console.log("Enrolling teams...");
  for(const team of tourneyTeams) {
    await prisma.tournamentParticipant.create({ data: { tournamentId: tournament.id, teamId: team.id } });
  }

  console.log("Generating DOUBLE_ELIMINATION Bracket for 4 teams...");
  const orderedTeams = tourneyTeams.map(t => t.id);
  const deMatches = generateDoubleEliminationMatches(tournament.id, orderedTeams, 4);
  console.log(`✅ Double Elimination generated ${deMatches.length} total matches (Winners + Losers brackets)!`);

  // Insert to DB using mapping
  const idMap = new Map();
  const sortedMatches = [...deMatches].sort((a, b) => b.round - a.round);
  for (let m of sortedMatches) {
    const created = await prisma.bracketMatch.create({
      data: {
        tournamentId: m.tournamentId,
        stage: m.stage,
        round: m.round,
        matchOrder: m.matchOrder,
        isBye: m.isBye,
        status: m.status,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        winnerId: m.winnerId,
        nextMatchId: m.nextMatchLocalId ? idMap.get(m.nextMatchLocalId) : null,
        nextLoserMatchId: m.nextLoserMatchLocalId ? idMap.get(m.nextLoserMatchLocalId) : null,
      }
    });
    idMap.set(m.localId, created.id);
  }

  const savedMatches = await prisma.bracketMatch.findMany({ where: { tournamentId: tournament.id }});
  if (savedMatches.length === deMatches.length) {
    console.log(`✅ Successfully saved all ${savedMatches.length} Double Elimination matches to DB!`);
  } else {
    console.error("❌ Failed to save all matches!");
  }

  // --- CLEANUP ---
  console.log("\n--- CLEANUP ---");
  console.log("Cleaning up fake data...");
  await prisma.bracketMatch.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.tournamentParticipant.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.tournament.delete({ where: { id: tournament.id } });
  
  await prisma.player.delete({ where: { id: player.id } });
  await prisma.team.delete({ where: { id: teamA.id } });
  await prisma.team.delete({ where: { id: teamB.id } });
  for(const team of tourneyTeams) {
    await prisma.team.delete({ where: { id: team.id } });
  }
  console.log("✅ Cleanup complete! Database returned to original state.");
}

runTest()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
