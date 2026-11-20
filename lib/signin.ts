import {
  authorityDepartment,
  findContractorByEmail,
  findUserByEmail,
  linkContractorUser,
  upsertUser,
  type Contractor,
  type UserRow,
} from "./db";
import type { Portal } from "./otp";
import { setSessionCookie } from "./session";

export const HOME: Record<UserRow["role"], string> = {
  citizen: "/tickets",
  authority: "/authority",
  admin: "/admin/contractors",
  contractor: "/contractor",
};

type Result = { user: UserRow } | { error: string; status: number };

/** Why a contractor email can't sign in, or null if it can (registered and approved). */
export function contractorBlocked(c: Contractor | null): string | null {
  if (!c) return "This email isn't registered as a contractor. Ask the department you work with to add you.";
  if (c.status === "pending") return "Your registration is waiting for admin approval. You'll get an email once it's approved.";
  if (c.status === "rejected") return "Your contractor registration wasn't approved. Contact the department that added you.";
  return null;
}

/**
 * Finds or creates the account for an email on a portal. Officers get their department from
 * `authority_emails`, contractors must be in `contractors`, and citizens are created on first use.
 */
export async function resolveUser(email: string, portal: Portal, name?: string): Promise<Result> {
  if (portal === "authority") {
    const dept = await authorityDepartment(email);
    if (dept === undefined) {
      return { error: "This email isn't registered as a department officer. Contact the admin.", status: 403 };
    }
    const existing = await findUserByEmail(email);
    const user = await upsertUser(
      email,
      existing?.name ?? (dept ? `${dept} Officer` : "Admin"),
      dept === null ? "admin" : "authority",
      dept,
    );
    return { user };
  }

  if (portal === "contractor") {
    const c = await findContractorByEmail(email);
    const blocked = contractorBlocked(c);
    if (blocked || !c) return { error: blocked ?? "Not a contractor", status: 403 };
    const user = await upsertUser(email, c.name, "contractor", null);
    await linkContractorUser(c.id, user.id);
    return { user };
  }

  const existing = await findUserByEmail(email);
  if (existing && existing.role !== "citizen") {
    return { error: "This email belongs to staff. Use the matching portal.", status: 403 };
  }
  const displayName = name?.trim().slice(0, 80) || existing?.name || email.split("@")[0];
  return { user: existing ?? (await upsertUser(email, displayName, "citizen", null)) };
}

/** Starts the session and returns the response body the login page expects. */
export async function startSession(user: UserRow) {
  const session = { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department };
  await setSessionCookie(session);
  return { user: session, redirect: HOME[user.role] };
}
