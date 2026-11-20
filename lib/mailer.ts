import nodemailer, { type Transporter } from "nodemailer";
import type { Issue } from "./types";

// One SMTP connection pool, reused across requests and hot reloads.
const g = globalThis as unknown as { mailer?: Transporter };

function transporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""); // Google shows it in 4-letter groups
  if (!user || !pass) return null;
  g.mailer ??= nodemailer.createTransport({ service: "gmail", pool: true, auth: { user, pass } });
  return g.mailer;
}

/**
 * Every email the app sends goes through sendMail(), so the provider can be swapped in one place.
 * Sends through Gmail SMTP using GMAIL_USER and GMAIL_APP_PASSWORD. Without them, the email is
 * printed to the server console instead, which keeps local development working with no account.
 */
export async function sendMail(to: string | string[], subject: string, html: string): Promise<void> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  const smtp = transporter();
  if (!smtp) {
    console.log(`\n[mail:dev] to=${recipients.join(", ")}\n  subject: ${subject}\n  ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    return;
  }

  await smtp.sendMail({
    from: { name: process.env.MAIL_FROM_NAME || "CivicFix", address: process.env.GMAIL_USER! },
    // Each recipient gets their own copy, so officers don't see each other's addresses.
    to: recipients.length === 1 ? recipients[0] : undefined,
    bcc: recipients.length > 1 ? recipients : undefined,
    subject,
    html: layout(subject, html),
  });
}

/** Sends without ever throwing: notification failures are logged, never shown to the user. */
export async function sendMailSafe(to: string | string[], subject: string, html: string) {
  try {
    await sendMail(to, subject, html);
  } catch (err) {
    console.error("[mail] failed:", subject, err);
  }
}

const APP_URL = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1a1a1a">
    <p style="font-weight:700;font-size:13px;letter-spacing:.08em;color:#666;margin:0 0 16px">CIVICFIX</p>
    <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
    ${body}
    <p style="font-size:12px;color:#888;margin-top:32px">This is an automated message from CivicFix.</p>
  </div>`;
}

function ticketBlock(i: Issue) {
  const map = `https://www.google.com/maps?q=${i.lat},${i.lng}`;
  return `<table style="border-collapse:collapse;font-size:14px;margin:12px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#666">Ticket</td><td><b>#${esc(i.id)}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Title</td><td>${esc(i.title)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Category</td><td>${esc(i.category)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Department</td><td>${esc(i.department)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Status</td><td>${esc(i.status)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Location</td><td><a href="${map}">Open in Maps</a></td></tr>
  </table>`;
}

const link = (path: string, label: string) =>
  `<p><a href="${APP_URL()}${path}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${label}</a></p>`;

// ---- Templates ------------------------------------------------------------------------------

export const mail = {
  otp: (to: string, code: string) =>
    sendMail(
      to,
      `Your CivicFix sign-in code: ${code}`,
      `<p>Enter this code to sign in. It expires in 10 minutes.</p>
       <p style="font-size:32px;font-weight:700;letter-spacing:.3em;margin:16px 0">${code}</p>
       <p style="color:#666;font-size:13px">If you didn't ask for this, you can ignore this email.</p>`,
    ),

  ticketCreatedUser: (to: string, name: string, i: Issue) =>
    sendMailSafe(
      to,
      `Ticket #${i.id} received`,
      `<p>Hi ${esc(name)}, thanks for reporting this. Your ticket has been sent to <b>${esc(i.department)}</b>.</p>
       ${ticketBlock(i)}${link(`/issue/${i.id}`, "Track your ticket")}`,
    ),

  ticketCreatedDepartment: (to: string[], i: Issue) =>
    sendMailSafe(
      to,
      `New ticket #${i.id} for ${i.department}`,
      `<p>A new complaint has been filed for your department. Assign a contractor from the dashboard.</p>
       ${ticketBlock(i)}${link(`/issue/${i.id}`, "Open ticket")}`,
    ),

  assignedContractor: (to: string, contractorName: string, i: Issue) =>
    sendMailSafe(
      to,
      `New work order #${i.id}: ${i.title}`,
      `<p>Hi ${esc(contractorName)}, <b>${esc(i.department)}</b> has assigned you a new job.</p>
       ${ticketBlock(i)}
       ${i.description ? `<p style="color:#444">${esc(i.description)}</p>` : ""}
       <p>Please update progress from your contractor dashboard as work moves along.</p>
       ${link("/contractor", "Open your jobs")}`,
    ),

  assignedUser: (to: string, name: string, i: Issue) =>
    sendMailSafe(
      to,
      `Work has started on ticket #${i.id}`,
      `<p>Hi ${esc(name)}, <b>${esc(i.department)}</b> has assigned your complaint to
       <b>${esc(i.contractor?.name ?? "a contractor")}</b>${i.contractor?.phone ? ` (${esc(i.contractor.phone)})` : ""}.</p>
       ${ticketBlock(i)}${link(`/issue/${i.id}`, "Track your ticket")}`,
    ),

  assignedDepartment: (to: string[], i: Issue) =>
    sendMailSafe(
      to,
      `Ticket #${i.id} assigned to ${i.contractor?.name ?? "contractor"}`,
      `<p>This ticket is now with <b>${esc(i.contractor?.name ?? "")}</b>.</p>${ticketBlock(i)}`,
    ),

  progressUser: (to: string, name: string, i: Issue) =>
    sendMailSafe(
      to,
      i.status === "Resolved" ? `Ticket #${i.id} resolved` : `Update on ticket #${i.id}`,
      `<p>Hi ${esc(name)}, <b>${esc(i.contractor?.name ?? "The contractor")}</b> has
       ${i.status === "Resolved" ? "marked your complaint as <b>resolved</b>" : "posted an update on your complaint"}.</p>
       ${i.progressNote ? `<blockquote style="border-left:3px solid #ccc;margin:12px 0;padding-left:12px;color:#444">${esc(i.progressNote)}</blockquote>` : ""}
       ${ticketBlock(i)}${link(`/issue/${i.id}`, "View ticket")}`,
    ),

  contractorProposed: (to: string[], c: { name: string; email: string; department: string }) =>
    sendMailSafe(
      to,
      `Approval needed: ${c.name} (${c.department})`,
      `<p><b>${esc(c.department)}</b> has added a new contractor and needs your approval before they can take work.</p>
       <p><b>${esc(c.name)}</b><br>${esc(c.email)}</p>
       ${link("/admin/contractors", "Review contractors")}`,
    ),

  contractorReviewed: (
    to: string[],
    c: { name: string; status: "approved" | "rejected"; note: string | null },
  ) =>
    sendMailSafe(
      to,
      `${c.name} was ${c.status === "approved" ? "approved" : "not approved"}`,
      `<p>The admin has <b>${c.status === "approved" ? "approved" : "rejected"}</b> <b>${esc(c.name)}</b>.
       ${c.status === "approved" ? "You can now assign them to your department's tickets." : ""}</p>
       ${c.note ? `<blockquote style="border-left:3px solid #ccc;margin:12px 0;padding-left:12px;color:#444">${esc(c.note)}</blockquote>` : ""}
       ${link("/authority/contractors", "Your contractors")}`,
    ),

  contractorWelcome: (to: string, name: string, department: string) =>
    sendMailSafe(
      to,
      "You're registered as a CivicFix contractor",
      `<p>Hi ${esc(name)}, <b>${esc(department)}</b> has registered you as a contractor and your account is approved.</p>
       <p>Sign in on the <b>Contractor</b> tab with this email address to see the work assigned to you.</p>
       ${link("/login", "Sign in")}`,
    ),

  progressDepartment: (to: string[], i: Issue) =>
    sendMailSafe(
      to,
      `${i.contractor?.name ?? "Contractor"} updated ticket #${i.id}: ${i.status}`,
      `${i.progressNote ? `<p>${esc(i.progressNote)}</p>` : ""}${ticketBlock(i)}`,
    ),
};
