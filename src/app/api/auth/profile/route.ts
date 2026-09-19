import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skills, primaryTrack, bio } = await req.json();

    await dbConnect();

    const formattedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      {
        skills: formattedSkills,
        primaryTrack: primaryTrack || "AI & Distributed Systems",
        bio: bio || "",
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Skills and profile updated successfully",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          skills: updatedUser.skills,
          primaryTrack: updatedUser.primaryTrack,
          bio: updatedUser.bio,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}