import type { ContractorDetails } from "./db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the contractor form sent by a department. Returns the clean values or an error message. */
export function parseContractorForm(
  b: Record<string, unknown>,
  { requireEmail }: { requireEmail: boolean },
): { email: string; details: ContractorDetails } | { error: string } {
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim().slice(0, 120);
  const phone = String(b.phone ?? "").trim().slice(0, 30) || null;
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const radiusKm = Number(b.radiusKm);

  if (requireEmail && !EMAIL_RE.test(email)) return { error: "Valid email required" };
  if (!name) return { error: "Name required" };
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "Valid base location required" };
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 200) {
    return { error: "Radius must be between 0 and 200 km" };
  }
  return { email, details: { name, phone, lat, lng, radiusKm } };
}
