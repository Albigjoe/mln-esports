import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
