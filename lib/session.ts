import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "citizen" | "authority" | "admin" | "contractor";
export interface Session {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string | null;
}

export const COOKIE = "civicfix_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET is missing or too short");
  return new TextEncoder().encode(s);
}

export async function setSessionCookie(s: Session) {
  const token = await new SignJWT({ name: s.name, email: s.email, role: s.role, department: s.department })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** Returns the logged-in user from the cookie, or null if missing, invalid or expired. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.sub),
      name: String(payload.name),
      email: String(payload.email ?? ""),
      role: payload.role as Role,
      department: (payload.department as string | null) ?? null,
    };
  } catch {
    return null;
  }
}