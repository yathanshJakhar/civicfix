"use client";

import { useEffect, useState } from "react";
import { api, contractorsForIssue, type ContractorOption } from "@/lib/api";
import type { Issue } from "@/lib/types";

/**
 * The department's only action on a ticket: hand it to a contractor who covers that area.
 * Shows each eligible contractor's distance and how many projects they're working on now.
 * Once assigned, progress belongs to the contractor; the department can reassign if needed.
 */
export default function AssignContractor({ issue, onAssigned }: { issue: Issue; onAssigned: (i: Issue) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ContractorOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    if (!open || options) return;
    contractorsForIssue(issue.id)
      .then(setOptions)
      .catch((e: Error) => setError(e.message));
  }, [open, options, issue.id]);

  async function assign(id: number) {
    setSaving(id);
    setError(null);
    try {
      const updated = await api.patch(issue.id, { action: "assign", contractorId: id });
      setOpen(false);
      setOptions(null); // workloads changed; reload next time
      await onAssigned(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  if (issue.status === "Resolved") {
    return issue.contractor ? (
      <p className="text-[13px] text-dim">
        Fixed by <b className="text-ink">{issue.contractor.name}</b>
      </p>
    ) : null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border border-line-strong bg-panel px-3 py-2.5">
        <p className="min-w-0 text-[13px] leading-snug">
          {issue.contractor ? (
            <>
              <span className="label block">Contractor</span>
              <b className="text-ink">{issue.contractor.name}</b>
              {issue.contractor.phone && <span className="text-dim"> · {issue.contractor.phone}</span>}
            </>
          ) : (
            <span className="text-dim">Not assigned yet</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`btn shrink-0 px-3 text-sm ${issue.contractor ? "btn-secondary" : "btn-primary"}`}
        >
          {open ? "Close" : issue.contractor ? "Reassign" : "Assign contractor"}
        </button>
      </div>

      {open && (
        <div className="border-x border-b border-line-strong bg-panel">
          {error ? (
            <p className="px-3 py-3 text-sm text-open" role="alert">{error}</p>
          ) : !options ? (
            <p className="px-3 py-3 text-sm text-dim">Finding contractors near this ticket…</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-dim">
              No contractor for this department covers this location. Ask the admin to add one.
            </p>
          ) : (
            <ul>
              {options.map((c) => {
                const current = c.id === issue.contractor?.id;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5 first:border-t-0">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
                      <p className="text-[13px] text-dim">
                        <span className="figure">{c.distanceKm}</span> km away ·{" "}
                        <span className={`figure ${c.activeCount >= 5 ? "text-open" : "text-saffron"}`}>{c.activeCount}</span>{" "}
                        active project{c.activeCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => assign(c.id)}
                      disabled={saving !== null || current}
                      className="btn btn-secondary shrink-0 px-3 text-sm"
                    >
                      {current ? "Assigned" : saving === c.id ? "Assigning…" : "Assign"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
