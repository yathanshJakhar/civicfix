"use client";

import { useCallback, useEffect, useState } from "react";
import type { Issue, Status } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  list: () => request<Issue[]>("/api/issues"),
  get: (id: string) => request<Issue>(`/api/issues/${encodeURIComponent(id)}`),
  create: (form: FormData) => request<Issue>("/api/issues", { method: "POST", body: form }),
  patch: (
    id: string,
    body:
      | { action: "upvote" }
      | { action: "unvote" }
      | { action: "comment"; text: string }
      | { action: "status"; status: Status },
  ) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

/** Loads all issues with loading/error state and a retry function. */
export function useIssues() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setIssues(await api.list());
    } catch (e) {
      setError((e as Error).message || "Could not load issues");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
  }, [load]);

  return { issues, error, loading: issues === null && !error, reload: load };
}
