import { after, connection } from "next/server";
import { authorityEmailsFor, getContractor, listContractors, reviewContractor } from "@/lib/db";
import { mail } from "@/lib/mailer";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Please log in" }, { status: 401 });
  if (s.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  return null;
}

/** Every contractor, pending first, for the approvals page. */
export async function GET() {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await listContractors());
}

/**
 * The admin's only action: approve or reject a contractor a department proposed.
 * Rejecting an approved contractor revokes them, and their unfinished tickets return to the department.
 * Body: { id, decision: "approved" | "rejected", note? }
 */
export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let b: { id?: unknown; decision?: unknown; note?: unknown };
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const id = Number(b.id);
  const decision = b.decision;
  if (!Number.isInteger(id)) return Response.json({ error: "id required" }, { status: 400 });
  if (decision !== "approved" && decision !== "rejected") {
    return Response.json({ error: "decision must be approved or rejected" }, { status: 400 });
  }
  const note = String(b.note ?? "").trim().slice(0, 500) || null;

  const before = await getContractor(id);
  if (!before) return Response.json({ error: "Contractor not found" }, { status: 404 });

  try {
    const c = await reviewContractor(id, decision, note);
    if (!c) return Response.json({ error: "Contractor not found" }, { status: 404 });

    after(async () => {
      const dept = c.requestedDepartment ?? c.departments[0];
      if (dept) {
        await mail.contractorReviewed(await authorityEmailsFor(dept), { name: c.name, status: decision, note });
      }
      // Tell the contractor once, when they first become able to sign in.
      if (decision === "approved" && before.status !== "approved") {
        await mail.contractorWelcome(c.email, c.name, dept ?? "A department");
      }
    });
    return Response.json(c);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save the decision" }, { status: 500 });
  }
}
