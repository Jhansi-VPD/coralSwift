import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Server authentication configuration is missing.' },
        { status: 500 }
      );
    }

    const isEmailValid = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const isPasswordValid = password === adminPassword;

    if (isEmailValid && isPasswordValid) {
      return NextResponse.json({
        success: true,
        user: {
          email: adminEmail,
          role: 'admin',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password. Please try again.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
