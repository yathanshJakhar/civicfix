import Link from "next/link";
import type { Issue } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";
import { CategoryBadge, StatusBadge } from "./Badges";

export default function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-700 active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        {issue.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads, sizes unknown
          <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            <CategoryIcon category={issue.category} className="h-9 w-9" strokeWidth={1.6} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={issue.category} />
          <StatusBadge status={issue.status} />
        </div>
        <h2 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-white">{issue.title}</h2>
        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 font-bold text-violet-400">
            <ArrowUp /> {issue.upvotes}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bubble /> {issue.comments.length}
          </span>
          <span className="ml-auto">{timeAgo(issue.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ArrowUp({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function Bubble({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function IssueCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="h-24 w-24 rounded-lg bg-zinc-800" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="h-4 w-1/2 rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
        <div className="mt-auto h-3 w-1/3 rounded bg-zinc-800" />
      </div>
    </div>
  );
}
