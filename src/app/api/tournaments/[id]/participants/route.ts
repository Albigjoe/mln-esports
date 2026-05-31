import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: params.id },
      include: { team: true },
    });
    return NextResponse.json({ participants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { teamId } = body;

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: params.id,
        teamId,
      },
      include: { team: true },
    });

    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    await prisma.tournamentParticipant.deleteMany({
      where: {
        tournamentId: params.id,
        teamId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
