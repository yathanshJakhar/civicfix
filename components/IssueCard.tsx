import Link from "next/link";
import type { Issue } from "@/lib/types";
import { issueCode, timeAgo } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";
import { CategoryBadge, ChangedChip, StatusBadge, StatusStamp } from "./Badges";

/** The column grid shared by the board header and every row. */
export const BOARD_COLS = "grid grid-cols-[3rem_minmax(0,1fr)_6rem] sm:grid-cols-[3.5rem_minmax(0,1fr)_7.5rem] items-center gap-x-2.5 sm:gap-x-3 px-4";

export function BoardHeader() {
  return (
    <div className={`${BOARD_COLS} h-9 border-y border-line-strong`} aria-hidden>
      <span className="label tracking-[0.04em]">Upvotes</span>
      <span className="label">Issue</span>
      <span className="label text-right">Status</span>
    </div>
  );
}

/** One issue as a ranked row on the board. */
export function BoardRow({ issue, changed }: { issue: Issue; changed: boolean }) {
  return (
    <Link
      href={`/issue/${issue.id}`}
      data-flip={issue.id}
      className={`${BOARD_COLS} min-h-18 border-b border-line py-3 transition-colors ${
        changed ? "bg-changed hover:bg-[#f4d79c]" : "hover:bg-raised"
      }`}
    >
      <span className="figure text-[1.375rem] font-bold leading-none text-saffron">{issue.upvotes}</span>
      <span className="min-w-0">
        <span className="line-clamp-3 text-[15px] font-medium leading-snug text-ink">{issue.title}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
          <CategoryIcon category={issue.category} className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {issue.category} · {timeAgo(issue.createdAt)}
          </span>
        </span>
      </span>
      <span className="flex justify-end text-right">
        {changed ? <ChangedChip status={issue.status} /> : <StatusBadge status={issue.status} nowrap />}
      </span>
    </Link>
  );
}

/** The issue leading the board, issued as a ticket: segments on the left, upvote stub on the right. */
export function LeadTicket({ issue, changed, upvoted = false }: { issue: Issue; changed: boolean; upvoted?: boolean }) {
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="ticket group mx-4 block transition-[border-color,box-shadow] hover:border-dim hover:shadow-[0_1px_0_rgb(92_66_28/0.1),0_6px_14px_-4px_rgb(92_66_28/0.32)]"
    >
      {issue.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads, sizes unknown
        <img src={issue.imageUrl} alt="" className="h-36 w-full border-b border-line-strong object-cover" loading="lazy" />
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_5.75rem]">
        <div className="min-w-0 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
            <CategoryBadge category={issue.category} />
            {changed ? <ChangedChip status={issue.status} /> : <span className="figure text-[13px] text-dim">{issueCode(issue.id)}</span>}
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-tight text-ink">{issue.title}</h2>
          <dl className="mt-4 grid grid-cols-2 border-t border-line pt-3 sm:grid-cols-3">
            <div className="pr-3">
              <dt className="label">Status</dt>
              <dd className="mt-1.5">
                <StatusStamp status={issue.status} />
              </dd>
            </div>
            <div className="border-l border-line pl-3 sm:px-3">
              <dt className="label">Reported</dt>
              <dd className="mt-1 text-[15px] font-medium text-ink">{timeAgo(issue.createdAt)}</dd>
            </div>
            {/* At phone width the stub leaves no room for a third segment; comments show on the issue pass. */}
            <div className="hidden border-l border-line pl-3 sm:block">
              <dt className="label">Comments</dt>
              <dd className="figure mt-1 text-[15px] font-bold text-ink">{issue.comments.length}</dd>
            </div>
          </dl>
        </div>
        <div className="perf-y stub relative flex flex-col items-center justify-center gap-1 px-1">
          {upvoted && (
            <span className="absolute right-2.5 top-2.5">
              <span className="punch" aria-hidden />
              <span className="sr-only">You upvoted this</span>
            </span>
          )}
          <span className="figure text-[2.5rem] font-bold leading-none text-saffron">{issue.upvotes}</span>
          <span className="label">Upvotes</span>
        </div>
      </div>
    </Link>
  );
}

export function ArrowUp({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden>
      <path d="M12 20V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function Bubble({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="miter" aria-hidden>
      <path d="M4 4h16v12H9l-5 4V4Z" />
    </svg>
  );
}

export function BoardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="ticket mx-4 h-44" />
      <div className="mt-5 h-9 border-y border-line-strong" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${BOARD_COLS} h-18 border-b border-line`}>
          <span className="h-5 w-8 bg-raised" />
          <span className="space-y-2">
            <span className="block h-3.5 w-5/6 bg-raised" />
            <span className="block h-3 w-1/2 bg-panel" />
          </span>
          <span className="ml-auto h-3.5 w-16 bg-raised" />
        </div>
      ))}
    </div>
  );
}
