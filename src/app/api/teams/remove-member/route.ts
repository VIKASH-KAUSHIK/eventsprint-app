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

    const { memberId } = await req.json();
    if (!memberId) {
      return NextResponse.json({ error: "Target memberId is required" }, { status: 422 });
    }

    await dbConnect();
    const caller = await User.findById(auth.userId);
    if (!caller || !caller.teamId) {
      return NextResponse.json({ error: "You do not belong to a team" }, { status: 400 });
    }

    const team = await Team.findById(caller.teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only team leader or ORGANIZER role can kick members
    const isLeader = team.leaderId.toString() === caller._id.toString();
    const isOrganizer = caller.role === "ORGANIZER";

    if (!isLeader && !isOrganizer) {
      return NextResponse.json({ error: "Only leaders or organizers can remove members" }, { status: 403 });
    }

    if (memberId === team.leaderId.toString()) {
      return NextResponse.json({ error: "Leader cannot be kicked. Disband team instead." }, { status: 400 });
    }

    // Remove user from team array
    team.members = team.members.filter((m: any) => m.toString() !== memberId);
    await team.save();

    // Detach teamId on target user
    await User.findByIdAndUpdate(memberId, { teamId: null });

    return NextResponse.json(
      { success: true, message: "Member removed from team" },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 500 });
  }
}