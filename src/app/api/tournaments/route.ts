import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tournaments — list all for registration form
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, status: true, startDate: true, logoUrl: true },
    });
    return NextResponse.json({ tournaments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, status, startDate, bannerUrl, logoUrl, format, registrationStatus } = body;

    if (!name || !startDate) return NextResponse.json({ error: 'Name and start date are required' }, { status: 400 });

    const tournament = await prisma.tournament.create({
      data: { 
        name, 
        status, 
        startDate, 
        bannerUrl: bannerUrl || null,
        logoUrl: logoUrl || null,
        format: format || 'SINGLE_ELIMINATION',
        registrationStatus: registrationStatus || 'OPEN'
      },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

