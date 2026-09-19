import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Team } from "@/models/Team";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 1. Current user profile
    const currentUser = await User.findById(auth.userId).lean();
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSkills: string[] =
      currentUser.skills && currentUser.skills.length > 0
        ? currentUser.skills
        : ["React", "TypeScript", "Node.js"];
    const userTrack = currentUser.primaryTrack || "AI & Distributed Systems";

    // 2. Fetch all other squads
    const query: any = {};
    if (currentUser.teamId) {
      query._id = { $ne: currentUser.teamId };
    }

    const allTeams = await Team.find(query)
      .populate("members", "name email skills primaryTrack")
      .sort({ createdAt: -1 })
      .lean();

    if (!allTeams || allTeams.length === 0) {
      return NextResponse.json({ recommendations: [] }, { status: 200 });
    }

    // Filter available slots
    const eligibleTeams = allTeams.filter((t: any) => {
      const isLocked = t.isLocked === true;
      const count = Array.isArray(t.members) ? t.members.length : 0;
      const maxCap = t.maxMembers || 4;
      return !isLocked && count < maxCap;
    });

    if (eligibleTeams.length === 0) {
      return NextResponse.json({ recommendations: [] }, { status: 200 });
    }

    // 3. Extract technical profiles per team
    const teamProfiles = eligibleTeams.map((team: any) => {
      const members = team.members || [];
      const memberSkills = Array.from(
        new Set(members.flatMap((m: any) => m.skills || []))
      ) as string[];

      // Detect unfilled domains
      const missingCapabilities: string[] = [];
      if (!memberSkills.some((s) => /python|pytorch|ai|tensorflow|llm|fastapi/i.test(s))) {
        missingCapabilities.push("AI/ML Pipeline");
      }
      if (!memberSkills.some((s) => /react|next|vue|tailwind|frontend/i.test(s))) {
        missingCapabilities.push("Frontend Architecture");
      }
      if (!memberSkills.some((s) => /docker|k8s|kubernetes|cloud|aws|distributed/i.test(s))) {
        missingCapabilities.push("Cloud & Distributed Systems");
      }
      if (!memberSkills.some((s) => /solidity|web3|ether|smart contract/i.test(s))) {
        missingCapabilities.push("Web3/Protocol Integration");
      }

      return {
        teamId: team._id.toString(),
        name: team.name,
        track: team.track || "AI & Distributed Systems",
        inviteCode: team.inviteCode,
        membersCount: members.length,
        maxMembers: team.maxMembers || 4,
        existingSkills: memberSkills.length > 0 ? memberSkills : ["Next.js", "Express"],
        vacancies: missingCapabilities.slice(0, 2),
      };
    });

    // 4. Try Gemini AI Match Reason Generator
    let aiReasonMap: Record<string, { score: number; reason: string }> = {};
    try {
      if (process.env.GEMINI_API_KEY) {
        const prompt = `
You are an autonomous hackathon matchmaking engine.
Compare Candidate Hacker against these Hackathon Teams.

Candidate:
- Name: ${currentUser.name}
- Skills: ${JSON.stringify(userSkills)}
- Track: ${userTrack}

Teams:
${teamProfiles
  .map(
    (tp) => `
Team ID: ${tp.teamId}
Team Name: ${tp.name}
Track: ${tp.track}
Existing Skills: ${JSON.stringify(tp.existingSkills)}
Vacancies: ${JSON.stringify(tp.vacancies)}
`
  )
  .join("\n")}

Respond ONLY with valid JSON array of objects:
[
  {
    "teamId": "string",
    "matchScore": number (72 to 98),
    "reason": "1 concise sentence explaining the exact technical gap the candidate solves or why track synergy is strong."
  }
]
`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(response.text || "[]");
        parsed.forEach((item: any) => {
          if (item.teamId) {
            aiReasonMap[item.teamId] = {
              score: item.matchScore || 85,
              reason: item.reason,
            };
          }
        });
      }
    } catch (aiErr) {
      console.warn("AI generation fallback activated:", aiErr);
    }

    // 5. Build Final Recommendations with Diverse Explanations
    const recommendations = teamProfiles.map((tp, idx) => {
      const aiData = aiReasonMap[tp.teamId];

      if (aiData) {
        return {
          ...tp,
          matchScore: aiData.score,
          reason: aiData.reason,
        };
      }

      // Contextual Heuristic Reasoning Engine
      let score = 80;
      let matchedAspects: string[] = [];

      // Check track alignment
      if (tp.track === userTrack) {
        score += 8;
        matchedAspects.push(`shared focus on ${tp.track}`);
      }

      // Check complementary skills
      const complementary = userSkills.filter(
        (sk) => !tp.existingSkills.map((s) => s.toLowerCase()).includes(sk.toLowerCase())
      );

      if (complementary.length > 0) {
        score += 7;
        matchedAspects.push(
          `fills open vacancy with ${complementary.slice(0, 2).join(" & ")}`
        );
      } else {
        matchedAspects.push(`solidifies existing team expertise`);
      }

      const vacanciesCount = tp.maxMembers - tp.membersCount;
      const finalScore = Math.min(98, Math.max(74, score - (idx % 3) * 3));

      const reason = `Matched on ${matchedAspects.join("; ")} with ${vacanciesCount} slot${
        vacanciesCount > 1 ? "s" : ""
      } remaining.`;

      return {
        ...tp,
        matchScore: finalScore,
        reason,
      };
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (err: any) {
    console.error("Match API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate semantic matches" },
      { status: 500 }
    );
  }
}