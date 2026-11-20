import { after, connection } from "next/server";
import {
  adminEmails,
  getContractor,
  listContractors,
  proposeContractor,
  updateContractorDetails,
  withdrawContractor,
} from "@/lib/db";
import { parseContractorForm } from "@/lib/contractorInput";
import { mail } from "@/lib/mailer";
import { getSession, type Session } from "@/lib/session";

/** Department officers manage contractors for their own department. The admin only approves. */
async function requireOfficer(): Promise<Session | Response> {
  const s = await getSession();
  if (!s) return Response.json({ error: "Please log in" }, { status: 401 });
  if (s.role !== "authority" || !s.department) {
    return Response.json({ error: "Department officers only" }, { status: 403 });
  }
  return s;
}

/** Contractors that work for (or were proposed by) this department, newest decisions first. */
export async function GET() {
  await connection();
  const s = await requireOfficer();
  if (s instanceof Response) return s;
  try {
    return Response.json(await listContractors(s.department!));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load contractors" }, { status: 500 });
  }
}

/** Proposes a new contractor for this department. It waits for the admin's approval. */
export async function POST(request: Request) {
  const s = await requireOfficer();
  if (s instanceof Response) return s;

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseContractorForm(b, { requireEmail: true });
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const c = await proposeContractor(parsed.email, parsed.details, s.department!, s.id);
    if (!c) {
      return Response.json(
        { error: "A contractor with this email is already registered with CivicFix." },
        { status: 409 },
      );
    }
    after(async () => {
      await mail.contractorProposed(await adminEmails(), { name: c.name, email: c.email, department: s.department! });
    });
    return Response.json(c, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save contractor" }, { status: 500 });
  }
}

/** Edits a contractor this department proposed (the email can't change). */
export async function PATCH(request: Request) {
  const s = await requireOfficer();
  if (s instanceof Response) return s;

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const id = Number(b.id);
  const existing = Number.isInteger(id) ? await getContractor(id) : null;
  if (!existing) return Response.json({ error: "Contractor not found" }, { status: 404 });
  if (existing.requestedDepartment !== s.department) {
    return Response.json({ error: "Only the department that added this contractor can edit them" }, { status: 403 });
  }
  const parsed = parseContractorForm(b, { requireEmail: false });
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  const updated = await updateContractorDetails(id, parsed.details);
  // An edited rejection goes back to the admin for another look.
  if (updated && existing.status === "rejected") {
    after(async () => {
      await mail.contractorProposed(await adminEmails(), { name: updated.name, email: updated.email, department: s.department! });
    });
  }
  return Response.json(updated);
}

/** Withdraws a proposal that hasn't been approved. */
export async function DELETE(request: Request) {
  const s = await requireOfficer();
  if (s instanceof Response) return s;
  const id = Number(new URL(request.url).searchParams.get("id"));
  const existing = Number.isInteger(id) ? await getContractor(id) : null;
  if (!existing) return Response.json({ error: "Contractor not found" }, { status: 404 });
  if (existing.requestedDepartment !== s.department) {
    return Response.json({ error: "Only the department that added this contractor can withdraw them" }, { status: 403 });
  }
  if (!(await withdrawContractor(id))) {
    return Response.json({ error: "Approved contractors can't be withdrawn. Ask the admin to revoke them." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
