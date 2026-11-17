export async function POST(request: Request) {
  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return Response.json({ error: "Photo required" }, { status: 400 });
  }
  const out = new FormData();
  out.append("file", photo);
  try {
    const res = await fetch(process.env.AI_URL ?? "http://localhost:8000/classify", {
      method: "POST",
      body: out,
    });
    if (!res.ok) throw new Error();
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: "AI service unavailable" }, { status: 502 });
  }
}