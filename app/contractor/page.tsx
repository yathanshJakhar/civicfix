"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import PageHeader from "@/components/PageHeader";
import ProgressUpdate from "@/components/ProgressUpdate";
import StatusTally, { countByStatus } from "@/components/StatusTally";
import { StatusStamp } from "@/components/Badges";
import { BoardSkeleton } from "@/components/IssueCard";
import { EmptyState, ErrorState } from "@/components/States";
import { useContractorIssues } from "@/lib/api";
import { homeFor, isContractor, useAuth } from "@/lib/auth";
import { STATUSES, type Issue, type Status } from "@/lib/types";
import { issueCode, timeAgo } from "@/lib/utils";

const STATUS_ORDER: Record<Status, number> = { Open: 0, "In Progress": 1, Resolved: 2 };

/** A contractor's work orders: everything departments have assigned to them. */
export default function ContractorPage() {
  const { user, loading: authLoading } = useAuth();
  const contractor = isContractor(user);
  const { issues, error, loading, reload } = useContractorIssues(contractor);
  const [filter, setFilter] = useState<Status | "All">("All");

  const counts = useMemo(() => countByStatus(issues), [issues]);
  const visible = useMemo(
    () =>
      (issues ?? [])
        .filter((i) => filter === "All" || i.status === filter)
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [issues, filter],
  );

  if (authLoading) {
    return (
      <>
        <PageHeader title="My jobs" />
        <div className="pt-4">
          <BoardSkeleton />
        </div>
      </>
    );
  }

  if (!contractor) {
    return (
      <>
        <PageHeader title="My jobs" />
        <div className="px-4 pt-5">
          <EmptyState title="Contractors only" message="This page lists work assigned to registered contractors.">
            <Link href={homeFor(user)} className="btn btn-primary mt-5">
              {user ? "Go to your home page" : "Log in"}
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const activeCount = counts ? counts.Open + counts["In Progress"] : null;

  return (
    <>
      <PageHeader title="My jobs" subtitle={`Contractor · ${user.name}`} />

      <div className="ticket mx-4 mt-4 grid grid-cols-[minmax(0,1fr)_5.75rem]">
        <div className="min-w-0 px-4 py-3.5">
          <p className="label">Work orders</p>
          <p className="mt-1.5 font-cond text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em] text-ink">{user.name}</p>
          <p className="mt-2 text-[13px] text-dim">Departments assign jobs to you. Post updates here as the work moves along.</p>
        </div>
        <div className="perf-y stub flex flex-col items-center justify-center gap-1 px-1">
          <span className="figure text-[2.5rem] font-bold leading-none text-saffron">{activeCount ?? "–"}</span>
          <span className="label">Active</span>
        </div>
      </div>

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
      ) : visible.length === 0 ? (
        <div className="px-4 pt-4">
          <EmptyState
            title={issues?.length ? "Nothing in this status" : "No jobs yet"}
            message={issues?.length ? undefined : "When a department assigns you a ticket, it appears here and you get an email."}
          />
        </div>
      ) : (
        <ul className="mt-4 border-t border-line-strong">
          {visible.map((issue) => (
            <JobRow key={issue.id} issue={issue} onChanged={reload} />
          ))}
        </ul>
      )}
    </>
  );
}

function JobRow({ issue, onChanged }: { issue: Issue; onChanged: () => Promise<void> }) {
  const mapUrl = `https://www.google.com/maps?q=${issue.lat},${issue.lng}`;
  return (
    <li className="border-b border-line-strong px-4 py-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <Link href={`/issue/${issue.id}`} className="min-w-0 hover:text-saffron">
          <span className="figure block text-xs text-dim">{issueCode(issue.id)}</span>
          <span className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{issue.title}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
            <CategoryIcon category={issue.category} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {issue.department} · assigned {timeAgo(issue.assignedAt ?? issue.createdAt)}
            </span>
          </span>
        </Link>
        <StatusStamp key={issue.status} status={issue.status} />
      </div>

      <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-cond text-sm font-bold uppercase tracking-[0.06em] text-saffron underline underline-offset-4">
        Directions
      </a>

      {issue.progressNote && (
        <p className="mt-2 border-l-2 border-line-strong pl-2.5 text-[13px] text-dim">
          <span className="label mr-1.5">Your last note</span>
          {issue.progressNote}
        </p>
      )}

      {issue.status !== "Resolved" && (
        <div className="mt-3">
          <ProgressUpdate issue={issue} onSaved={onChanged} />
        </div>
      )}
    </li>
  );
}
