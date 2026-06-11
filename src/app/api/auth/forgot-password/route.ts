import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success even if email doesn't exist (prevent enumeration)
    const user = await prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hash it for storage (we only store hashed tokens in DB)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    // Create new token with 1-hour expiry
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Build the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'MLN Esports <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset Your MLN Password',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00c853; font-size: 28px; margin: 0; letter-spacing: 4px;">MLN</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px;">Mobile Legends Nigeria</p>
              </div>
              <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 16px; padding: 32px; text-align: center;">
                <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px;">Password Reset</h2>
                <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                  You requested a password reset for your MLN account. Click the button below to set a new password.
                </p>
                <a href="${resetUrl}" style="display: inline-block; background: #00c853; color: #000; font-weight: 800; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                  RESET PASSWORD
                </a>
                <p style="color: #666; font-size: 12px; margin-top: 24px;">
                  This link expires in <strong style="color: #00c853;">1 hour</strong>.
                </p>
                <p style="color: #555; font-size: 11px; margin-top: 16px; border-top: 1px solid #2a2a3e; padding-top: 16px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError: any) {
        console.error('[EMAIL SENDING ERROR]: Failed to send email via Resend.', emailError);
        console.log(`[FALLBACK - PASSWORD RESET URL]: Token for ${user.email}: ${resetUrl}`);
      }
    } else {
      // Fallback: log the reset URL for development
      console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
