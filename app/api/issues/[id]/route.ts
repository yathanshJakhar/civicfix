import { addComment, getIssue, setCategory, setStatus, upvote } from "@/lib/db";
import { isCategory, isStatus } from "@/lib/types";

export async function GET(_req: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return Response.json({ error: "Issue not found" }, { status: 404 });
  return Response.json(issue);
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/issues/[id]">) {
  const { id } = await params;

  let body: { action?: string; text?: string; status?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    let updated = null;
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
      case "status":
        if (!isStatus(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
        updated = await setStatus(id, body.status);
        break;
      case "category":
        if (!isCategory(body.category)) return Response.json({ error: "Invalid category" }, { status: 400 });
        updated = await setCategory(id, body.category);
        break;
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