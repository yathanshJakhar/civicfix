export const CATEGORIES = [
  "Pothole",
  "Garbage",
  "Streetlight",
  "Water Leakage",
  "Sewage",
  "Traffic",
  "Other",
] as const;

export const STATUSES = ["Open", "In Progress", "Resolved"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

export interface Comment {
  text: string;
  at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  imageUrl: string | null;
  status: Status;
  upvotes: number;
  comments: Comment[];
  createdAt: string;
}

export function isCategory(v: unknown): v is Category {
  return CATEGORIES.includes(v as Category);
}

export function isStatus(v: unknown): v is Status {
  return STATUSES.includes(v as Status);
}

/** Resolved issues are kept on file but hidden from the feed, map and duplicate check. */
export const ACTIVE_STATUSES = ["Open", "In Progress"] as const satisfies readonly Status[];

export function isActive(issue: Pick<Issue, "status">): boolean {
  return issue.status !== "Resolved";
}
