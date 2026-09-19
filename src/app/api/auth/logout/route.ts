import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Invalidate and purge the JWT session cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Logout API failure:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log out" },
      { status: 500 }
    );
  }
}