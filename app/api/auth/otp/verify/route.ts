import { isPortal, verifyOtp } from "@/lib/otp";
import { resolveUser, startSession } from "@/lib/signin";

const ERRORS = {
  invalid: "That code is wrong. Check the email and try again.",
  expired: "That code has expired. Ask for a new one.",
  too_many: "Too many wrong attempts. Ask for a new code.",
} as const;

/** Step 2 of sign-in: checks the code, creates the account if needed, and starts the session. */
export async function POST(request: Request) {
  let body: { email?: string; portal?: string; code?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").replace(/\D/g, "");
  const portal = body.portal;
  if (!email || code.length !== 6) return Response.json({ error: "Enter the 6-digit code" }, { status: 400 });
  if (!isPortal(portal)) return Response.json({ error: "Unknown portal" }, { status: 400 });

  const result = await verifyOtp(email, portal, code);
  if (result !== "ok") return Response.json({ error: ERRORS[result] }, { status: 401 });

  try {
    const r = await resolveUser(email, portal, body.name);
    if ("error" in r) return Response.json({ error: r.error }, { status: r.status });
    return Response.json(await startSession(r.user));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not sign you in" }, { status: 500 });
  }
}
