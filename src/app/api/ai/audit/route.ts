import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { auditPitch } from "@/lib/gemini";

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
      return NextResponse.json({ error: "Pitch text cannot be blank" }, { status: 422 });
    }

    const pitchText = body?.pitchText ?? body?.pitch ?? body?.text;
    const track = body?.track || "General";

    // AI-01: Reject blank/whitespace strings with 422
    if (!pitchText || typeof pitchText !== "string" || pitchText.trim().length === 0) {
      return NextResponse.json(
        { error: "Pitch text cannot be blank or whitespace" },
        { status: 422 }
      );
    }

    // AI-02: Produce structured rubric contract
    const result = await auditPitch(pitchText.trim(), track);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}