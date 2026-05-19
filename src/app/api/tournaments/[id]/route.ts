import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { bannerUrl } = body;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { bannerUrl },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
