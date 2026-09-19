import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Team } from "@/models/Team";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    await dbConnect();
    const user = await User.findById(auth.userId).select("-passwordHash -password").lean();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    let team = null;
    if (user.teamId) {
      team = await Team.findById(user.teamId)
        .populate("members", "name email skills role")
        .lean();
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user._id.toString(),
          name: user.name || "Participant",
          email: user.email,
          role: user.role || "participant",
          skills: user.skills || ["Next.js", "React", "Node.js"],
          primaryTrack: user.primaryTrack || "AI & Distributed Systems",
          bio: user.bio || "",
        },
        team: team
          ? {
              id: team._id.toString(),
              name: team.name,
              leaderId: team.leaderId?.toString(),
              inviteCode: team.inviteCode,
              track: team.track,
              maxMembers: team.maxMembers || 4,
              isLocked: team.isLocked || false,
              members: team.members || [],
            }
          : null,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}