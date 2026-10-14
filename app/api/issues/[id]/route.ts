import { readIssues, updateIssues } from "@/lib/db";
import { isStatus, type Issue } from "@/lib/types";

export async function GET(_req: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;
  const issue = (await readIssues()).find((i) => i.id === id);
  if (!issue) return Response.json({ error: "Issue not found" }, { status: 404 });
  return Response.json(issue);
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;

  let body: { action?: string; text?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updated = await updateIssues<Issue>((issues) => {
      const issue = issues.find((i) => i.id === id);
      if (!issue) throw new HttpError(404, "Issue not found");

      switch (body.action) {
        case "upvote":
          issue.upvotes += 1;
          break;
        case "unvote":
          issue.upvotes = Math.max(0, issue.upvotes - 1);
          break;
        case "comment": {
          const text = String(body.text ?? "").trim();
          if (!text) throw new HttpError(400, "Comment text is required");
          issue.comments.push({ text: text.slice(0, 500), at: new Date().toISOString() });
          break;
        }
        case "status":
          if (!isStatus(body.status)) throw new HttpError(400, "Invalid status");
          issue.status = body.status;
          break;
        default:
          throw new HttpError(400, "Unknown action");
      }
      return issue;
    });
    return Response.json(updated);
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
    console.error(err);
    return Response.json({ error: "Could not update issue" }, { status: 500 });
  }
}
