import { authorityDepartment, findContractorByEmail } from "@/lib/db";
import { STAFF_SIGN_IN_WITHOUT_CODE } from "@/lib/flags";
import { mail } from "@/lib/mailer";
import { cooldownLeft, isPortal, issueOtp } from "@/lib/otp";
import { isBlocked, recordFailure } from "@/lib/rateLimit";
import { contractorBlocked, resolveUser, startSession } from "@/lib/signin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of sign-in: emails a 6-digit code to the address, if it's allowed on that portal.
 * With STAFF_SIGN_IN_WITHOUT_CODE on (lib/flags.ts), officers and contractors are signed in right away
 * instead, and the response carries `redirect` rather than asking for a code.
 */
export async function POST(request: Request) {
  let body: { email?: string; portal?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const portal = body.portal;
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!isPortal(portal)) return Response.json({ error: "Unknown portal" }, { status: 400 });

  // Staff sign in with just their (listed) email while codes are switched off for them.
  if (portal !== "citizen" && STAFF_SIGN_IN_WITHOUT_CODE) {
    try {
      const r = await resolveUser(email, portal);
      if ("error" in r) return Response.json({ error: r.error }, { status: r.status });
      return Response.json(await startSession(r.user));
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Could not sign you in" }, { status: 500 });
    }
  }

  // Caps code emails per IP so the endpoint can't be used to spam inboxes.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const ipKey = `otp-req|${ip}`;
  if (isBlocked(ipKey)) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  recordFailure(ipKey);

  // Only listed officers and registered contractors can use those portals.
  if (portal === "authority" && (await authorityDepartment(email)) === undefined) {
    return Response.json(
      { error: "This email isn't registered as a department officer. Contact the admin." },
      { status: 403 },
    );
  }
  if (portal === "contractor") {
    const blocked = contractorBlocked(await findContractorByEmail(email));
    if (blocked) return Response.json({ error: blocked }, { status: 403 });
  }

  const wait = await cooldownLeft(email, portal);
  if (wait > 0) {
    return Response.json({ error: `Please wait ${wait}s before asking for a new code.` }, { status: 429 });
  }

  try {
    const code = await issueOtp(email, portal);
    await mail.otp(email, code);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not send the code. Try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
