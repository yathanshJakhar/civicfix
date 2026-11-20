import { Pool } from "pg";
import type { Category, ContractorRef, Issue, Status } from "./types";
import { departmentFor } from "./departments";
import { CONTRACTORS_COVER_ALL_NCR } from "./flags";
import { haversine } from "./utils";

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
  department: string | null;
  assigned_contractor_id: number | null;
  assigned_at: Date | null;
  progress_note: string | null;
  reported_by: number | null;
  contractor_name: string | null;
  contractor_phone: string | null;
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
    department: r.department ?? departmentFor(r.category),
    contractor:
      r.assigned_contractor_id != null
        ? { id: r.assigned_contractor_id, name: r.contractor_name ?? "", phone: r.contractor_phone }
        : null,
    assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : null,
    progressNote: r.progress_note,
  };
}

// An issue plus its comments and assigned contractor, in the shape the app uses.
const SELECT = `
  select i.*, ct.name as contractor_name, ct.phone as contractor_phone,
    coalesce(
      json_agg(json_build_object('text', c.text, 'at', c.created_at) order by c.created_at)
        filter (where c.id is not null),
      '[]'::json
    ) as comments
  from issues i
  left join comments c on c.issue_id = i.id
  left join contractors ct on ct.id = i.assigned_contractor_id
`;
const GROUP = "group by i.id, ct.name, ct.phone";

export async function listIssues(): Promise<Issue[]> {
  const { rows } = await pool.query<Row>(`${SELECT} ${GROUP} order by i.created_at desc`);
  return rows.map(toIssue);
}

/** Every ticket of one department, newest first. */
export async function listIssuesByDepartment(department: string): Promise<Issue[]> {
  const { rows } = await pool.query<Row>(
    `${SELECT} where i.department = $1 ${GROUP} order by i.created_at desc`,
    [department],
  );
  return rows.map(toIssue);
}

/** Every issue one account reported, newest first, resolved ones included. */
export async function listIssuesByReporter(userId: number): Promise<Issue[]> {
  const { rows } = await pool.query<Row>(
    `${SELECT} where i.reported_by = $1 ${GROUP} order by i.created_at desc`,
    [userId],
  );
  return rows.map(toIssue);
}

/** Every ticket assigned to one contractor, newest assignment first. */
export async function listIssuesByContractor(contractorId: number): Promise<Issue[]> {
  const { rows } = await pool.query<Row>(
    `${SELECT} where i.assigned_contractor_id = $1 ${GROUP} order by i.assigned_at desc nulls last`,
    [contractorId],
  );
  return rows.map(toIssue);
}

export async function getIssue(id: string): Promise<Issue | null> {
  const { rows } = await pool.query<Row>(`${SELECT} where i.id = $1 ${GROUP}`, [id]);
  return rows[0] ? toIssue(rows[0]) : null;
}

/** Who reported an issue (for notification emails), with their email preference. */
export async function getReporter(issueId: string): Promise<(UserRow & { notify_updates: boolean }) | null> {
  const { rows } = await pool.query<UserRow & { notify_updates: boolean }>(
    `select u.id, u.email, u.name, u.role, u.department, u.notify_updates
       from issues i join users u on u.id = i.reported_by where i.id = $1`,
    [issueId],
  );
  return rows[0] ?? null;
}

