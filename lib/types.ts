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

/** What the image model predicted for the uploaded photo. */
export interface AiClassification {
  /** Raw model class, e.g. "Potholes and RoadCracks". */
  label: string;
  /** 0–1 softmax confidence of the top class. */
  confidence: number;
  /** The app category that label maps to. */
  category: Category;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  /** Present when the photo was classified by the AI at report time. */
  ai?: AiClassification | null;
  /** "ai" while the category is still the AI's pick; "user" once someone chose it by hand. */
  categorySource?: "ai" | "user";
  lat: number;
  lng: number;
  imageUrl: string | null;
  status: Status;
  upvotes: number;
  comments: Comment[];
  createdAt: string;
  /** Owning department, set from the category when the ticket is created. */
  department: string;
  /** The contractor the department passed the work to, if any. */
  contractor?: ContractorRef | null;
  assignedAt?: string | null;
  /** Latest progress note written by the contractor. */
  progressNote?: string | null;
}

export interface ContractorRef {
  id: number;
  name: string;
  phone: string | null;
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
