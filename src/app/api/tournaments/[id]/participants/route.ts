import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: id },
      include: { team: true },
    });
    return NextResponse.json({ participants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamId } = body;

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        teamId,
      },
      include: { team: true },
    });

    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    await prisma.tournamentParticipant.deleteMany({
      where: {
        tournamentId: id,
        teamId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamId, seed } = body;

    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    const participant = await prisma.tournamentParticipant.updateMany({
      where: {
        tournamentId: id,
        teamId,
      },
      data: {
        seed: seed ? parseInt(seed) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

