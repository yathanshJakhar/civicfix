"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryIcon from "@/components/CategoryIcon";
import StatusTally, { countByStatus } from "@/components/StatusTally";
import { StatusStamp } from "@/components/Badges";
import { BoardSkeleton } from "@/components/IssueCard";
import { EmptyState, ErrorState } from "@/components/States";
import { useMyIssues } from "@/lib/api";
import { homeFor, isStaff, useAuth } from "@/lib/auth";
import { STATUSES, type Status } from "@/lib/types";
import { issueCode, timeAgo } from "@/lib/utils";

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const citizen = user?.role === "citizen";
  const { issues, error, loading, reload } = useMyIssues(citizen);
  const [status, setStatus] = useState<Status | "All">("All");

  const counts = useMemo(() => countByStatus(issues), [issues]);
  const visible = useMemo(
    () => (issues ?? []).filter((i) => status === "All" || i.status === status),
    [issues, status],
  );

  const header = (
    <PageHeader
      title="My tickets"
      subtitle={citizen && issues ? `${issues.length} reported by you` : "Issues you've reported"}
    />
  );

  if (authLoading) {
    return (
      <>
        {header}
        <div className="pt-4">
          <BoardSkeleton />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        {header}
        <div className="px-4 pt-5">
          <EmptyState title="Log in to see your tickets" message="Every issue you report while logged in is kept here, with its status.">
            <Link href="/login" className="btn btn-primary mt-5">
              Log in
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  if (!citizen) {
    return (
      <>
        {header}
        <div className="px-4 pt-5">
          <EmptyState
            title={isStaff(user) ? "Officers use the dashboard" : "Contractors use My jobs"}
            message={isStaff(user) ? "Your department's tickets are on the dashboard." : "Work assigned to you is listed on your jobs page."}
          >
            <Link href={homeFor(user)} className="btn btn-primary mt-5">
              {isStaff(user) ? "Open dashboard" : "Open my jobs"}
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <StatusTally counts={counts} active={status} onToggle={setStatus} filterable={STATUSES} />

      {error ? (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="pt-4">
          <BoardSkeleton />
        </div>
      ) : visible.length === 0 ? (
        <div className="px-4 pt-4">
          <EmptyState
            title={status === "All" ? "No tickets yet" : `Nothing ${status === "Resolved" ? "fixed" : status.toLowerCase()} yet`}
            message={status === "All" ? "Issues you report while logged in appear here, with their status." : undefined}
          >
            {status === "All" ? (
              <Link href="/report" className="btn btn-primary mt-5">
                Report an issue
              </Link>
            ) : (
              <button onClick={() => setStatus("All")} className="btn btn-secondary mt-5">
                Show all tickets
              </button>
            )}
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3 px-4 pt-4">
          {visible.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/issue/${issue.id}`}
                className="ticket grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:border-dim"
              >
                <span className="min-w-0">
                  <span className="figure block text-xs text-dim">{issueCode(issue.id)}</span>
                  <span className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{issue.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
                    <CategoryIcon category={issue.category} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {issue.department} · {timeAgo(issue.createdAt)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[13px] text-dim">
                    {issue.contractor ? (
                      <>
                        Contractor: <b className="text-ink">{issue.contractor.name}</b>
                      </>
                    ) : (
                      "Waiting for the department to assign a contractor"
                    )}
                  </span>
                </span>
                <StatusStamp status={issue.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
