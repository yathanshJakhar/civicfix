"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { ArrowUp, Bubble } from "@/components/IssueCard";
import { MiniMap } from "@/components/map";
import { EmptyState, ErrorState } from "@/components/States";
import { api } from "@/lib/api";
import { STATUSES, type Issue, type Status } from "@/lib/types";
import { STATUS_STYLES, getUpvoted, issueCode, markSeen, setUpvoted, timeAgo } from "@/lib/utils";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Clipboard API is unavailable on plain-HTTP LAN URLs; fall back to execCommand.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) throw new Error("copy failed");
  }
}

function TopBar({ onShare }: { onShare?: () => void }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-900 flex items-center justify-between border-b border-line bg-ground pt-[env(safe-area-inset-top)]">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="flex h-12 items-center gap-1 px-3 font-cond text-sm font-bold uppercase tracking-[0.08em] text-paper hover:bg-panel"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      {onShare && (
        <button
          onClick={onShare}
          className="flex h-12 items-center gap-1.5 border-l border-line px-4 font-cond text-sm font-bold uppercase tracking-[0.08em] text-marigold hover:bg-panel"
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" aria-hidden>
            <path d="M4 12v8h16v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </button>
      )}
    </div>
  );
}

export function IssueDetailSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-12 border-b border-line bg-ground" />
      <div className="aspect-video bg-panel" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 bg-raised" />
        <div className="h-6 w-5/6 bg-raised" />
        <div className="h-4 w-full bg-panel" />
        <div className="h-4 w-2/3 bg-panel" />
      </div>
    </div>
  );
}

