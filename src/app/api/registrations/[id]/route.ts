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
          where: { name: teamName }
        });

        if (!team) {
          team = await tx.team.create({
            data: {
              name: teamName,
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

        // 2. Upsert players under the team
        for (const p of players) {
          const data = {
            username:   p.username,
            gameId:     p.gameId     || null,
            realName:   p.realName   || '',
            role:       p.role       || 'PLAYER',
            pictureUrl: p.pictureUrl || '',
            teamId:     team.id,
            state:      p.state      || 'Lagos',
            rank:       p.rank       || 'Mythic',
          };

          await tx.player.upsert({
            where:  { username: p.username },
            update: { ...data },
            create: { ...data },
          });
        }

        // 3. Finally, update registration status
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
