import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Team } from "@/models/Team";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const { teamName, track } = body || {};
    if (!teamName || typeof teamName !== "string" || !teamName.trim()) {
      return NextResponse.json(
        { error: "Team name cannot be empty." },
        { status: 422 }
      );
    }

    await dbConnect();

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already belongs to a team
    if (user.teamId) {
      return NextResponse.json(
        { error: "You are already enrolled in a team. Please leave your team first." },
        { status: 400 }
      );
    }

    // Generate unique invite token (e.g., INV-9B2F1C)
    const inviteCode = `INV-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Create team with explicit defaults so it's immediately eligible for matching
    const team = await Team.create({
      name: teamName.trim(),
      leaderId: user._id,
      inviteCode,
      track: track || user.primaryTrack || "AI & Distributed Systems",
      maxMembers: 4,
      isLocked: false,
      members: [user._id],
    });

    // Update user's current team reference
    user.teamId = team._id;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Team created successfully",
        id: team._id.toString(),
        name: team.name,
        inviteCode: team.inviteCode,
        track: team.track,
        maxMembers: team.maxMembers,
        members: [
          {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        ],
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Team creation failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create team" },
      { status: 500 }
    );
  }
}