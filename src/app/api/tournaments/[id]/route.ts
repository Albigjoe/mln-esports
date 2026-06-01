import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
    if (!adminUser) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { bannerUrl, status, registrationStatus, action } = body;

    // Handle "Restart" action (Clear bracket, reset to upcoming)
    if (action === 'restart') {
      await prisma.bracketMatch.deleteMany({ where: { tournamentId: id } });
      const tournament = await prisma.tournament.update({
        where: { id },
        data: { status: 'upcoming' },
      });
      return NextResponse.json({ success: true, tournament });
    }

    // Handle normal updates
    const updateData: any = {};
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (status !== undefined) updateData.status = status;
    if (registrationStatus !== undefined) updateData.registrationStatus = registrationStatus;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
    if (!adminUser) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { id } = await params;

    // Delete bracket matches manually just in case cascade isn't set up
    await prisma.bracketMatch.deleteMany({ where: { tournamentId: id } });
    // Delete participants
    await prisma.tournamentParticipant.deleteMany({ where: { tournamentId: id } });
    // Delete the tournament
    await prisma.tournament.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
