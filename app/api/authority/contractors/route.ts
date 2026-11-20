import { connection } from "next/server";
import { contractorsFor, getIssue } from "@/lib/db";
import { getSession } from "@/lib/session";
import { runsDepartment } from "@/lib/departments";

/**
 * Contractors a department can hand a ticket to: they work for that department, their service
 * radius covers the ticket, and each comes with how many projects they're working on now.
 * GET /api/authority/contractors?issueId=abc123
 */
export async function GET(request: Request) {
  await connection();
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });

  const issueId = new URL(request.url).searchParams.get("issueId") ?? "";
  const issue = await getIssue(issueId);
  if (!issue) return Response.json({ error: "Issue not found" }, { status: 404 });
  if (!runsDepartment(session, issue.department)) {
    return Response.json({ error: "Only this ticket's department can assign contractors" }, { status: 403 });
  }

  try {
    const list = await contractorsFor(issue.department, issue.lat, issue.lng);
    return Response.json(
      list.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        distanceKm: Math.round(c.distanceKm * 10) / 10,
        radiusKm: c.radiusKm,
        activeCount: c.activeCount,
      })),
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load contractors" }, { status: 500 });
  }
}
