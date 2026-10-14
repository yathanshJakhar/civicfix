"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import CategoryIcon from "@/components/CategoryIcon";
import { ArrowUp, Bubble } from "@/components/IssueCard";
import { MiniMap } from "@/components/map";
import { ErrorState } from "@/components/States";
import { api } from "@/lib/api";
import { STATUSES, type Issue, type Status } from "@/lib/types";
import { STATUS_STYLES, getUpvoted, setUpvoted, timeAgo } from "@/lib/utils";

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
    <div className="sticky top-0 z-900 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="flex h-11 items-center gap-1 rounded-lg px-3 text-sm font-bold text-zinc-200 active:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      {onShare && (
        <button
          onClick={onShare}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-sm font-bold text-violet-300 active:bg-zinc-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </button>
      )}
    </div>
  );
}

export function IssueDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-14 border-b border-zinc-800 bg-zinc-950" />
      <div className="aspect-[4/3] bg-zinc-800" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-1/3 rounded bg-zinc-800" />
        <div className="h-6 w-5/6 rounded bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-2/3 rounded bg-zinc-800" />
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
    <ol className="flex items-start">
      {steps.map((step, i) => {
        const done = i <= current;
                return (
          <li key={step.label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${i <= current ? "bg-violet-500" : "bg-zinc-800"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-4 ring-zinc-900 ${
                done ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {done ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5 10 17l9-10" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={`mt-1.5 text-xs font-bold ${done ? "text-white" : "text-zinc-500"}`}>{step.label}</span>
            <span className="text-[11px] text-zinc-500">{done ? step.hint : "Pending"}</span>
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
      setIssue(await api.get(id));
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
        <div className="p-6 text-center">
          <p className="text-lg font-bold text-white">Issue not found</p>
          <p className="mt-1 text-sm text-zinc-400">It may have been removed, or the link is wrong.</p>
          <Link href="/" className="mt-4 inline-flex h-12 items-center rounded-xl bg-violet-600 px-6 text-sm font-bold text-white">
            Back to feed
          </Link>
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

  return (
    <>
      <TopBar onShare={share} />

      {/* Photo */}
      {issue.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user upload
        <img src={issue.imageUrl} alt={issue.title} className="max-h-[60vh] w-full bg-black object-contain" />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center border-b border-zinc-800 bg-zinc-900 text-zinc-600">
          <CategoryIcon category={issue.category} className="h-14 w-14" strokeWidth={1.4} />
          <span className="mt-2 text-xs font-semibold text-zinc-500">No photo provided</span>
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* Details */}
        <section>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={issue.category} />
            <StatusBadge status={issue.status} />
            <span className="ml-auto text-xs text-zinc-500">Reported {timeAgo(issue.createdAt)}</span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold leading-snug text-white">{issue.title}</h1>
          {issue.description && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{issue.description}</p>}
        </section>

        {issue.status === "Resolved" && (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <span className="font-bold">Resolved.</span> This issue no longer appears in the feed or on the map. Set
            it back to Open or In Progress below to show it again.
          </p>
        )}

        {/* Upvote */}
        <div>
          <button
            onClick={toggleUpvote}
            aria-pressed={hasUpvoted}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-extrabold transition active:scale-[0.99] ${
              hasUpvoted
                ? "border-2 border-violet-500 text-violet-300 hover:bg-violet-500/10"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            <ArrowUp className="h-5 w-5" />
            {hasUpvoted ? "Upvoted" : "Upvote"} · {issue.upvotes}
          </button>
          {hasUpvoted && <p className="mt-1.5 text-center text-xs text-zinc-500">Tap again to remove your upvote</p>}
        </div>

        {/* Timeline */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-bold text-zinc-200">Progress</h2>
          <StatusTimeline status={issue.status} createdAt={issue.createdAt} />
        </section>

        {/* Map */}
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="h-44">
            <MiniMap issue={issue} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-xs text-zinc-400">
              {issue.lat.toFixed(5)}, {issue.lng.toFixed(5)}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${issue.lat},${issue.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-bold text-violet-300"
            >
              Directions
            </a>
          </div>
        </section>

        {/* Comments */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-200">
            <Bubble className="h-4 w-4" /> Comments ({issue.comments.length})
          </h2>
          <form onSubmit={addComment} className="mt-3 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Add an update or comment…"
              className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-[15px] text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={posting || !comment.trim()}
              className="h-12 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white disabled:opacity-40"
            >
              {posting ? "…" : "Post"}
            </button>
          </form>
          {sortedComments.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
              No comments yet. Be the first to add an update.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sortedComments.map((c, i) => (
                <li key={`${c.at}-${i}`} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-bold text-violet-300">
                    C
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-zinc-800/70 px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold text-zinc-500">Citizen · {timeAgo(c.at)}</p>
                    <p className="mt-0.5 break-words text-sm text-zinc-100">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Admin demo control */}
        <section className="rounded-xl border-2 border-dashed border-zinc-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200">Admin demo control</h2>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Demo only
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">Simulates a municipal officer updating the status.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STATUSES.map((s) => {
              const active = issue.status === s;
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={statusSaving !== null}
                  className={`h-12 rounded-xl text-sm font-bold transition ${
                    active ? STATUS_STYLES[s].solid : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  } disabled:opacity-70`}
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
          className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-1100 mx-auto w-fit rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </>
  );
}
