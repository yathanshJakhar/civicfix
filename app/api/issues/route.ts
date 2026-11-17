import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { connection } from "next/server";
import { listIssues, createIssue } from "@/lib/db";
import { MODEL_TO_CATEGORY } from "@/lib/aiMap";
import { isCategory, type AiClassification, type Issue } from "@/lib/types";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET() {
  await connection(); // always read the file at request time, never prerender
  try {
        return Response.json(await listIssues());
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not read issues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
  };

  try {
     await createIssue(issue);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save issue" }, { status: 500 });
  }

  return Response.json(issue, { status: 201 });
}
