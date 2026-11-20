import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { after, connection } from "next/server";
import { authorityEmailsFor, createIssue, listIssues } from "@/lib/db";
import { getSession } from "@/lib/session";
import { MODEL_TO_CATEGORY } from "@/lib/aiMap";
import { departmentFor } from "@/lib/departments";
import { mail } from "@/lib/mailer";
import { isActive, isCategory, type AiClassification, type Issue } from "@/lib/types";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Open tickets near a spot, for the report form's duplicate check. There is no public board any
 * more, so this returns only the fields that check needs: no names, notes or contractors.
 */
export async function GET() {
  await connection();
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in" }, { status: 401 });
  try {
    const issues = (await listIssues()).filter(isActive).map((i) => ({
      id: i.id, title: i.title, category: i.category, lat: i.lat, lng: i.lng,
      status: i.status, upvotes: i.upvotes, createdAt: i.createdAt, imageUrl: i.imageUrl,
      department: i.department, description: "", comments: [],
    }));
    return Response.json(issues);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not read issues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Please log in to report an issue" }, { status: 401 });
  if (session.role !== "citizen") {
    return Response.json({ error: "Only citizens can file complaints" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = form.get("category");
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const photo = form.get("photo");

  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
  if (!isCategory(category)) return Response.json({ error: "Invalid category" }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: "A valid location is required" }, { status: 400 });
  }

  // Optional AI result from /api/classify, sent along by the report form.
  const aiLabel = String(form.get("aiLabel") ?? "");
  const aiConfidence = Number(form.get("aiConfidence"));
  const aiCategory = Object.hasOwn(MODEL_TO_CATEGORY, aiLabel) ? MODEL_TO_CATEGORY[aiLabel] : undefined;
  const ai: AiClassification | null =
    aiCategory && Number.isFinite(aiConfidence) && aiConfidence >= 0 && aiConfidence <= 1
      ? { label: aiLabel, confidence: aiConfidence, category: aiCategory }
      : null;

  let imageUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      return Response.json({ error: "Photo must be an image" }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return Response.json({ error: "Photo must be under 10 MB" }, { status: 400 });
    }
    const safeName = (photo.name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const fileName = `${Date.now()}-${safeName}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await photo.arrayBuffer()));
    imageUrl = `/uploads/${fileName}`;
  }

  const issue: Issue = {
    id: randomUUID().slice(0, 8),
    title: title.slice(0, 120),
    description: description.slice(0, 2000),
    category,
    ai,
    categorySource: ai && ai.category === category ? "ai" : "user",
    lat,
    lng,
    imageUrl,
    status: "Open",
    upvotes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    // Routed automatically: nobody picks the department.
    department: departmentFor(category),
    contractor: null,
  };

  try {
    await createIssue(issue, session.id);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save issue" }, { status: 500 });
  }

  // Confirmation to the reporter and a heads-up to the department, after the response is sent.
  after(async () => {
    await mail.ticketCreatedUser(session.email, session.name, issue);
    await mail.ticketCreatedDepartment(await authorityEmailsFor(issue.department), issue);
  });

  return Response.json(issue, { status: 201 });
}
