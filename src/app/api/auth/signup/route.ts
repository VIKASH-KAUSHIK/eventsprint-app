import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models/User";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "eventsprint-super-secret-key-2026";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 });
    }

    const { name, email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 422 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    await dbConnect();

    const UserModel = (User as any)?.default || User;
    const existing = await UserModel.findOne({ email: cleanEmail });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use lowercase 'participant' so it satisfies lowercase enum schemas
    const user = await UserModel.create({
      name: name?.trim() || cleanEmail.split("@")[0] || "Participant",
      email: cleanEmail,
      passwordHash: hashedPassword,
      role: "participant",
    });

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "participant",
      teamId: null,
    };

    const token = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: "7d" });

    const res = NextResponse.json(
      {
        success: true,
        message: "Account registered successfully",
        user: sessionPayload,
      },
      { status: 201 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account" },
      { status: 500 }
    );
  }
}