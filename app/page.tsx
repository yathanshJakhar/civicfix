"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryIcon from "@/components/CategoryIcon";
import { BoardHeader, BoardRow, BoardSkeleton, LeadTicket } from "@/components/IssueCard";
import { EmptyState, ErrorState } from "@/components/States";
import { useIssues } from "@/lib/api";
import { useFlip } from "@/lib/useFlip";
import { ACTIVE_STATUSES, CATEGORIES, STATUSES, isActive, type Category, type Status } from "@/lib/types";
import { STATUS_STYLES, baselineSeen } from "@/lib/utils";

type Sort = "newest" | "upvotes";
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

const SORTS: [Sort, string][] = [
  ["upvotes", "Most upvoted"],
  ["newest", "Newest"],
];

export default function HomePage() {
  const { issues, error, loading, reload } = useIssues();
  const [category, setCategory] = useState<Category | "All">("All");
  const [status, setStatus] = useState<ActiveStatus | "All">("All");
  const [sort, setSort] = useState<Sort>("upvotes");
  const [seen, setSeen] = useState<Record<string, Status>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!issues) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads per-device storage once issues arrive
    setSeen(baselineSeen(issues));
    setUpdatedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  }, [issues]);

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

  const boardRef = useFlip<HTMLDivElement>(visible.map((i) => i.id).join());
  const changed = (id: string, s: Status) => seen[id] !== undefined && seen[id] !== s;
  const filtered = category !== "All" || status !== "All";
  const [lead, ...rest] = visible;

  return (
    <>
      <PageHeader title="CivicFix" subtitle={<span className="label">Civic issues · Delhi NCR</span>} display>
        <span className="shrink-0 text-right">
          <span className="figure block text-lg font-bold leading-none text-marigold">
            {issues ? counts.Open + counts["In Progress"] : "–"}
            <span className="font-cond text-sm font-bold uppercase tracking-[0.08em]"> active</span>
          </span>
          <span className="label mt-1.5 block">{updatedAt ? `Updated ${updatedAt}` : "Updating…"}</span>
        </span>
      </PageHeader>

      {/* Tally strip: Open and In Progress filter the board; Fixed is a count only. */}
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        {STATUSES.map((s) => {
          const body = (
            <>
              <span className="label flex items-center gap-1.5">
                <span className={`h-2 w-2 ${STATUS_STYLES[s].mark}`} aria-hidden />
                {s === "Resolved" ? "Fixed" : s}
              </span>
              <span className={`figure mt-1.5 block text-[1.75rem] font-bold leading-none ${s === "Resolved" ? "text-fixed" : "text-paper"}`}>
                {issues ? counts[s] : "–"}
              </span>
            </>
          );
          if (s === "Resolved") {
            return (
              <div key={s} className="px-4 py-3" title="Fixed issues are kept on file but taken off the board">
                {body}
              </div>
            );
          }
          const on = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(on ? "All" : s)}
              aria-pressed={on}
              className={`px-4 py-3 text-left transition-colors ${
                on ? "bg-panel shadow-[inset_0_-2px_0_var(--color-marigold)]" : "hover:bg-panel"
              }`}
            >
              {body}
            </button>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]" role="group" aria-label="Filter by category">
        {(["All", ...CATEGORIES] as const).map((c) => {
          const on = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={on}
              className={`flex h-10 shrink-0 items-center gap-1.5 border px-3 font-cond text-sm font-semibold uppercase tracking-[0.06em] transition-colors ${
                on ? "border-marigold bg-marigold text-ground" : "border-line-strong text-paper hover:border-dim"
              }`}
            >
              {c !== "All" && <CategoryIcon category={c} className="h-4 w-4" />}
              {c}
            </button>
          );
        })}
      </div>

      {/* Count + sort */}
      <div className="flex items-center justify-between gap-3 px-4 pb-3">
        <p className="label">
          {issues ? `${visible.length} issue${visible.length === 1 ? "" : "s"} on the board` : "Loading the board"}
        </p>
        <div className="flex border border-line-strong" role="group" aria-label="Sort">
          {SORTS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`h-9 px-3 font-cond text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                sort === value ? "bg-paper text-ground" : "text-dim hover:text-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="px-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <BoardSkeleton />
      ) : !lead ? (
        <div className="px-4">
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
                className="btn btn-secondary mt-5"
              >
                Clear filters
              </button>
            ) : (
              <Link href="/report" className="btn btn-primary mt-5">
                Report an issue
              </Link>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <LeadTicket issue={lead} changed={changed(lead.id, lead.status)} />
          {rest.length > 0 && (
            <div className="mt-5" ref={boardRef}>
              <BoardHeader />
              {rest.map((issue) => (
                <BoardRow key={issue.id} issue={issue} changed={changed(issue.id, issue.status)} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
