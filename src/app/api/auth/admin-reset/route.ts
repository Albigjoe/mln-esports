import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only admin/staff can reset passwords
    const callingUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    });
    if (!callingUser || !['admin', 'staff'].includes(callingUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Only staff/admin can reset passwords' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow resetting your own password via admin reset
    if (targetUser.email === session.user.email) {
      return NextResponse.json({ error: 'Use the profile settings to change your own password' }, { status: 400 });
    }

    // Generate a temporary password
    const tempPassword = 'MLN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.adminUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      tempPassword,
      message: `Password reset for ${targetUser.email}. Share the temporary password with them.`,
    });
  } catch (error: any) {
    console.error('Admin reset error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
