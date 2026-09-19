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
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 422 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    await dbConnect();

    const UserModel = (User as any)?.default || User;
    const user = await UserModel.findOne({ email: cleanEmail });

    // Reject unregistered accounts
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please create an account first." },
        { status: 404 }
      );
    }

    // Verify password against passwordHash or password field
    const storedHash = user.passwordHash || user.password;
    if (!storedHash) {
      return NextResponse.json(
        { error: "Account credentials invalid. Please reset password or re-register." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, storedHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password for this account." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name || cleanEmail.split("@")[0] || "Participant",
      role: user.role || "participant",
      teamId: user.teamId ? user.teamId.toString() : null,
    };

    const token = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: "7d" });

    const res = NextResponse.json(
      {
        success: true,
        message: "Authenticated successfully",
        user: sessionPayload,
      },
      { status: 200 }
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
    console.error("Login API failure:", err);
    return NextResponse.json(
      { error: err.message || "Internal authentication error" },
      { status: 500 }
    );
  }
}