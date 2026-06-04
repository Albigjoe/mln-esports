import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminCheck = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
    const userCheck = await prisma.user.findUnique({ where: { email: session.user.email } });
    const isAuthorized = !!adminCheck || (userCheck && userCheck.role === 'ADMIN');
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, logoUrl, ownerEmail } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (ownerEmail !== undefined) data.ownerEmail = ownerEmail || null;

    const updated = await prisma.team.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, team: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
