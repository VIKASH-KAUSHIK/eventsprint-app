import { NextResponse } from "next/server";
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

    const { inviteCode } = await req.json();
    if (!inviteCode || typeof inviteCode !== "string" || !inviteCode.trim()) {
      return NextResponse.json({ error: "Valid invite code is required" }, { status: 422 });
    }

    await dbConnect();

    const targetTeam = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!targetTeam) {
      return NextResponse.json({ error: "Invalid team invite code" }, { status: 404 });
    }

    // Check if organizer locked rosters
    if (targetTeam.isLocked) {
      return NextResponse.json({ error: "This team's roster is locked by the organizer." }, { status: 403 });
    }

    // Check organizer/team capacity limit
    const maxLimit = targetTeam.maxMembers || 4;
    if (targetTeam.members && targetTeam.members.length >= maxLimit) {
      return NextResponse.json(
        { error: `Team has reached maximum capacity (${maxLimit} members).` },
        { status: 400 }
      );
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-detach from previous team if switching squads
    if (user.teamId && user.teamId.toString() !== targetTeam._id.toString()) {
      const prevTeam = await Team.findById(user.teamId);
      if (prevTeam) {
        prevTeam.members = prevTeam.members.filter(
          (m: any) => m.toString() !== user._id.toString()
        );
        if (prevTeam.members.length === 0) {
          await Team.findByIdAndDelete(prevTeam._id);
        } else {
          if (prevTeam.leaderId?.toString() === user._id.toString()) {
            prevTeam.leaderId = prevTeam.members[0];
          }
          await prevTeam.save();
        }
      }
    }

    if (!targetTeam.members.includes(user._id)) {
      targetTeam.members.push(user._id);
      await targetTeam.save();
    }

    user.teamId = targetTeam._id;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `Successfully joined ${targetTeam.name}!`,
        team: targetTeam,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to join team" }, { status: 500 });
  }
}