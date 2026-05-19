import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, inviteCode } = await req.json();

    const secureInviteCode = process.env.REGISTRATION_INVITE_CODE || 'MLN-STAFF-2026';
    if (inviteCode !== secureInviteCode) {
      return NextResponse.json(
        { error: 'Invalid invitation/access code. Registration denied.' },
        { status: 403 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const newUser = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'staff',
      },
    });

    return NextResponse.json(
      { message: 'Staff account successfully created', userId: newUser.id },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
