import { Pool } from "pg";
import type { Category, Issue, Status } from "./types";

// Reuse one pool across hot reloads in dev so we don't open new connections on every save.
const g = globalThis as unknown as { pgPool?: Pool };
const pool =
  g.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 5,
  });
if (process.env.NODE_ENV !== "production") g.pgPool = pool;

interface Row {
  id: string;
  title: string;
  description: string;
  category: Category;
  category_source: "ai" | "user" | null;
  ai_label: string | null;
  ai_confidence: number | null;
  ai_category: Category | null;
  lat: number;
  lng: number;
  image_url: string | null;
  status: Status;
  upvotes: number;
  created_at: Date;
  comments: { text: string; at: string }[];
}

function toIssue(r: Row): Issue {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    ai: r.ai_label
      ? { label: r.ai_label, confidence: r.ai_confidence ?? 0, category: r.ai_category ?? r.category }
      : null,
    categorySource: r.category_source ?? undefined,
    lat: r.lat,
    lng: r.lng,
    imageUrl: r.image_url,
    status: r.status,
    upvotes: r.upvotes,
    comments: r.comments,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// An issue plus its comments, in the same shape the app already uses.
const SELECT = `
  select i.*,
    coalesce(
      json_agg(json_build_object('text', c.text, 'at', c.created_at) order by c.created_at)
        filter (where c.id is not null),
      '[]'::json
    ) as comments
  from issues i
  left join comments c on c.issue_id = i.id
`;

export async function listIssues(): Promise<Issue[]> {
  const { rows } = await pool.query<Row>(`${SELECT} group by i.id order by i.created_at desc`);
  return rows.map(toIssue);
}

export async function getIssue(id: string): Promise<Issue | null> {
  const { rows } = await pool.query<Row>(`${SELECT} where i.id = $1 group by i.id`, [id]);
  return rows[0] ? toIssue(rows[0]) : null;
}

export async function createIssue(i: Issue): Promise<void> {
  await pool.query(
    `with ins as (
       insert into issues (id, title, description, category, category_source,
                           ai_label, ai_confidence, ai_category, lat, lng,
                           image_url, status, upvotes, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       returning id, status
     )
     insert into status_history (issue_id, status) select id, status from ins`,
    [
      i.id, i.title, i.description, i.category, i.categorySource ?? null,
      i.ai?.label ?? null, i.ai?.confidence ?? null, i.ai?.category ?? null,
      i.lat, i.lng, i.imageUrl, i.status, i.upvotes, i.createdAt,
    ],
  );
}

export async function upvote(id: string, delta: 1 | -1): Promise<Issue | null> {
  const r = await pool.query(
    "update issues set upvotes = greatest(0, upvotes + $2) where id = $1",
    [id, delta],
  );
  return r.rowCount ? getIssue(id) : null;
}

export async function addComment(id: string, text: string): Promise<Issue | null> {
  const r = await pool.query(
    "insert into comments (issue_id, text) select id, $2::text from issues where id = $1",
    [id, text],
  );
  return r.rowCount ? getIssue(id) : null;
}

export async function setStatus(id: string, status: Status): Promise<Issue | null> {
  const r = await pool.query(
    `with u as (update issues set status = $2 where id = $1 returning id, status)
     insert into status_history (issue_id, status) select id, status from u`,
    [id, status],
  );
  return r.rowCount ? getIssue(id) : null;
}

export async function setCategory(id: string, category: Category): Promise<Issue | null> {
  const r = await pool.query(
    "update issues set category = $2, category_source = 'user' where id = $1",
    [id, category],
  );
  return r.rowCount ? getIssue(id) : null;
}