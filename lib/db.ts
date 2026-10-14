import { readFile, writeFile, rename } from "fs/promises";
import path from "path";
import type { Issue } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "issues.json");

export async function readIssues(): Promise<Issue[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Issue[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function writeIssues(issues: Issue[]): Promise<void> {
  // Write to a temp file then rename, so a crash mid-write can't corrupt the JSON.
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(issues, null, 2), "utf8");
  await rename(tmp, DATA_FILE);
}

// Serialise read-modify-write cycles so rapid upvotes/comments don't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

export function updateIssues<T>(fn: (issues: Issue[]) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const issues = await readIssues();
    const result = await fn(issues);
    await writeIssues(issues);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
