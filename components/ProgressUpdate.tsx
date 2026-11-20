"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Issue } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";

const CHOICES = ["In Progress", "Resolved"] as const;

/** The contractor's control: post a progress note and move the job to In Progress or Resolved. */
export default function ProgressUpdate({ issue, onSaved }: { issue: Issue; onSaved: (i: Issue) => void | Promise<void> }) {
  const [status, setStatus] = useState<(typeof CHOICES)[number]>(issue.status === "Resolved" ? "Resolved" : "In Progress");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const unchanged = status === issue.status && !note.trim();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (unchanged) return;
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      const updated = await api.patch(issue.id, { action: "progress", status, note: note.trim() || undefined });
      setNote("");
      setDone(true);
      await onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 border border-line-strong bg-panel" role="group" aria-label="Job status">
        {CHOICES.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`h-11 font-cond text-[13px] font-bold uppercase tracking-[0.06em] transition-colors ${
              i > 0 ? "border-l border-line-strong" : ""
            } ${status === s ? STATUS_STYLES[s].solid : "text-dim hover:bg-raised hover:text-ink"}`}
          >
            {s === "Resolved" ? "Work done" : s}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Progress note for the citizen and department (optional)"
        className="field min-h-0 resize-y py-2.5"
      />
      {error && <p className="text-sm text-open" role="alert">{error}</p>}
      {done && !error && <p className="text-sm text-dim">Saved. The citizen and department have been emailed.</p>}
      <button type="submit" disabled={saving || unchanged} className="btn btn-primary w-full">
        {saving ? "Saving…" : "Post update"}
      </button>
    </form>
  );
}
