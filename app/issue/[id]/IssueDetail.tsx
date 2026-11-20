"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryBadge, StatusStamp } from "@/components/Badges";
import CategoryPicker from "@/components/CategoryPicker";
import { ArrowUp, Bubble } from "@/components/IssueCard";
import { MiniMap } from "@/components/map";
import { EmptyState, ErrorState } from "@/components/States";
import { prettyLabel } from "@/lib/aiMap";
import { api } from "@/lib/api";
import AssignContractor from "@/components/AssignContractor";
import ProgressUpdate from "@/components/ProgressUpdate";
import { isContractor, useAuth } from "@/lib/auth";
import { ownsDepartment, runsDepartment } from "@/lib/departments";
import { STATUSES, type Category, type Issue, type Status } from "@/lib/types";
import { getUpvoted, issueCode, markSeen, setUpvoted, timeAgo } from "@/lib/utils";

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
    <div className="sticky top-0 z-900 flex items-center justify-between border-b border-line-strong manila pt-[env(safe-area-inset-top)]">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="flex h-12 items-center gap-1 px-3 font-cond text-sm font-bold uppercase tracking-[0.08em] text-ink hover:bg-panel"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      {onShare && (
        <button
          onClick={onShare}
          className="flex h-12 items-center gap-1.5 border-l border-line px-4 font-cond text-sm font-bold uppercase tracking-[0.08em] text-saffron hover:bg-panel"
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
      <div className="h-12 border-b border-line-strong manila" />
      <div className="aspect-video bg-raised" />
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
            <span className={`mt-2.5 flex items-center gap-1.5 font-cond text-sm font-bold uppercase tracking-[0.06em] ${done ? "text-ink" : "text-faint"}`}>
              {done && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-saffron" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="square" aria-hidden>
                  <path d="M5 12.5 10 17l9-10" />
                </svg>
              )}
              {step.label}
            </span>
            <span className={`mt-0.5 block text-[13px] ${now ? "text-saffron" : "text-faint"}`}>
              {done ? step.hint : "Pending"}
              {now && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const LOW_CONFIDENCE = 0.6;

/** Shows where the ticket's category came from (AI or a person) and lets anyone correct it. */
function CategoryCheck({
  issue,
  saving,
  onChange,
  canEdit,
}: {
  issue: Issue;
  saving: boolean;
  onChange: (c: Category) => Promise<boolean>;
  /** Guests can see where the category came from but not change it. */
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ai = issue.ai;
  const pct = ai ? Math.round(ai.confidence * 100) : 0;
  const byAi = ai && issue.categorySource !== "user" && ai.category === issue.category;

  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 text-[13px] leading-snug">
          {byAi ? (
            <>
              <p className="font-cond text-sm font-bold uppercase tracking-[0.06em] text-saffron">AI classified</p>
              <p className="mt-0.5 text-dim">
                Detected <span className="text-ink">{prettyLabel(ai.label)}</span> ·{" "}
                <span className="figure text-ink">{pct}%</span> confidence
              </p>
              {ai.confidence < LOW_CONFIDENCE && (
                <p className="mt-0.5 font-medium text-saffron">Low confidence — please check the category.</p>
              )}
            </>
          ) : ai ? (
            <>
              <p className="font-cond text-sm font-bold uppercase tracking-[0.06em] text-ink">Category corrected</p>
              <p className="mt-0.5 text-dim">
                AI suggested <span className="text-ink">{ai.category}</span> ({prettyLabel(ai.label)} ·{" "}
                <span className="figure">{pct}%</span>)
              </p>
            </>
          ) : (
            <p className="font-cond text-sm font-bold uppercase tracking-[0.06em] text-dim">Category chosen by reporter</p>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="btn btn-secondary min-h-10 shrink-0 self-start px-3 py-1.5 text-sm"
          >
            {editing ? "Cancel" : byAi ? "Not right? Change" : "Change category"}
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-3">
          <CategoryPicker
            value={issue.category}
            disabled={saving}
            onChange={async (c) => {
              if (await onChange(c)) setEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function IssueDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Motion plays only for changes made here, never on first load.
  const [stampFresh, setStampFresh] = useState(false);
  const [punchFresh, setPunchFresh] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setNotFound(false);
    try {
      const loaded = await api.get(id);
      setIssue(loaded);
      // Opening an issue acknowledges its current status, which clears its "changed" highlight.
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
    setPunchFresh(next);
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

  /** After the department assigns or the contractor posts progress. */
  function workUpdated(updated: Issue) {
    if (issue && updated.status !== issue.status) setStampFresh(true);
    setIssue(updated);
    markSeen(updated.id, updated.status);
  }

  /** Returns true when saved, so the picker can close. */
  async function changeCategory(category: Category): Promise<boolean> {
    if (!issue) return false;
    if (issue.category === category) return true;
    const previous = { category: issue.category, categorySource: issue.categorySource };
    setCategorySaving(true);
    setIssue({ ...issue, category, categorySource: "user" });
    try {
      setIssue(await api.patch(issue.id, { action: "category", category }));
      setToast(`Category changed to ${category}`);
      return true;
    } catch {
      setIssue((cur) => (cur ? { ...cur, ...previous } : cur));
      setToast("Couldn't change category");
      return false;
    } finally {
      setCategorySaving(false);
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
              Back
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
  // The owning department's officers assign (not the admin); only the assigned contractor moves progress.
  const canView = !!user && ownsDepartment(user, issue.department);
  const isDept = !!user && runsDepartment(user, issue.department);
  const isAssignedContractor = isContractor(user) && !!issue.contractor;
  const sectionHead = "font-cond text-base font-bold uppercase tracking-[0.06em] text-ink";

  return (
    <>
      <TopBar onShare={share} />

      {/* Photo — only when one exists; no placeholder standing in for content. */}
      {issue.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user upload
        <img src={issue.imageUrl} alt={issue.title} className="max-h-[60vh] w-full border-b border-line-strong bg-raised object-contain" />
      )}

      {/* The issue as a pass: header strip, title, segments, then the torn-off upvote stub. */}
      <section className="ticket mx-4 mt-4">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <CategoryBadge category={issue.category} />
          <span className="figure text-[13px] text-dim">{issueCode(issue.id)}</span>
        </div>
        <CategoryCheck issue={issue} saving={categorySaving} onChange={changeCategory} canEdit={isDept} />
        <div className="px-4 pb-4 pt-3">
          <h1 className="text-2xl font-semibold leading-tight text-ink">{issue.title}</h1>
          {issue.description && (
            <p className="mt-2.5 max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-dim">{issue.description}</p>
          )}
          <dl className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] divide-x divide-line border-t border-line pt-3">
            <div className="pr-3">
              <dt className="label">Status</dt>
              <dd className="mt-2">
                <StatusStamp key={issue.status} status={issue.status} fresh={stampFresh} />
              </dd>
            </div>
            <div className="px-3">
              <dt className="label">Reported</dt>
              <dd className="mt-1 text-[15px] font-medium text-ink">{timeAgo(issue.createdAt)}</dd>
            </div>
            <div className="pl-3">
              <dt className="label">Comments</dt>
              <dd className="figure mt-1 text-[15px] font-bold text-ink">{issue.comments.length}</dd>
            </div>
          </dl>
        </div>
        <div className="perf-x stub relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4">
          {/* The conductor's punch: backing an issue punches this device's ticket. */}
          {hasUpvoted && (
            <span className="absolute left-2.5 top-2.5">
              <span className={`punch ${punchFresh ? "punch-fresh" : ""}`} aria-hidden />
            </span>
          )}
          <div className="text-center">
            <span className="figure block text-[2.75rem] font-bold leading-none text-saffron">{issue.upvotes}</span>
            <span className="label mt-1 block">Upvotes</span>
          </div>
          {!user ? (
            // Guests can only view: backing an issue needs an account.
            <div>
              <Link href="/login" className="btn btn-primary min-h-14 w-full text-lg">
                <ArrowUp className="h-5 w-5" />
                Log in to upvote
              </Link>
            </div>
          ) : (
            <div>
              <button
                onClick={toggleUpvote}
                aria-pressed={hasUpvoted}
                className={`btn min-h-14 w-full text-lg ${
                  hasUpvoted ? "border-saffron bg-panel text-saffron hover:bg-raised" : "btn-primary"
                }`}
              >
                <ArrowUp className="h-5 w-5" />
                {hasUpvoted ? "Upvoted" : "Upvote"}
              </button>
              {hasUpvoted && <p className="mt-1.5 text-center text-[13px] text-faint">Tap again to remove your upvote</p>}
            </div>
          )}
        </div>
      </section>

      <div className="space-y-6 px-4 pb-4 pt-6">
        {issue.status === "Resolved" && (
          <p className="flex items-start gap-2.5 border border-fixed px-4 py-3 text-sm text-ink">
            <span className="mt-1.5 h-2 w-2 shrink-0 bg-fixed" aria-hidden />
            <span>
              <span className="font-semibold text-fixed">Resolved</span>
              {issue.contractor ? <> by {issue.contractor.name}.</> : "."} It no longer appears on the department map.
            </span>
          </p>
        )}

        {/* Timeline */}
        <section>
          <h2 className={`${sectionHead} mb-3`}>Progress</h2>
          <StatusTimeline status={issue.status} createdAt={issue.createdAt} />
        </section>

        {/* Map */}
        <section className="ticket">
          <div className="h-44">
            <MiniMap issue={issue} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <span className="figure text-xs text-dim">
              {issue.lat.toFixed(5)}, {issue.lng.toFixed(5)}
            </span>
            <span className="flex gap-4 font-cond text-sm font-bold uppercase tracking-[0.06em]">
              {canView && issue.status !== "Resolved" && (
                <Link href={`/map?issue=${issue.id}`} className="py-1.5 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-saffron">
                  On the map
                </Link>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${issue.lat},${issue.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 text-saffron underline decoration-saffron/0 underline-offset-4 hover:decoration-saffron"
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
          {!user ? (
            <p className="mt-3 border border-line-strong bg-panel px-4 py-3 text-sm text-dim">
              <Link href="/login" className="font-semibold text-saffron underline underline-offset-4">
                Log in
              </Link>{" "}
              to add an update or comment.
            </p>
          ) : (
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
          )}
          {sortedComments.length === 0 ? (
            <p className="mt-3 border border-dashed border-line-strong px-4 py-6 text-center text-sm text-faint">
              No comments yet.
            </p>
          ) : (
            <ul className="mt-3 border-t border-line">
              {sortedComments.map((c, i) => (
                <li key={`${c.at}-${i}`} className="border-b border-line py-3">
                  <p className="label">Citizen · {timeAgo(c.at)}</p>
                  <p className="mt-1 break-words text-[15px] leading-snug text-ink">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Who owns the work: the department routes it, the contractor does it. */}
        <section className="ticket p-4">
          <h2 className={sectionHead}>Work order</h2>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[15px]">
            <dt className="label pt-0.5">Department</dt>
            <dd className="text-ink">{issue.department}</dd>
            <dt className="label pt-0.5">Contractor</dt>
            <dd className="text-ink">
              {issue.contractor ? (
                <>
                  {issue.contractor.name}
                  {issue.contractor.phone && <span className="text-dim"> · {issue.contractor.phone}</span>}
                </>
              ) : (
                <span className="text-dim">Not assigned yet</span>
              )}
            </dd>
          </dl>
          {issue.progressNote && (
            <p className="mt-3 border-l-2 border-line-strong pl-2.5 text-sm text-dim">
              <span className="label mr-1.5">Latest update</span>
              {issue.progressNote}
            </p>
          )}

          {isDept && (
            <div className="mt-4">
              <AssignContractor issue={issue} onAssigned={workUpdated} />
              <p className="mt-2 text-[13px] text-faint">Progress is updated by the contractor, not the department.</p>
            </div>
          )}
          {user?.role === "admin" && (
            <p className="mt-3 text-[13px] text-faint">Admin view: the department assigns contractors to its own tickets.</p>
          )}

          {isAssignedContractor && issue.status !== "Resolved" && (
            <div className="mt-4">
              <ProgressUpdate issue={issue} onSaved={workUpdated} />
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-1100 mx-auto w-fit border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-panel shadow-[0_6px_18px_-4px_rgb(60_40_12/0.45)]"
        >
          {toast}
        </div>
      )}
    </>
  );
}
