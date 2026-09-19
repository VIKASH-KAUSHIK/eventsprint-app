import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { skills, primaryTrack, bio } = await req.json();
    await dbConnect();

    await User.findByIdAndUpdate(auth.userId, {
      skills: Array.isArray(skills) ? skills : skills?.split(",").map((s: string) => s.trim()),
      primaryTrack,
      bio,
    });

    return NextResponse.json({ success: true, message: "Profile updated" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}