/** `reportedBy` is the logged-in user's id. The department comes from the category. */
export async function createIssue(i: Issue, reportedBy: number | null = null): Promise<void> {
  await pool.query(
    `with ins as (
       insert into issues (id, title, description, category, category_source,
                           ai_label, ai_confidence, ai_category, lat, lng,
                           image_url, status, upvotes, created_at, reported_by, department)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       returning id, status
     )
     insert into status_history (issue_id, status, changed_by) select id, status, $15 from ins`,
    [
      i.id, i.title, i.description, i.category, i.categorySource ?? null,
      i.ai?.label ?? null, i.ai?.confidence ?? null, i.ai?.category ?? null,
      i.lat, i.lng, i.imageUrl, i.status, i.upvotes, i.createdAt, reportedBy,
      i.department,
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

/** Contractor progress update: new status plus an optional note, recorded in the history. */
export async function setProgress(
  id: string,
  status: Status,
  note: string | null,
  changedBy: number,
): Promise<Issue | null> {
  const r = await pool.query(
    `with u as (
       update issues set status = $2, progress_note = coalesce($3, progress_note)
       where id = $1 returning id, status
     )
     insert into status_history (issue_id, status, changed_by, note)
     select id, status, $4, $3 from u`,
    [id, status, note, changedBy],
  );
  return r.rowCount ? getIssue(id) : null;
}

/** Changing the category moves the ticket to the matching department and drops any contractor. */
export async function setCategory(id: string, category: Category): Promise<Issue | null> {
  const r = await pool.query(
    `update issues
        set category = $2, category_source = 'user', department = $3,
            assigned_contractor_id = null, assigned_at = null
      where id = $1`,
    [id, category, departmentFor(category)],
  );
  return r.rowCount ? getIssue(id) : null;
}

/** Hands a ticket to a contractor and marks it In Progress. */
export async function assignContractor(
  id: string,
  contractorId: number,
  changedBy: number,
): Promise<Issue | null> {
  const r = await pool.query(
    `with u as (
       update issues
          set assigned_contractor_id = $2, assigned_at = now(),
              status = case when status = 'Resolved' then status else 'In Progress' end
        where id = $1 returning id, status
     )
     insert into status_history (issue_id, status, changed_by, note)
     select id, status, $3, 'Assigned to contractor' from u`,
    [id, contractorId, changedBy],
  );
  return r.rowCount ? getIssue(id) : null;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: "citizen" | "authority" | "admin" | "contractor";
  department: string | null;
}

const USER_COLS = "id, email, name, role, department";

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `select ${USER_COLS} from users where email = $1`,
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

/** Creates the account on first sign-in, or refreshes role/department on later ones. */
export async function upsertUser(
  email: string,
  name: string,
  role: UserRow["role"],
  department: string | null,
): Promise<UserRow> {
  const { rows } = await pool.query<UserRow>(
    `insert into users (email, name, role, department)
     values ($1, $2, $3, $4)
     on conflict (email) do update set role = excluded.role, department = excluded.department
     returning ${USER_COLS}`,
    [email.toLowerCase(), name, role, department],
  );
  return rows[0];
}

/** Department of an authority email, or undefined if the email isn't on the list. null = admin. */
export async function authorityDepartment(email: string): Promise<string | null | undefined> {
  const { rows } = await pool.query<{ department: string | null }>(
    "select department from authority_emails where email = $1",
    [email.toLowerCase()],
  );
  return rows[0] ? rows[0].department : undefined;
}

/** Every authority email of one department, for notifications. */
export async function authorityEmailsFor(department: string): Promise<string[]> {
  const { rows } = await pool.query<{ email: string }>(
    "select email from authority_emails where department = $1",
    [department],
  );
  return rows.map((r) => r.email);
}

/** The admin email(s): officer-list rows with no department. */
export async function adminEmails(): Promise<string[]> {
  const { rows } = await pool.query<{ email: string }>(
    "select email from authority_emails where department is null",
  );
  return rows.map((r) => r.email);
}

// ---- Account ---------------------------------------------------------------------------------

export interface Account extends UserRow {
  phone: string | null;
  notifyUpdates: boolean;
}

export async function getAccount(userId: number): Promise<Account | null> {
  const { rows } = await pool.query<UserRow & { phone: string | null; notify_updates: boolean }>(
    `select ${USER_COLS}, phone, notify_updates from users where id = $1`,
    [userId],
  );
  const r = rows[0];
  return r ? { id: r.id, email: r.email, name: r.name, role: r.role, department: r.department, phone: r.phone, notifyUpdates: r.notify_updates } : null;
}

export async function updateAccount(
  userId: number,
  fields: { name: string; phone: string | null; notifyUpdates: boolean },
): Promise<Account | null> {
  await pool.query("update users set name = $2, phone = $3, notify_updates = $4 where id = $1", [
    userId, fields.name, fields.phone, fields.notifyUpdates,
  ]);
  return getAccount(userId);
}

/** Deletes a citizen account. Their tickets stay on file without a reporter (reported_by -> null). */
export async function deleteCitizen(userId: number): Promise<void> {
  await pool.query("delete from users where id = $1 and role = 'citizen'", [userId]);
}

// ---- Contractors ----------------------------------------------------------------------------

export type ContractorStatus = "pending" | "approved" | "rejected";

export interface Contractor extends ContractorRef {
  email: string;
  departments: string[];
  lat: number;
  lng: number;
  radiusKm: number;
  /** Departments propose contractors; only approved ones can sign in or be assigned work. */
  status: ContractorStatus;
  /** The department that proposed this contractor (null for seeded ones). */
  requestedDepartment: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
}

interface ContractorRow {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  departments: string[];
  lat: number;
  lng: number;
  radius_km: number;
  status: ContractorStatus;
  requested_department: string | null;
  review_note: string | null;
  reviewed_at: Date | null;
}

const toContractor = (r: ContractorRow): Contractor => ({
  id: r.id,
  email: r.email,
  name: r.name,
  phone: r.phone,
  departments: r.departments,
  lat: r.lat,
  lng: r.lng,
  radiusKm: r.radius_km,
  status: r.status,
  requestedDepartment: r.requested_department,
  reviewNote: r.review_note,
  reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
});

export async function findContractorByEmail(email: string): Promise<Contractor | null> {
  const { rows } = await pool.query<ContractorRow>(
    "select * from contractors where email = $1",
    [email.toLowerCase()],
  );
  return rows[0] ? toContractor(rows[0]) : null;
}

export async function findContractorByUser(userId: number): Promise<Contractor | null> {
  const { rows } = await pool.query<ContractorRow>(
    "select * from contractors where user_id = $1",
    [userId],
  );
  return rows[0] ? toContractor(rows[0]) : null;
}

export async function getContractor(id: number): Promise<Contractor | null> {
  const { rows } = await pool.query<ContractorRow>("select * from contractors where id = $1", [id]);
  return rows[0] ? toContractor(rows[0]) : null;
}

export type ContractorWithLoad = Contractor & { activeCount: number };

/**
 * Contractors with their current workload. Pass a department to get only the ones that work for
 * it (the department's own page); leave it out for every contractor (the admin's approvals page).
 */
export async function listContractors(department?: string): Promise<ContractorWithLoad[]> {
  const { rows } = await pool.query<ContractorRow & { active_count: string }>(
    `select c.*, (
        select count(*) from issues i
         where i.assigned_contractor_id = c.id and i.status <> 'Resolved'
      ) as active_count
       from contractors c
      where $1::text is null or $1 = any(c.departments) or c.requested_department = $1
      order by case c.status when 'pending' then 0 when 'approved' then 1 else 2 end, c.name`,
    [department ?? null],
  );
  return rows.map((r) => ({ ...toContractor(r), activeCount: Number(r.active_count) }));
}

export interface ContractorDetails {
  name: string;
  phone: string | null;
  lat: number;
  lng: number;
  radiusKm: number;
}

/**
 * A department proposes a new contractor for its own department. It starts as pending and can't
 * sign in or take work until the admin approves it. Returns null if the email is already registered.
 */
export async function proposeContractor(
  email: string,
  details: ContractorDetails,
  department: string,
  requestedBy: number,
): Promise<Contractor | null> {
  const { rows } = await pool.query<ContractorRow>(
    `insert into contractors (email, name, phone, departments, lat, lng, radius_km,
                              status, requested_by, requested_department)
     values ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
     on conflict (email) do nothing
     returning *`,
    [email.toLowerCase(), details.name, details.phone, [department], details.lat, details.lng,
     details.radiusKm, requestedBy, department],
  );
  return rows[0] ? toContractor(rows[0]) : null;
}

/**
 * A department edits a contractor it proposed. Editing one that was rejected sends it back to the
 * admin as pending; approved ones stay approved (the email, which they sign in with, can't change).
 */
export async function updateContractorDetails(id: number, d: ContractorDetails): Promise<Contractor | null> {
  const { rows } = await pool.query<ContractorRow>(
    `update contractors
        set name = $2, phone = $3, lat = $4, lng = $5, radius_km = $6,
            status = case when status = 'rejected' then 'pending' else status end,
            review_note = case when status = 'rejected' then null else review_note end
      where id = $1
      returning *`,
    [id, d.name, d.phone, d.lat, d.lng, d.radiusKm],
  );
  return rows[0] ? toContractor(rows[0]) : null;
}

/**
 * The admin's decision. Rejecting (or later revoking) a contractor also hands their unfinished
 * tickets back to the department, unassigned, since they can no longer sign in to work on them.
 */
export async function reviewContractor(
  id: number,
  status: "approved" | "rejected",
  note: string | null,
): Promise<Contractor | null> {
  if (status === "rejected") {
    await pool.query(
      `update issues set assigned_contractor_id = null, assigned_at = null,
              status = case when status = 'In Progress' then 'Open' else status end
        where assigned_contractor_id = $1 and status <> 'Resolved'`,
      [id],
    );
  }
  const { rows } = await pool.query<ContractorRow>(
    `update contractors set status = $2, review_note = $3, reviewed_at = now()
      where id = $1 returning *`,
    [id, status, note],
  );
  return rows[0] ? toContractor(rows[0]) : null;
}

/** A department withdraws a proposal the admin hasn't approved. */
export async function withdrawContractor(id: number): Promise<boolean> {
  const r = await pool.query("delete from contractors where id = $1 and status <> 'approved'", [id]);
  return (r.rowCount ?? 0) > 0;
}

/** Links the contractor row to its user account after their first sign-in. */
export async function linkContractorUser(contractorId: number, userId: number): Promise<void> {
  await pool.query("update contractors set user_id = $2 where id = $1", [contractorId, userId]);
}

export interface ContractorOption extends Contractor {
  distanceKm: number;
  activeCount: number;
}

/**
 * Contractors who take this department's work and whose service radius covers the location
 * (or all of them while CONTRACTORS_COVER_ALL_NCR is on),
 * each with how many unresolved projects they hold now. Nearest first, then least busy.
 */
export async function contractorsFor(
  department: string,
  lat: number,
  lng: number,
): Promise<ContractorOption[]> {
  const { rows } = await pool.query<ContractorRow & { active_count: string }>(
    `select c.*, (
        select count(*) from issues i
         where i.assigned_contractor_id = c.id and i.status <> 'Resolved'
      ) as active_count
       from contractors c
      where $1 = any(c.departments) and c.status = 'approved'`,
    [department],
  );
  return rows
    .map((r) => ({
      ...toContractor(r),
      distanceKm: haversine(lat, lng, r.lat, r.lng) / 1000, // haversine() returns metres
      activeCount: Number(r.active_count),
    }))
    .filter((c) => CONTRACTORS_COVER_ALL_NCR || c.distanceKm <= c.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.activeCount - b.activeCount);
}

// ---- Email codes ----------------------------------------------------------------------------

export interface OtpRow {
  id: number;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

export async function saveOtp(email: string, portal: string, codeHash: string, ttlMinutes: number) {
  await pool.query(
    `insert into email_otps (email, portal, code_hash, expires_at)
     values ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
    [email.toLowerCase(), portal, codeHash, String(ttlMinutes)],
  );
}

/** The newest code for this email and portal, if it hasn't been used. */
export async function latestOtp(email: string, portal: string): Promise<OtpRow | null> {
  const { rows } = await pool.query<OtpRow>(
    `select id, code_hash, expires_at, attempts, created_at from email_otps
      where email = $1 and portal = $2 and consumed_at is null
      order by created_at desc limit 1`,
    [email.toLowerCase(), portal],
  );
  return rows[0] ?? null;
}

export async function bumpOtpAttempts(id: number): Promise<void> {
  await pool.query("update email_otps set attempts = attempts + 1 where id = $1", [id]);
}

export async function consumeOtp(id: number): Promise<void> {
  await pool.query("update email_otps set consumed_at = now() where id = $1", [id]);
}
