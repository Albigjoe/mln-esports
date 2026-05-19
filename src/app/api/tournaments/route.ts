import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, status, startDate, bannerUrl } = body;

    if (!name || !startDate) return NextResponse.json({ error: 'Name and start date are required' }, { status: 400 });

    const tournament = await prisma.tournament.create({
      data: { name, status, startDate, bannerUrl: bannerUrl || null },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
