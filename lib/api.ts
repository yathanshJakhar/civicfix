"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Issue, Status } from "./types";

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
      | { action: "progress"; status: Exclude<Status, "Open">; note?: string }
      | { action: "assign"; contractorId: number }
      | { action: "category"; category: Category },
  ) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

/** Issues in the signed-in officer's department (all of them for the admin). */
export const authorityIssues = () => request<Issue[]>("/api/authority/issues");
/** Issues the signed-in user reported. */
export const myIssues = () => request<Issue[]>("/api/me/issues");
/** Jobs assigned to the signed-in contractor. */
export const contractorIssues = () => request<Issue[]>("/api/contractor/issues");

/** A contractor the department can hand a ticket to. */
export interface ContractorOption {
  id: number;
  name: string;
  phone: string | null;
  distanceKm: number;
  radiusKm: number;
  /** Unresolved projects they're working on now. */
  activeCount: number;
}

export const contractorsForIssue = (issueId: string) =>
  request<ContractorOption[]>(`/api/authority/contractors?issueId=${encodeURIComponent(issueId)}`);

export type ContractorStatus = "pending" | "approved" | "rejected";

export interface ContractorRecord {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  departments: string[];
  lat: number;
  lng: number;
  radiusKm: number;
  status: ContractorStatus;
  requestedDepartment: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  activeCount: number;
}

/** What a department fills in when adding or editing a contractor. */
export interface ContractorForm {
  email: string;
  name: string;
  phone: string | null;
  lat: number;
  lng: number;
  radiusKm: number;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** A department's own contractors: propose, edit, withdraw. */
export const departmentContractors = {
  list: () => request<ContractorRecord[]>("/api/department/contractors"),
  propose: (c: ContractorForm) => request<ContractorRecord>("/api/department/contractors", json("POST", c)),
  update: (id: number, c: ContractorForm) =>
    request<ContractorRecord>("/api/department/contractors", json("PATCH", { id, ...c })),
  withdraw: (id: number) => request<{ ok: true }>(`/api/department/contractors?id=${id}`, { method: "DELETE" }),
};

/** The admin's approvals. */
export const adminContractors = {
  list: () => request<ContractorRecord[]>("/api/admin/contractors"),
  review: (id: number, decision: "approved" | "rejected", note?: string) =>
    request<ContractorRecord>("/api/admin/contractors", json("PATCH", { id, decision, note })),
};

export interface Account {
  id: number;
  email: string;
  name: string;
  role: "citizen" | "authority" | "admin" | "contractor";
  department: string | null;
  phone: string | null;
  notifyUpdates: boolean;
}

export const accountApi = {
  get: () => request<{ account: Account; contractor: ContractorRecord | null }>("/api/account"),
  update: (a: { name: string; phone: string | null; notifyUpdates: boolean }) =>
    request<{ account: Account }>("/api/account", json("PATCH", a)),
  remove: () => request<{ ok: true }>("/api/account", { method: "DELETE" }),
};

/**
 * Loads a list of issues with loading/error state and a retry function.
 * Pass `enabled: false` to wait (e.g. until the session is known) without fetching.
 */
function useIssueList(fetcher: () => Promise<Issue[]>, enabled = true) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setIssues(await fetcher());
    } catch (e) {
      setError((e as Error).message || "Could not load issues");
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
  }, [load, enabled]);

  return { issues, error, loading: issues === null && !error, reload: load };
}

/** Open tickets (location and title only), for the report form's duplicate check. */
export function useIssues() {
  return useIssueList(api.list);
}

export function useContractorIssues(enabled = true) {
  return useIssueList(contractorIssues, enabled);
}

export function useAuthorityIssues(enabled = true) {
  return useIssueList(authorityIssues, enabled);
}

export function useMyIssues(enabled = true) {
  return useIssueList(myIssues, enabled);
}
