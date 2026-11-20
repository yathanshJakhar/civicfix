"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import PageHeader from "@/components/PageHeader";
import StatusTally, { countByStatus } from "@/components/StatusTally";
import { StatusStamp } from "@/components/Badges";
import { BoardSkeleton } from "@/components/IssueCard";
import { IssuesMap } from "@/components/map";
import { ErrorState, EmptyState, StaffOnly } from "@/components/States";
import AssignContractor from "@/components/AssignContractor";
import { useAuthorityIssues } from "@/lib/api";
import { departmentLabel, isStaff, useAuth, type User } from "@/lib/auth";
import { STATUSES, isActive, type Issue, type Status } from "@/lib/types";
import { issueCode, timeAgo } from "@/lib/utils";

const STATUS_ORDER: Record<Status, number> = { Open: 0, "In Progress": 1, Resolved: 2 };

export default function AuthorityPage() {
  const { user, loading: authLoading } = useAuth();
  const staff = isStaff(user);
  const { issues, error, loading, reload } = useAuthorityIssues(staff);
  const [filter, setFilter] = useState<Status | "All">("All");

  const counts = useMemo(() => countByStatus(issues), [issues]);
  const active = useMemo(() => issues?.filter(isActive) ?? [], [issues]);
  const visible = useMemo(
    () =>
      (issues ?? [])
        .filter((i) => filter === "All" || i.status === filter)
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.upvotes - a.upvotes),
    [issues, filter],
  );

  if (authLoading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="pt-4">
          <BoardSkeleton />
        </div>
      </>
    );
  }

  if (!staff) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="px-4 pt-5">
          <StaffOnly signedIn={!!user} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Officer · ${user.name}`} />

      <DepartmentTicket user={user} openCount={counts ? counts.Open + counts["In Progress"] : null} />

      <div className="mt-4 border-t border-line-strong">
        <StatusTally counts={counts} active={filter} onToggle={setFilter} filterable={STATUSES} />
      </div>

      {error ? (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="pt-4">
          <BoardSkeleton />
        </div>
      ) : (
        <>
          {/* Only this department's active issues are on the map. */}
          <section className="px-4 pt-4" aria-label="Department map">
            <div className="ticket relative isolate h-72 overflow-hidden">
              <IssuesMap issues={active} mode="both" topInset={32} />
              {active.length === 0 && (
                <p className="absolute inset-x-3 bottom-3 z-800 ticket px-3 py-2.5 text-center text-sm text-dim">
                  No active issues in your department.
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="label">Bigger tag = more upvotes</span>
              <Link href="/map" className="font-cond text-sm font-bold uppercase tracking-[0.06em] text-saffron underline underline-offset-4">
                Full map
              </Link>
            </div>
          </section>

          <section className="pt-5" aria-label="Department issues">
            <h2 className="flex items-baseline justify-between gap-3 px-4 pb-2 font-cond text-base font-bold uppercase tracking-[0.06em] text-ink">
              {filter === "All" ? "All issues" : filter === "Resolved" ? "Fixed" : filter}
              <span className="label">{visible.length} shown</span>
            </h2>
            {visible.length === 0 ? (
              <div className="px-4">
                <EmptyState
                  title={issues?.length ? "Nothing in this status" : "No issues yet"}
                  message={issues?.length ? undefined : "Reports in your department's categories will appear here."}
                >
                  {filter !== "All" && (
                    <button onClick={() => setFilter("All")} className="btn btn-secondary mt-5">
                      Show all
                    </button>
                  )}
                </EmptyState>
              </div>
            ) : (
              <ul className="border-t border-line-strong">
                {visible.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onChanged={reload} canAssign={user.role === "authority"} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

/** The officer's department, issued as a ticket with its open count on the counterfoil. */
function DepartmentTicket({ user, openCount }: { user: User; openCount: number | null }) {
  return (
    <div className="ticket mx-4 mt-4 grid grid-cols-[minmax(0,1fr)_5.75rem]">
      <div className="min-w-0 px-4 py-3.5">
        <p className="label">Your department</p>
        <p className="mt-1.5 font-cond text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em] text-ink">
          {departmentLabel(user)}
        </p>
        <p className="mt-2 text-[13px] text-dim">
          {user.role === "admin" ? (
            <>
              Admin overview · view only. Departments assign their own tickets ·{" "}
              <Link href="/admin/contractors" className="text-saffron underline underline-offset-4">
                Approvals
              </Link>
            </>
          ) : (
            <>
              Only your department&apos;s tickets are shown. Assign each one to a contractor ·{" "}
              <Link href="/authority/contractors" className="text-saffron underline underline-offset-4">
                Your contractors
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="perf-y stub flex flex-col items-center justify-center gap-1 px-1">
        <span className="figure text-[2.5rem] font-bold leading-none text-saffron">{openCount ?? "–"}</span>
        <span className="label">Active</span>
      </div>
    </div>
  );
}

/**
 * One department ticket. The department assigns it; the contractor moves its status.
 * The admin sees the same row read-only.
 */
function IssueRow({ issue, onChanged, canAssign }: { issue: Issue; onChanged: () => Promise<void>; canAssign: boolean }) {
  return (
    <li className="border-b border-line-strong px-4 py-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <Link href={`/issue/${issue.id}`} className="min-w-0 hover:text-saffron">
          <span className="figure block text-xs text-dim">{issueCode(issue.id)}</span>
          <span className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{issue.title}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
            <CategoryIcon category={issue.category} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {issue.category} · {timeAgo(issue.createdAt)} · <span className="figure text-saffron">{issue.upvotes}</span>{" "}
              upvote{issue.upvotes === 1 ? "" : "s"}
            </span>
          </span>
        </Link>
        <StatusStamp key={issue.status} status={issue.status} />
      </div>

      {issue.progressNote && (
        <p className="mt-2 border-l-2 border-line-strong pl-2.5 text-[13px] text-dim">
          <span className="label mr-1.5">Latest update</span>
          {issue.progressNote}
        </p>
      )}

      {canAssign ? (
        <div className="mt-3">
          <AssignContractor issue={issue} onAssigned={onChanged} />
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-dim">
          {issue.department} ·{" "}
          {issue.contractor ? (
            <>
              Contractor: <b className="text-ink">{issue.contractor.name}</b>
            </>
          ) : (
            "not assigned yet"
          )}
        </p>
      )}
    </li>
  );
}
