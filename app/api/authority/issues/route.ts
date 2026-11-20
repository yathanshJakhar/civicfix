import { connection } from "next/server";
import { listIssues, listIssuesByDepartment } from "@/lib/db";
import { getSession } from "@/lib/session";

/** The signed-in officer's department tickets only (every ticket for the admin). */
export async function GET() {
  await connection();
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });
  if (session.role !== "authority" && session.role !== "admin") {
    return Response.json({ error: "Department officers only" }, { status: 403 });
  }
  try {
    if (session.role === "admin") return Response.json(await listIssues());
    if (!session.department) return Response.json([]);
    return Response.json(await listIssuesByDepartment(session.department));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load tickets" }, { status: 500 });
  }
}
