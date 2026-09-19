import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default_fallback_secret_key";

export interface AuthPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Creates and signs a JSON Web Token for the user payload.
 */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Alias export to guarantee compatibility with any routes importing createToken
export const createToken = signToken;

/**
 * Verifies the JWT and returns the decoded AuthPayload, or null if invalid.
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Reads the token cookie directly from the Next.js request context and verifies it.
 */
export async function getCurrentUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}