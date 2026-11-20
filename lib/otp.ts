import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { bumpOtpAttempts, consumeOtp, latestOtp, saveOtp } from "./db";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
/** Minimum gap between two codes for the same email, so the inbox can't be flooded. */
export const OTP_RESEND_SECONDS = 30;

export type Portal = "citizen" | "authority" | "contractor";
export const isPortal = (v: unknown): v is Portal =>
  v === "citizen" || v === "authority" || v === "contractor";

// Codes are stored as an HMAC keyed with AUTH_SECRET, never in plain text.
function hash(email: string, code: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

/** Seconds the caller must still wait before another code can be sent (0 = send now). */
export async function cooldownLeft(email: string, portal: Portal): Promise<number> {
  const last = await latestOtp(email, portal);
  if (!last) return 0;
  const elapsed = (Date.now() - new Date(last.created_at).getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_SECONDS - elapsed));
}

/** Creates and stores a new 6-digit code and returns it so the caller can email it. */
export async function issueOtp(email: string, portal: Portal): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await saveOtp(email, portal, hash(email, code), OTP_TTL_MINUTES);
  return code;
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many";

/** Checks a code against the newest unused one. A correct code can only be used once. */
export async function verifyOtp(email: string, portal: Portal, code: string): Promise<VerifyResult> {
  const row = await latestOtp(email, portal);
  if (!row) return "invalid";
  if (new Date(row.expires_at).getTime() < Date.now()) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "too_many";

  const a = Buffer.from(hash(email, code));
  const b = Buffer.from(row.code_hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await bumpOtpAttempts(row.id);
    return row.attempts + 1 >= OTP_MAX_ATTEMPTS ? "too_many" : "invalid";
  }
  await consumeOtp(row.id);
  return "ok";
}
