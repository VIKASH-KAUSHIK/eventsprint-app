import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Team } from "@/models/Team";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(auth.userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let team = null;
    if (user.teamId) {
      try {
        team = await Team.findById(user.teamId)
          .populate("members", "name email")
          .lean();
      } catch (err) {
        console.error("Error fetching team for profile:", err);
      }
    }

    return NextResponse.json({ user, team }, { status: 200 });
  } catch (err: any) {
    console.error("Profile fetch route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}