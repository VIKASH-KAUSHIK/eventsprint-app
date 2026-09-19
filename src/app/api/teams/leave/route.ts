import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Team } from "@/models/Team";

export async function POST() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(auth.userId);
    if (!user || !user.teamId) {
      return NextResponse.json({ error: "You are not currently in any team" }, { status: 400 });
    }

    const team = await Team.findById(user.teamId);
    const leftTeamName = team?.name || "Team";

    if (team) {
      team.members = team.members.filter(
        (memberId: any) => memberId.toString() !== user._id.toString()
      );

      // If no members remain, remove the orphaned team
      if (team.members.length === 0) {
        await Team.findByIdAndDelete(team._id);
      } else {
        // If the leader leaves, reassign leadership to the next remaining member
        if (team.leaderId?.toString() === user._id.toString()) {
          team.leaderId = team.members[0];
        }
        await team.save();
      }
    }

    user.teamId = null;
    await user.save();

    return NextResponse.json(
      { success: true, message: `Successfully left ${leftTeamName}`, teamName: leftTeamName },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to leave team" }, { status: 500 });
  }
}