# CivicFix

A mobile-first app for reporting civic issues (potholes, garbage, broken streetlights, leaks…) across **Delhi NCR**. Built as a final-year project.

Citizens report an issue with a photo and GPS location. An image model suggests the category, and the ticket is routed to the matching department automatically. The department assigns it to a contractor who covers that area, and the contractor updates progress until it's fixed. Everyone is kept informed by email.

## Roles

| Role | Signs in on | Can do |
| --- | --- | --- |
| **Citizen** | Citizen tab (any email; account created on first sign-in) | Report issues, follow their own tickets, comment. They're emailed on creation and, unless turned off in Account, on assignment (with the contractor's name) and every progress update. The **Account** page has profile (name, phone), the email preference, a summary of their reports, sign out and account deletion. |
| **Department officer** | Department tab (email must be in `authority_emails`) | Sees **only their department's** tickets on the dashboard and map. Adds contractors for their department at `/authority/contractors` (they need admin approval). Assigns each ticket to an approved contractor, seeing each one's distance and current number of projects. Can't change progress. |
| **Contractor** | Contractor tab (email must be in `contractors` **and approved**) | Sees the jobs assigned to them and posts progress (In Progress / Work done plus a note). They're emailed when approved and when a job is assigned. |
| **Admin** | Department tab (an `authority_emails` row with no department) | **Approves or rejects** contractors that departments add, at `/admin/contractors`. Rejecting an approved contractor revokes them and returns their open jobs to the department. Can view every department's tickets but **can't assign or recategorise** them. |

Citizens sign in with a **6-digit code sent to their email**, so there are no passwords. Codes expire after 10 minutes, allow 5 attempts, and can be resent after 30 seconds.

> **Testing mode:** `STAFF_SIGN_IN_WITHOUT_CODE = true` in `lib/flags.ts` lets officers, the admin and contractors sign in with just their registered email and no code, so made-up demo addresses work. Set it to `false` before a real deployment.

The **department is never chosen by anyone**. It comes from the ticket's category (`lib/departments.ts`), and an officer's department comes from their email (`authority_emails`).

## Tech stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4
- Postgres (Supabase) via `pg`. JWT session cookie via `jose`.
- Email via Gmail SMTP with `nodemailer` (`lib/mailer.ts`)
- Leaflet + react-leaflet with OpenStreetMap tiles, `leaflet.heat` for the heatmap
- Image classifier: separate FastAPI service in `../civicfix-ai` (ResNet-18)

## Setup

Requires Node.js 20 or later.

1. **Environment.** Put these in `.env.local`:

   | Key | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string |
   | `AUTH_SECRET` | 32+ random characters; signs sessions and hashes codes |
   | `GMAIL_USER` | Gmail address that sends all emails |
   | `GMAIL_APP_PASSWORD` | 16-character Google **app password** for that account (not the normal password). **If either is unset, emails are printed to the server console instead.** |
   | `MAIL_FROM_NAME` | Optional sender name (default `CivicFix`) |
   | `APP_URL` | Base URL used in email links (default `http://localhost:3000`) |
   | `AI_URL` | Classifier endpoint (default `http://localhost:8000/classify`) |

2. **Database.** Run the migrations in order in the Supabase SQL editor (or `psql`):
   `scripts/migrations/001_issue_reporter.sql`, then `scripts/migrations/002_otp_contractors.sql`.

3. **Seed officers and demo contractors.** Edit the emails in `scripts/seed-users.mjs` to inboxes you can read, then:

   ```bash
   node --env-file=.env.local scripts/seed-users.mjs
   ```

4. **Run:**

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000. For AI category suggestions, also start the classifier (see `../civicfix-ai`): `uvicorn main:app --port 8000`.

## Demo on your phone

1. Start the dev server so it listens on your network: `npm run dev -- -H 0.0.0.0`.
2. Browsers only allow geolocation on HTTPS (or on `localhost`). To get real GPS on a phone, tunnel the app with [ngrok](https://ngrok.com/) (`ngrok http 3000`) and open the HTTPS URL it prints. Without HTTPS, the report form falls back to "tap the map to pick a location".

> `next.config.ts` already allows ngrok hosts and `192.168.x.x` / `10.x.x.x` LAN addresses in `allowedDevOrigins`.

Photos are saved to `public/uploads/`, which needs a writable filesystem. This works locally but not on serverless hosts like Vercel.

## Pages

| Page | Who | What it does |
| --- | --- | --- |
| `/login` | All | Citizen / Department / Contractor tabs. Email, then code. |
| `/` | All | Redirects to the role's home page |
| `/tickets` | Citizen | Your tickets, their department, assigned contractor and status |
| `/report` | Citizen | Photo, AI category, location, duplicate check (upvote a nearby ticket instead) |
| `/authority` | Officer, admin | Department dashboard: tally, map, ticket list with **Assign contractor** |
| `/map` | Officer, admin | Department map with heatmap |
| `/contractor` | Contractor | Assigned jobs, directions, progress updates |
| `/admin/contractors` | Admin | Manage contractors: departments, base location and service radius |
| `/issue/[id]` | Reporter, its department, assigned contractor, admin | Full ticket, work order, comments |

## API

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/auth/otp/request` | `{ email, portal }`. Emails a code. |
| POST | `/api/auth/otp/verify` | `{ email, portal, code, name? }`. Signs in. |
| POST | `/api/auth/logout`, GET `/api/auth/me` | |
| GET | `/api/issues` | Open tickets near-by data for the duplicate check (minimal fields) |
| POST | `/api/issues` | Citizen only. `multipart/form-data`. Department set from category. Emails citizen and department. |
| GET | `/api/issues/:id` | Only for the people listed above |
| PATCH | `/api/issues/:id` | `upvote` / `unvote` / `comment`; `category` (department); `assign` `{ contractorId }` (department, emails contractor, citizen and department); `progress` `{ status, note? }` (assigned contractor, emails citizen and department) |
| GET | `/api/authority/issues` | The officer's department tickets |
| GET | `/api/authority/contractors?issueId=` | Contractors for that department whose radius covers the ticket, with distance and active project count |
| GET | `/api/contractor/issues` | The contractor's jobs |
| GET/POST/DELETE | `/api/admin/contractors` | Admin contractor management |
| POST | `/api/classify` | Forwards a photo to the AI service |
