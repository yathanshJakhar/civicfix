import type { Status } from "./types";

/** Distance in metres between two lat/lng points. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const units: [number, string][] = [
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (secs >= size) return `${Math.floor(secs / size)}${label} ago`;
  }
  return "just now";
}

export const STATUS_STYLES: Record<Status, { text: string; mark: string; solid: string; hex: string }> = {
  Open: { text: "text-open", mark: "bg-open", solid: "bg-open text-panel", hex: "#9c2714" },
  "In Progress": { text: "text-progress", mark: "bg-progress", solid: "bg-progress text-panel", hex: "#265482" },
  Resolved: { text: "text-fixed", mark: "bg-fixed", solid: "bg-fixed text-panel", hex: "#2f5c23" },
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

// Per-device upvote memory, so one phone can't upvote the same issue repeatedly in the demo.
const UPVOTE_KEY = "civicfix:upvoted";

export function getUpvoted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(UPVOTE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setUpvoted(id: string, upvoted: boolean) {
  try {
    const ids = new Set(getUpvoted());
    if (upvoted) ids.add(id);
    else ids.delete(id);
    localStorage.setItem(UPVOTE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable — ignore */
  }
}

// Per-device memory of the status each issue had when this phone last opened it. A row
// whose status has moved since then stays lit on the board until it is opened again.
const SEEN_KEY = "civicfix:seen";

export function getSeen(): Record<string, Status> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeSeen(seen: Record<string, Status>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function markSeen(id: string, status: Status) {
  const seen = getSeen();
  if (seen[id] === status) return;
  writeSeen({ ...seen, [id]: status });
}

/** Records a baseline for issues this device has never seen, so only real changes light up. */
export function baselineSeen(issues: { id: string; status: Status }[]): Record<string, Status> {
  const seen = getSeen();
  let added = false;
  for (const i of issues) {
    if (!(i.id in seen)) {
      seen[i.id] = i.status;
      added = true;
    }
  }
  if (added) writeSeen(seen);
  return seen;
}

/** Short ticket code derived from the issue id, e.g. seed-01 → CF-0001, e3728ac9 → CF-E372. */
export function issueCode(id: string): string {
  const seed = /^seed-(\d+)$/.exec(id);
  return `CF-${seed ? seed[1].padStart(4, "0") : id.slice(0, 4).toUpperCase()}`;
}

export const DELHI_CENTER: [number, number] = [28.6139, 77.209];
