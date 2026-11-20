import { after } from "next/server";
import {
  addComment,
  assignContractor,
  authorityEmailsFor,
  contractorsFor,
  findContractorByUser,
  getContractor,
  getIssue,
  getReporter,
  setCategory,
  setProgress,
  upvote,
} from "@/lib/db";
import { getSession, type Session } from "@/lib/session";
import { ownsDepartment, runsDepartment } from "@/lib/departments";
import { mail } from "@/lib/mailer";
import { isCategory, isStatus, type Issue } from "@/lib/types";

/**
 * Who may see a ticket: the citizen who filed it, officers of its department, the contractor
 * it's assigned to, and the admin.
 */
async function canView(s: Session, issue: Issue, reporterId: number | null): Promise<boolean> {
  if (ownsDepartment(s, issue.department)) return true;
  if (s.role === "citizen") return reporterId === s.id;
  if (s.role === "contractor") {
    const c = await findContractorByUser(s.id);
    return !!c && issue.contractor?.id === c.id;
  }
  return false;
}

export async function GET(_req: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });

  try {
    const issue = await getIssue(id);
    if (!issue) return Response.json({ error: "Issue not found" }, { status: 404 });
    const reporter = await getReporter(id);
    if (!(await canView(session, issue, reporter?.id ?? null))) {
      return Response.json({ error: "You don't have access to this ticket" }, { status: 403 });
    }
    return Response.json(issue);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load this ticket" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;

  let body: {
    action?: string;
    text?: string;
    status?: string;
    category?: string;
    note?: string;
    contractorId?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });

  let current: Issue | null;
  let reporter: Awaited<ReturnType<typeof getReporter>>;
  try {
    current = await getIssue(id);
    reporter = current ? await getReporter(id) : null;
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load this ticket" }, { status: 500 });
  }
  if (!current) return Response.json({ error: "Issue not found" }, { status: 404 });
  // A citizen may add a "me too" upvote to a nearby ticket (from the report form's duplicate
  // check) without being able to read it. Everything else needs access to the ticket.
  const meToo = session.role === "citizen" && (body.action === "upvote" || body.action === "unvote");
  if (!meToo && !(await canView(session, current, reporter?.id ?? null))) {
    return Response.json({ error: "You don't have access to this ticket" }, { status: 403 });
  }
  // Only the department's own officers act on its tickets. The admin can view but not assign.
  const isDept = runsDepartment(session, current.department);

  try {
    let updated: Issue | null = null;
    switch (body.action) {
      case "upvote":
        updated = await upvote(id, 1);
        break;
      case "unvote":
        updated = await upvote(id, -1);
        break;
      case "comment": {
        const text = String(body.text ?? "").trim();
        if (!text) return Response.json({ error: "Comment text is required" }, { status: 400 });
        updated = await addComment(id, text.slice(0, 500));
        break;
      }

      // Re-routing: only the owning department, and it moves the ticket to the new category's department.
      case "category":
        if (!isDept) return Response.json({ error: "Only the department can recategorise" }, { status: 403 });
        if (!isCategory(body.category)) return Response.json({ error: "Invalid category" }, { status: 400 });
        updated = await setCategory(id, body.category);
        break;

      // The department passes the work to a contractor covering that area.
      case "assign": {
        if (!isDept) return Response.json({ error: "Only the department can assign work" }, { status: 403 });
        if (current.status === "Resolved") {
          return Response.json({ error: "This ticket is already resolved" }, { status: 400 });
        }
        const contractorId = Number(body.contractorId);
        const eligible = await contractorsFor(current.department, current.lat, current.lng);
        if (!eligible.some((c) => c.id === contractorId)) {
          return Response.json({ error: "That contractor doesn't cover this department or area" }, { status: 400 });
        }
        updated = await assignContractor(id, contractorId, session.id);
        if (updated) {
          const issue = updated;
          after(async () => {
            const c = await getContractor(contractorId);
            if (c) await mail.assignedContractor(c.email, c.name, issue);
            if (reporter?.notify_updates) await mail.assignedUser(reporter.email, reporter.name, issue);
            await mail.assignedDepartment(await authorityEmailsFor(issue.department), issue);
          });
        }
        break;
      }

      // Progress belongs to the assigned contractor alone, not the department.
      case "progress": {
        if (session.role !== "contractor") {
          return Response.json({ error: "Only the assigned contractor can update progress" }, { status: 403 });
        }
        if (!isStatus(body.status) || body.status === "Open") {
          return Response.json({ error: "Status must be In Progress or Resolved" }, { status: 400 });
        }
        const note = String(body.note ?? "").trim().slice(0, 1000) || null;
        const prevStatus = current.status;
        updated = await setProgress(id, body.status, note, session.id);
        if (updated && (note || updated.status !== prevStatus)) {
          const issue = updated;
          after(async () => {
            if (reporter?.notify_updates) await mail.progressUser(reporter.email, reporter.name, issue);
            await mail.progressDepartment(await authorityEmailsFor(issue.department), issue);
          });
        }
        break;
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!updated) return Response.json({ error: "Issue not found" }, { status: 404 });
    return Response.json(updated);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not update issue" }, { status: 500 });
  }
}