function StatusTimeline({ status, createdAt }: { status: Status; createdAt: string }) {
  const current = STATUSES.indexOf(status);
  const steps = [
    { label: "Reported", hint: timeAgo(createdAt) },
    { label: "In Progress", hint: "Work started" },
    { label: "Resolved", hint: "Issue fixed" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-1">
      {steps.map((step, i) => {
        const done = i <= current;
        const now = i === current;
        return (
          <li key={step.label} className="min-w-0">
            <span className={`block h-1.5 ${done ? "bg-marigold" : "bg-line"}`} aria-hidden />
            <span className={`mt-2.5 flex items-center gap-1.5 font-cond text-sm font-bold uppercase tracking-[0.06em] ${done ? "text-paper" : "text-faint"}`}>
              {done && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-marigold" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="square" aria-hidden>
                  <path d="M5 12.5 10 17l9-10" />
                </svg>
              )}
              {step.label}
            </span>
            <span className={`mt-0.5 block text-[13px] ${now ? "text-marigold" : "text-faint"}`}>
              {done ? step.hint : "Pending"}
              {now && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function IssueDetail({ id }: { id: string }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [statusSaving, setStatusSaving] = useState<Status | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setNotFound(false);
    try {
      const loaded = await api.get(id);
      setIssue(loaded);
      // Opening an issue acknowledges its current status, which clears its highlight on the board.
      markSeen(loaded.id, loaded.status);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "Issue not found") setNotFound(true);
      else setError(msg || "Could not load this issue");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
    setHasUpvoted(getUpvoted().includes(id));
  }, [load, id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Tapping again removes the upvote. Ignore taps while a request is in flight so
  // fast double-taps can't send upvote/unvote out of order.
  const voting = useRef(false);

  async function toggleUpvote() {
    if (!issue || voting.current) return;
    voting.current = true;
    const next = !hasUpvoted;
    const delta = next ? 1 : -1;
    // Optimistic update — roll back if the request fails.
    setIssue({ ...issue, upvotes: Math.max(0, issue.upvotes + delta) });
    setHasUpvoted(next);
    try {
      const updated = await api.patch(issue.id, { action: next ? "upvote" : "unvote" });
      setUpvoted(issue.id, next);
      setIssue(updated);
    } catch {
      setIssue((cur) => (cur ? { ...cur, upvotes: Math.max(0, cur.upvotes - delta) } : cur));
      setHasUpvoted(!next);
      setToast(next ? "Couldn't upvote — try again" : "Couldn't remove upvote — try again");
    } finally {
      voting.current = false;
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = comment.trim();
    if (!issue || !text) return;
    setPosting(true);
    try {
      setIssue(await api.patch(issue.id, { action: "comment", text }));
      setComment("");
    } catch {
      setToast("Couldn't post comment");
    } finally {
      setPosting(false);
    }
  }

  async function changeStatus(status: Status) {
    if (!issue || issue.status === status) return;
    const previous = issue.status;
    setStatusSaving(status);
    setIssue({ ...issue, status });
    try {
      setIssue(await api.patch(issue.id, { action: "status", status }));
      setToast(status === "Resolved" ? "Resolved — removed from the feed and map" : `Status set to ${status}`);
    } catch {
      setIssue((cur) => (cur ? { ...cur, status: previous } : cur));
      setToast("Couldn't change status");
    } finally {
      setStatusSaving(null);
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      await copyText(url);
      setToast("Link copied to clipboard");
    } catch {
      setToast("Couldn't copy link");
    }
  }

  if (notFound) {
    return (
      <>
        <TopBar />
        <div className="px-4 py-8">
          <EmptyState title="Issue not found" message="It may have been removed, or the link is wrong.">
            <Link href="/" className="btn btn-primary mt-5">
              Back to the board
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <div className="p-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      </>
    );
  }

  if (!issue) return <IssueDetailSkeleton />;

  const sortedComments = [...issue.comments].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const sectionHead = "font-cond text-base font-bold uppercase tracking-[0.06em] text-paper";

  return (
    <>
      <TopBar onShare={share} />

      {/* Photo — only when one exists; no placeholder standing in for content. */}
      {issue.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user upload
        <img src={issue.imageUrl} alt={issue.title} className="max-h-[60vh] w-full border-b border-line bg-panel object-contain" />
      )}

      {/* The issue as a pass: header strip, title, segments, then the torn-off upvote stub. */}
      <section className="mx-4 mt-4 border border-line-strong bg-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <CategoryBadge category={issue.category} />
          <span className="figure text-[13px] text-dim">{issueCode(issue.id)}</span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <h1 className="text-2xl font-semibold leading-tight text-paper">{issue.title}</h1>
          {issue.description && (
            <p className="mt-2.5 max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-dim">{issue.description}</p>
          )}
          <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-3">
            <div className="pr-3">
              <dt className="label">Status</dt>
              <dd className="mt-1.5">
                <StatusBadge status={issue.status} />
              </dd>
            </div>
            <div className="px-3">
              <dt className="label">Reported</dt>
              <dd className="mt-1 text-[15px] font-medium text-paper">{timeAgo(issue.createdAt)}</dd>
            </div>
            <div className="pl-3">
              <dt className="label">Comments</dt>
              <dd className="figure mt-1 text-[15px] font-bold text-paper">{issue.comments.length}</dd>
            </div>
          </dl>
        </div>
        <div className="perf-x grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4">
          <div className="text-center">
            <span className="figure block text-[2.75rem] font-bold leading-none text-marigold">{issue.upvotes}</span>
            <span className="label mt-1 block">Upvotes</span>
          </div>
          <div>
            <button
              onClick={toggleUpvote}
              aria-pressed={hasUpvoted}
              className={`btn min-h-14 w-full text-lg ${
                hasUpvoted ? "border-marigold bg-changed text-marigold hover:bg-raised" : "btn-primary"
              }`}
            >
              <ArrowUp className="h-5 w-5" />
              {hasUpvoted ? "Upvoted" : "Upvote"}
            </button>
            {hasUpvoted && <p className="mt-1.5 text-center text-[13px] text-faint">Tap again to remove your upvote</p>}
          </div>
        </div>
      </section>

      <div className="space-y-6 px-4 pb-4 pt-6">
        {issue.status === "Resolved" && (
          <p className="flex items-start gap-2.5 border border-fixed px-4 py-3 text-sm text-paper">
            <span className="mt-1.5 h-2 w-2 shrink-0 bg-fixed" aria-hidden />
            <span>
              <span className="font-semibold text-fixed">Resolved.</span> This issue no longer appears in the feed or on the
              map. Set it back to Open or In Progress below to show it again.
            </span>
          </p>
        )}

        {/* Timeline */}
        <section>
          <h2 className={`${sectionHead} mb-3`}>Progress</h2>
          <StatusTimeline status={issue.status} createdAt={issue.createdAt} />
        </section>

        {/* Map */}
        <section className="border border-line-strong">
          <div className="h-44">
            <MiniMap issue={issue} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <span className="figure text-xs text-dim">
              {issue.lat.toFixed(5)}, {issue.lng.toFixed(5)}
            </span>
            <span className="flex gap-4 font-cond text-sm font-bold uppercase tracking-[0.06em]">
              {issue.status !== "Resolved" && (
                <Link href={`/map?issue=${issue.id}`} className="py-1.5 text-paper underline decoration-line-strong underline-offset-4 hover:decoration-marigold">
                  On the map
                </Link>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${issue.lat},${issue.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 text-marigold underline decoration-marigold/0 underline-offset-4 hover:decoration-marigold"
              >
                Directions
              </a>
            </span>
          </div>
        </section>

        {/* Comments */}
        <section>
          <h2 className={`${sectionHead} flex items-center gap-2`}>
            <Bubble className="h-4 w-4 text-dim" /> Comments <span className="figure text-dim">({issue.comments.length})</span>
          </h2>
          <form onSubmit={addComment} className="mt-3 flex">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Add an update or comment…"
              aria-label="Comment"
              className="field min-w-0 flex-1"
            />
            <button type="submit" disabled={posting || !comment.trim()} className="btn btn-primary -ml-px px-5">
              {posting ? "Posting…" : "Post"}
            </button>
          </form>
          {sortedComments.length === 0 ? (
            <p className="mt-3 border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
              No comments yet. Be the first to add an update.
            </p>
          ) : (
            <ul className="mt-3 border-t border-line">
              {sortedComments.map((c, i) => (
                <li key={`${c.at}-${i}`} className="border-b border-line py-3">
                  <p className="label">Citizen · {timeAgo(c.at)}</p>
                  <p className="mt-1 break-words text-[15px] leading-snug text-paper">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Admin demo control */}
        <section className="border border-dashed border-line-strong p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className={sectionHead}>Admin demo control</h2>
            <span className="border border-line-strong px-1.5 py-0.5 font-cond text-xs font-bold uppercase tracking-[0.1em] text-dim">
              Demo only
            </span>
          </div>
          <p className="mt-1 text-[13px] text-faint">Simulates a municipal officer updating the status.</p>
          <div className="mt-3 grid grid-cols-3 border border-line-strong" role="group" aria-label="Set status">
            {STATUSES.map((s, i) => {
              const active = issue.status === s;
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={statusSaving !== null}
                  aria-pressed={active}
                  className={`h-12 font-cond text-sm font-bold uppercase tracking-[0.06em] transition-colors ${i > 0 ? "border-l border-line-strong" : ""} ${
                    active ? STATUS_STYLES[s].solid : "text-dim hover:bg-panel hover:text-paper"
                  }`}
                >
                  {statusSaving === s ? "Saving…" : s}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-1100 mx-auto w-fit border border-line-strong bg-raised px-4 py-2.5 text-sm font-medium text-paper shadow-[0_8px_24px_rgb(0_0_0/0.45)]"
        >
          {toast}
        </div>
      )}
    </>
  );
}
