import { connection } from "next/server";
import { findContractorByUser, listIssuesByContractor } from "@/lib/db";
import { getSession } from "@/lib/session";

/** The jobs assigned to the signed-in contractor. */
export async function GET() {
  await connection();
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });
  if (session.role !== "contractor") return Response.json({ error: "Contractors only" }, { status: 403 });

  try {
    const c = await findContractorByUser(session.id);
    if (!c) return Response.json({ error: "No contractor profile for this account" }, { status: 404 });
    return Response.json(await listIssuesByContractor(c.id));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load your jobs" }, { status: 500 });
  }
}
