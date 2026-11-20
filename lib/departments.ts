import type { Category } from "./types";
import type { Session } from "./session";

export const DEPT_CATEGORIES: Record<string, Category[]> = {
  "Roads (MCD/PWD)": ["Pothole"],
  "Sanitation (MCD)": ["Garbage"],
  "Delhi Jal Board": ["Water Leakage", "Sewage"],
  "Street Lighting": ["Streetlight"],
  "Traffic Police": ["Traffic"],
  // Catch-all so every ticket has an owner.
  "General Services": ["Other"],
};

export const DEPARTMENTS = Object.keys(DEPT_CATEGORIES);

/** The department that owns a category. Never chosen by the reporter. */
export function departmentFor(category: Category): string {
  return DEPARTMENTS.find((d) => DEPT_CATEGORIES[d].includes(category)) ?? "General Services";
}

/** null means "all categories" (admin). */
export function categoriesFor(s: Session): Category[] | null {
  if (s.role === "admin") return null;
  return DEPT_CATEGORIES[s.department ?? ""] ?? [];
}

/** Who can *see* a department's tickets: its officers, and the admin (oversight, read-only). */
export function ownsDepartment(s: Pick<Session, "role" | "department">, department: string): boolean {
  if (s.role === "admin") return true;
  return s.role === "authority" && s.department === department;
}

/**
 * Who can *act* on a department's tickets (assign contractors, recategorise) and manage its
 * contractors: that department's own officers only. The admin approves contractors but doesn't
 * run tickets.
 */
export function runsDepartment(s: Pick<Session, "role" | "department">, department: string): boolean {
  return s.role === "authority" && s.department === department;
}
