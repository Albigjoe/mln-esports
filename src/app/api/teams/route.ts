import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams?q=searchterm — for autocomplete
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const teams = await prisma.team.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      take: 10,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    });
    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logoUrl } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const team = await prisma.team.create({
      data: { name, logoUrl: logoUrl || null },
    });

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

