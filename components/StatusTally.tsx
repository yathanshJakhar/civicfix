import { STATUSES, type Status } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";

/**
 * Three-segment count strip (Open / In Progress / Resolved), matching the board's tally.
 * Segments listed in `filterable` act as toggles; the rest are counts only.
 */
export default function StatusTally({
  counts,
  active = "All",
  onToggle,
  filterable = [],
}: {
  counts: Record<Status, number> | null;
  active?: Status | "All";
  onToggle?: (s: Status | "All") => void;
  filterable?: readonly Status[];
}) {
  return (
    <div className="grid grid-cols-3 divide-x divide-line-strong border-b border-line-strong">
      {STATUSES.map((s) => {
        const body = (
          <>
            <span className="label flex items-center gap-1.5">
              <span className={`h-2 w-2 ${STATUS_STYLES[s].mark}`} aria-hidden />
              {s === "Resolved" ? "Fixed" : s}
            </span>
            <span className={`figure mt-1.5 block text-[1.75rem] font-bold leading-none ${s === "Resolved" ? "text-fixed" : "text-ink"}`}>
              {counts ? counts[s] : "–"}
            </span>
          </>
        );
        if (!onToggle || !filterable.includes(s)) {
          return (
            <div key={s} className="px-4 py-3">
              {body}
            </div>
          );
        }
        const on = active === s;
        return (
          <button
            key={s}
            onClick={() => onToggle(on ? "All" : s)}
            aria-pressed={on}
            className={`px-4 py-3 text-left transition-colors ${
              on ? "bg-panel shadow-[inset_0_-3px_0_var(--color-marigold)]" : "hover:bg-raised"
            }`}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

export function countByStatus(issues: { status: Status }[] | null): Record<Status, number> | null {
  if (!issues) return null;
  const c: Record<Status, number> = { Open: 0, "In Progress": 0, Resolved: 0 };
  issues.forEach((i) => c[i.status]++);
  return c;
}
