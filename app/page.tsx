"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryIcon from "@/components/CategoryIcon";
import IssueCard, { IssueCardSkeleton } from "@/components/IssueCard";
import { EmptyState, ErrorState } from "@/components/States";
import { useIssues } from "@/lib/api";
import { ACTIVE_STATUSES, CATEGORIES, STATUSES, isActive, type Category, type Status } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";

type Sort = "newest" | "upvotes";
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export default function HomePage() {
  const { issues, error, loading, reload } = useIssues();
  const [category, setCategory] = useState<Category | "All">("All");
  const [status, setStatus] = useState<ActiveStatus | "All">("All");
  const [sort, setSort] = useState<Sort>("newest");

  const visible = useMemo(() => {
    if (!issues) return [];
    return issues
      .filter(isActive) // resolved issues are hidden from the feed
      .filter((i) => category === "All" || i.category === category)
      .filter((i) => status === "All" || i.status === status)
      .sort((a, b) =>
        sort === "upvotes"
          ? b.upvotes - a.upvotes
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [issues, category, status, sort]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { Open: 0, "In Progress": 0, Resolved: 0 };
    issues?.forEach((i) => c[i.status]++);
    return c;
  }, [issues]);

  const filtered = category !== "All" || status !== "All";

  return (
    <>
      <PageHeader title="CivicFix" subtitle="Civic issues across Delhi NCR">
        <span className="rounded-md border border-violet-500/40 px-2 py-1 text-xs font-bold tracking-wider text-violet-300">
          NCR
        </span>
      </PageHeader>

      <div className="space-y-4 px-4 pt-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => {
            const label = (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].dot}`} />
                  {s}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">{issues ? counts[s] : "–"}</div>
              </>
            );
            // Resolved issues aren't listed, so that tile is just a count of fixed issues.
            if (s === "Resolved") {
              return (
                <div key={s} className="rounded-xl border border-dashed border-zinc-800 p-3" title="Resolved issues are hidden from the feed">
                  {label}
                </div>
              );
            }
            return (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "All" : s)}
                className={`rounded-xl border bg-zinc-900 p-3 text-left transition active:scale-95 ${
                  status === s ? "border-violet-500" : "border-zinc-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold transition ${
                category === c
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {c !== "All" && <CategoryIcon category={c} className="h-4 w-4" />}
              {c}
            </button>
          ))}
        </div>

        {/* Status + sort */}
        <div className="flex gap-2">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ActiveStatus | "All")}
            className="h-12 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-semibold text-zinc-200 focus:border-violet-500 focus:outline-none"
          >
            <option value="All">All active</option>
            {ACTIVE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="flex h-12 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(
              [
                ["newest", "Newest"],
                ["upvotes", "Top"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={`rounded-lg px-3.5 text-sm font-bold transition ${
                  sort === value ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <IssueCardSkeleton key={i} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={filtered ? "No matching issues" : counts.Resolved > 0 ? "No open issues" : "No issues yet"}
            message={
              filtered
                ? "Try a different category or status."
                : counts.Resolved > 0
                  ? "Everything reported so far has been resolved."
                  : "Be the first to report one in your area."
            }
          >
            {filtered ? (
              <button
                onClick={() => {
                  setCategory("All");
                  setStatus("All");
                }}
                className="mt-4 h-12 rounded-xl bg-white px-6 text-sm font-bold text-black"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/report"
                className="mt-4 inline-flex h-12 items-center rounded-xl bg-violet-600 px-6 text-sm font-bold text-white"
              >
                Report an issue
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {visible.length} issue{visible.length === 1 ? "" : "s"}
            </p>
            {visible.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
