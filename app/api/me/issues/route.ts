import { connection } from "next/server";
import { listIssuesByReporter } from "@/lib/db";
import { getSession } from "@/lib/session";

/** The signed-in user's own reports, for the "My tickets" history. */
export async function GET() {
  await connection();
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });
  try {
    return Response.json(await listIssuesByReporter(session.id));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load your tickets" }, { status: 500 });
  }
}
