import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "eventsprint-super-secret-key-2026";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  teamId?: string | null;
}

export async function createToken(payload: SessionUser) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function setAuthSession(user: SessionUser) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}