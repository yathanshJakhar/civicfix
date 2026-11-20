import { connection } from "next/server";
import { deleteCitizen, findContractorByUser, getAccount, listIssuesByContractor, updateAccount } from "@/lib/db";
import { isActive } from "@/lib/types";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/session";

/** The signed-in person's profile and settings (plus their contractor record, for contractors). */
export async function GET() {
  await connection();
  const s = await getSession();
  if (!s) return Response.json({ error: "Please log in" }, { status: 401 });
  try {
    const account = await getAccount(s.id);
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });
    const c = s.role === "contractor" ? await findContractorByUser(s.id) : null;
    const contractor = c
      ? { ...c, activeCount: (await listIssuesByContractor(c.id)).filter(isActive).length }
      : null;
    return Response.json({ account, contractor });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load your account" }, { status: 500 });
  }
}

/** Updates name, phone and the ticket-update email preference. Body: { name, phone, notifyUpdates } */
export async function PATCH(request: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Please log in" }, { status: 401 });

  let b: { name?: unknown; phone?: unknown; notifyUpdates?: unknown };
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name = String(b.name ?? "").trim().slice(0, 80);
  const phone = String(b.phone ?? "").trim().slice(0, 30) || null;
  if (!name) return Response.json({ error: "Name can't be empty" }, { status: 400 });
  if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) {
    return Response.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  try {
    const account = await updateAccount(s.id, { name, phone, notifyUpdates: b.notifyUpdates !== false });
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });
    // The name is shown from the session, so re-issue it with the new one.
    await setSessionCookie({ ...s, name: account.name });
    return Response.json({ account });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save your changes" }, { status: 500 });
  }
}

/** Citizens can delete their account. Their tickets stay open for the department, without their name. */
export async function DELETE() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Please log in" }, { status: 401 });
  if (s.role !== "citizen") {
    return Response.json({ error: "Staff and contractor accounts are managed by the department" }, { status: 403 });
  }
  try {
    await deleteCitizen(s.id);
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not delete your account" }, { status: 500 });
  }
}
