import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, teamName, logoUrl, lineupImageUrl, players } = await req.json();

    const registrationRecord = await prisma.teamRegistration.findUnique({
      where: { id }
    });
    if (!registrationRecord) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    let reg;

    if (status === 'APPROVED') {
      reg = await prisma.$transaction(async (tx) => {
        // 1. Find or create the team
        let team = await tx.team.findUnique({
          where: { name: teamName.trim() }
        });

        if (!team) {
          team = await tx.team.create({
            data: {
              name: teamName.trim(),
              logoUrl: logoUrl || '',
              lineupImageUrl: lineupImageUrl || '',
              ownerEmail: registrationRecord.contactEmail
            }
          });
        } else {
          // Update details of existing team if provided
          team = await tx.team.update({
            where: { id: team.id },
            data: {
              logoUrl: logoUrl || team.logoUrl,
              lineupImageUrl: lineupImageUrl || team.lineupImageUrl,
              ownerEmail: team.ownerEmail || registrationRecord.contactEmail
            }
          });
        }

        // 2. Collect the new roster's usernames for stale-player cleanup later
        const newRosterUsernames = players.map((p: any) => p.username);

        // 3. Upsert players under the team, handling gameId conflicts gracefully
        for (const p of players) {
          const gameIdValue = p.gameId ? String(p.gameId).trim() : null;
          const usernameValue = p.username ? String(p.username).trim() : `Player-${Math.random().toString(36).substring(7)}`;

          // If this player has a gameId, check if a DIFFERENT player already owns it
          if (gameIdValue) {
            const conflictingPlayer = await tx.player.findUnique({
              where: { gameId: gameIdValue }
            });
            // If a different player (by username) has this gameId, clear theirs first
            if (conflictingPlayer && conflictingPlayer.username !== usernameValue) {
              await tx.player.update({
                where: { id: conflictingPlayer.id },
                data: { gameId: null }
              });
            }
          }

          const data = {
            username:   usernameValue,
            gameId:     gameIdValue,
            realName:   p.realName   ? String(p.realName) : '',
            role:       p.role       ? String(p.role)     : 'PLAYER',
            pictureUrl: p.pictureUrl ? String(p.pictureUrl) : '',
            teamId:     team.id,
            state:      p.state      ? String(p.state)    : 'Lagos',
            rank:       p.rank       ? String(p.rank)     : 'Mythic',
          };

          await tx.player.upsert({
            where:  { username: usernameValue },
            update: { ...data },
            create: { ...data },
          });
        }

        // 4. (Removed) We no longer delete stale players. 
        // Any new players in the submission are added to the team, and old players are kept.


        // 5. Finally, update registration status
        return await tx.teamRegistration.update({
          where: { id },
          data: { status }
        });
      });
    } else {
      reg = await prisma.teamRegistration.update({
        where: { id },
        data: { status }
      });
    }

    return NextResponse.json({ success: true, data: reg });
  } catch (error: any) {
    console.error('Registration Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Only admin/staff allowed
    const callingUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email || '' },
    });
    if (!callingUser || !['admin', 'staff'].includes(callingUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch the registration record first to check status and name
    const reg = await prisma.teamRegistration.findUnique({
      where: { id }
    });

    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Perform transaction to clean up team and players if already approved
    await prisma.$transaction(async (tx) => {
      if (reg.status === 'APPROVED') {
        // Find corresponding team
        const team = await tx.team.findUnique({
          where: { name: reg.teamName }
        });

        if (team) {
          // Delete all players associated with this team
          await tx.player.deleteMany({
            where: { teamId: team.id }
          });

          // Delete the team itself
          await tx.team.delete({
            where: { id: team.id }
          });
        }
      }

      // Delete the registration record itself
      await tx.teamRegistration.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
