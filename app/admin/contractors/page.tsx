"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { adminContractors, type ContractorRecord, type ContractorStatus } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

const TABS: { id: ContractorStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

/**
 * The admin's job: approve or reject the contractors departments add. Departments create and
 * assign contractors themselves; nothing reaches a contractor until it's approved here.
 */
export default function AdminApprovalsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState<ContractorRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ContractorStatus>("pending");

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await adminContractors.list());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
  }, [isAdmin, load]);

  const counts = useMemo(() => {
    const c: Record<ContractorStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    list?.forEach((x) => c[x.status]++);
    return c;
  }, [list]);
  const visible = (list ?? []).filter((c) => c.status === tab);

  if (authLoading) return <PageHeader title="Approvals" />;

  if (!isAdmin) {
    return (
      <>
        <PageHeader title="Approvals" />
        <div className="px-4 pt-5">
          <EmptyState title="Admin only" message="Only the CivicFix admin approves contractors.">
            <Link href={homeFor(user)} className="btn btn-primary mt-5">
              Back
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Approvals" subtitle="Contractors added by departments" />

      <div className="ticket mx-4 mt-4 grid grid-cols-[minmax(0,1fr)_5.75rem]">
        <div className="min-w-0 px-4 py-3.5">
          <p className="label">Admin</p>
          <p className="mt-2 text-[13px] text-dim">
            Departments add contractors for their own work. Approve them here before they can sign in or be assigned
            tickets. Rejecting an approved contractor revokes them and returns their open jobs to the department.
          </p>
          <Link href="/authority" className="mt-2 inline-block font-cond text-sm font-bold uppercase tracking-[0.06em] text-saffron underline underline-offset-4">
            View all tickets
          </Link>
        </div>
        <div className="perf-y stub flex flex-col items-center justify-center gap-1 px-1">
          <span className="figure text-[2.5rem] font-bold leading-none text-saffron">{list ? counts.pending : "–"}</span>
          <span className="label">Pending</span>
        </div>
      </div>

      <div role="tablist" aria-label="Contractor status" className="mx-4 mt-4 grid grid-cols-3 border border-line-strong">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={`min-h-11 font-cond text-[13px] font-bold uppercase tracking-[0.08em] transition-colors ${
                on ? "bg-ink text-panel" : "bg-panel text-dim hover:text-ink"
              }`}
            >
              {t.label} <span className="figure">({list ? counts[t.id] : "–"})</span>
            </button>
          );
        })}
      </div>

      <section className="pt-4" aria-label={`${tab} contractors`}>
        {error ? (
          <div className="px-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : !list ? (
          <p className="px-4 text-sm text-dim">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="px-4">
            <EmptyState
              title={tab === "pending" ? "Nothing waiting" : `No ${tab} contractors`}
              message={tab === "pending" ? "New contractors added by departments will appear here." : undefined}
            />
          </div>
        ) : (
          <ul className="border-t border-line-strong">
            {visible.map((c) => (
              <ReviewRow key={c.id} c={c} onDone={load} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ReviewRow({ c, onDone }: { c: ContractorRecord; onDone: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    if (decision === "rejected" && c.status === "approved" && c.activeCount > 0) {
      if (!confirm(`Revoke ${c.name}? Their ${c.activeCount} open job(s) go back to the department unassigned.`)) return;
    }
    setBusy(decision);
    setError(null);
    try {
      await adminContractors.review(c.id, decision, note.trim() || undefined);
      await onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <li className="border-b border-line-strong px-4 py-3.5">
      <p className="text-[15px] font-semibold text-ink">{c.name}</p>
      <p className="truncate text-[13px] text-dim">
        {c.email}
        {c.phone ? ` · ${c.phone}` : ""}
      </p>
      <p className="mt-0.5 text-[13px] text-faint">
        {c.departments.join(", ")}
        {c.requestedDepartment ? ` · added by ${c.requestedDepartment}` : " · seeded"}
        {c.status === "approved" && (
          <>
            {" "}· <span className="figure text-saffron">{c.activeCount}</span> active
          </>
        )}
        {c.reviewedAt && ` · reviewed ${timeAgo(c.reviewedAt)}`}
      </p>
      {c.reviewNote && (
        <p className="mt-1.5 border-l-2 border-line-strong pl-2.5 text-[13px] text-dim">
          <span className="label mr-1.5">Note</span>
          {c.reviewNote}
        </p>
      )}

      <div className="mt-3 space-y-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Note to the department (optional)"
          aria-label={`Note about ${c.name}`}
          className="field"
        />
        <div className="flex gap-2">
          {c.status !== "approved" && (
            <button onClick={() => decide("approved")} disabled={busy !== null} className="btn btn-primary flex-1">
              {busy === "approved" ? "Approving…" : "Approve"}
            </button>
          )}
          {c.status !== "rejected" && (
            <button onClick={() => decide("rejected")} disabled={busy !== null} className="btn btn-secondary flex-1">
              {busy === "rejected" ? "Saving…" : c.status === "approved" ? "Revoke" : "Reject"}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-open" role="alert">{error}</p>}
      </div>
    </li>
  );
}
