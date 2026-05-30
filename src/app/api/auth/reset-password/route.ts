import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Token, email, and new password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash the token from the URL to compare against the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the token in DB
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        token: hashedToken,
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Update the password
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.adminUser.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete all tokens for this email (cleanup)
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully! You can now sign in.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
