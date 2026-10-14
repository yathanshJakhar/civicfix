# CivicFix

A mobile-first prototype for reporting civic issues (potholes, garbage, broken streetlights, leaks…) across **Delhi NCR**. Built as a final-year project demo.

Citizens can report an issue with a photo and GPS location, browse a feed, see issues on a map with a heatmap, upvote, comment, and track status.

> **Prototype scope:** no database, no AI, no login, and no connection to any government system. All data is stored in a local JSON file (`data/issues.json`).

## Tech stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4
- Leaflet + react-leaflet with OpenStreetMap tiles, and `leaflet.heat` for the heatmap
- File-based storage via Next.js route handlers (`fs/promises`)

## Run locally

Requires Node.js 20 or later.

```bash
cd civicfix
npm install
npm run dev
```

Open http://localhost:3000.

### Reset the demo data

The repo ships with 14 seeded issues. To reset after a demo, restore the file with git and delete the uploaded photos:

```bash
git checkout data/issues.json
# then delete everything in public/uploads/ except .gitkeep
```

## Demo on your phone

1. Start the dev server so it listens on your network:

   ```bash
   npm run dev -- -H 0.0.0.0
   ```

2. Browsers only allow **geolocation on HTTPS** (or on `localhost`). Opening `http://<your-laptop-ip>:3000` on a phone loads the app, but location auto-detect won't work. The app then falls back to "tap the map to pick a location". To get real GPS, tunnel the app over HTTPS with [ngrok](https://ngrok.com/):

   ```bash
   ngrok http 3000
   ```

3. Open the `https://….ngrok-free.app` URL that ngrok prints on your phone. Allow location access when the browser asks. The camera opens directly from the **Photo** field on the Report page.

> `next.config.ts` already allows ngrok hosts and `192.168.x.x` / `10.x.x.x` LAN addresses in `allowedDevOrigins`. If you use a different tunnel or network, add its hostname there.

## ⚠️ Storage only works locally

Issues are written to `data/issues.json` and photos are saved to `public/uploads/`. This needs a writable, persistent filesystem, so **it does not work on Vercel** or other serverless hosts. Use `npm run dev` on your laptop for the demo.

## Features

| Page | What it does |
| --- | --- |
| **Home** `/` | Feed of issue cards (photo, category, colour-coded status, upvotes, comments, relative time). Status summary tiles, category chips, status filter, sort by Newest or Top. |
| **Map** `/map` | OpenStreetMap centred on Delhi. Pins are coloured by status, and each popup links to the issue. Heatmap weighted by `0.5 + upvotes × 0.1`. Toggle between Markers, Heatmap and Both. |
| **Report** `/report` | Title, description, category, camera photo with preview. Location is auto-detected (high accuracy) with a "Use my location" button; if that fails, tap or drag a pin on a map. Shows a **duplicate warning** when issues of the same category exist within 100 m (haversine), with "Upvote existing instead" or "Report anyway". |
| **Issue** `/issue/[id]` | Full photo, details, mini-map, status timeline, optimistic upvote (once per device), comments, share (copies link), and an **Admin demo control** to move status Open → In Progress → Resolved. |

### API

| Method | Route | Body |
| --- | --- | --- |
| GET | `/api/issues` | — |
| POST | `/api/issues` | `multipart/form-data`: `title`, `description`, `category`, `lat`, `lng`, optional `photo` |
| GET | `/api/issues/:id` | — |
| PATCH | `/api/issues/:id` | JSON `{ "action": "upvote" }`, `{ "action": "comment", "text": "…" }` or `{ "action": "status", "status": "In Progress" }` |

## Project structure

```
app/
  page.tsx                 Home feed
  map/page.tsx             Map + heatmap
  report/page.tsx          Report form
  issue/[id]/              Issue detail
  api/issues/              Route handlers (GET/POST, GET/PATCH)
components/
  map/                     Leaflet components (loaded client-only via next/dynamic)
  BottomNav, IssueCard, Badges, …
lib/
  db.ts                    readIssues / writeIssues (JSON file, serialised writes)
  types.ts, utils.ts, api.ts
data/issues.json           Seed + live data
public/uploads/            Uploaded photos
```
