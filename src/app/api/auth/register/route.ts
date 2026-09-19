import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import {User} from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, skills, bio } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const parsedSkills = typeof skills === 'string' ? skills.split(',').map((s) => s.trim()) : skills;

    const user = await User.create({
      name,
      email,
      passwordHash,
      skills: parsedSkills || [],
      bio: bio || '',
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });
    const response = NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}