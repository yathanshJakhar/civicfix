import { connection } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();
  return Response.json({ user: await getSession() });
}