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

export const STATUS_STYLES: Record<Status, { badge: string; dot: string; solid: string; hex: string }> = {
  Open: {
    badge: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
    dot: "bg-rose-400",
    solid: "bg-rose-500 text-black",
    hex: "#fb7185",
  },
  "In Progress": {
    badge: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    dot: "bg-amber-400",
    solid: "bg-amber-400 text-black",
    hex: "#fbbf24",
  },
  Resolved: {
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    dot: "bg-emerald-400",
    solid: "bg-emerald-400 text-black",
    hex: "#34d399",
  },
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

export const DELHI_CENTER: [number, number] = [28.6139, 77.209];
