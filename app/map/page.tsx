"use client";

import { useEffect, useMemo, useState } from "react";
import { IssuesMap } from "@/components/map";
import type { MapMode } from "@/components/map/IssuesMap";
import PageHeader from "@/components/PageHeader";
import { StaffOnly } from "@/components/States";
import { useAuthorityIssues } from "@/lib/api";
import { departmentLabel, isStaff, useAuth } from "@/lib/auth";
import { ACTIVE_STATUSES, isActive } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";

const MODES: { value: MapMode; label: string }[] = [
  { value: "markers", label: "Markers" },
  { value: "heatmap", label: "Heatmap" },
  { value: "both", label: "Both" },
];

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const staff = isStaff(user);
  // Officers see only their department's issues; the admin sees all of them.
  const { issues, error, loading, reload } = useAuthorityIssues(staff);
  const [mode, setMode] = useState<MapMode>("both");
  const [focusId, setFocusId] = useState<string | null>(null);
  // Resolved issues are hidden from the map (markers and heatmap).
  const active = useMemo(() => issues?.filter(isActive) ?? null, [issues]);

  // A ticket's "on the map" link opens /map?issue=<id>, centred on that pin.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once on mount
    setFocusId(new URLSearchParams(window.location.search).get("issue"));
  }, []);

  if (!authLoading && !staff) {
    return (
      <>
        <PageHeader title="Issue map" />
        <div className="px-4 pt-5">
          <StaffOnly signedIn={!!user} />
        </div>
      </>
    );
  }

  return (
    // Fill the space between the top of the screen and the bottom nav.
    <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] mx-auto max-w-lg manila sm:border-x sm:border-line-strong">
      {active && <IssuesMap issues={active} mode={mode} focusId={focusId} />}

      {/* Board header over the map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-800 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto ticket">
          <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-3">
            <div className="min-w-0">
              <h1 className="font-cond text-2xl font-bold uppercase leading-none tracking-[0.02em] text-ink">Issue map</h1>
              <p className="mt-1.5 text-sm text-dim">
                {active ? (
                  <>
                    <span className="figure text-saffron">{active.length}</span> active issue{active.length === 1 ? "" : "s"} ·{" "}
                    {staff ? departmentLabel(user) : "Delhi NCR"}
                  </>
                ) : loading ? (
                  "Loading issues…"
                ) : (
                  "Couldn't load issues"
                )}
              </p>
            </div>
            <ul className="shrink-0 space-y-1">
              {ACTIVE_STATUSES.map((s) => (
                <li key={s} className="label flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 ${STATUS_STYLES[s].mark}`} aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-3 border-t border-line" role="radiogroup" aria-label="Map layers">
            {MODES.map((m, i) => (
              <button
                key={m.value}
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => setMode(m.value)}
                className={`h-11 font-cond text-sm font-bold uppercase tracking-[0.08em] transition-colors ${
                  i > 0 ? "border-l border-line" : ""
                } ${mode === m.value ? "bg-marigold text-ink" : "text-dim hover:bg-panel hover:text-ink"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {mode !== "heatmap" && active && active.length > 0 && (
          <p className="label mt-2 inline-block ticket px-2.5 py-1.5">Bigger tag = more upvotes</p>
        )}
      </div>

      {(loading || authLoading) && (
        <div className="flex h-full animate-pulse items-center justify-center bg-panel font-cond text-sm font-semibold uppercase tracking-[0.12em] text-faint">
          Loading map…
        </div>
      )}
      {error && (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-cond text-xl font-bold uppercase tracking-[0.04em] text-open">Couldn&apos;t load issues</p>
          <p className="text-sm text-dim">{error}</p>
          <button onClick={reload} className="btn btn-primary">
            Try again
          </button>
        </div>
      )}
      {active?.length === 0 && (
        <div className="absolute inset-x-3 bottom-3 z-800 ticket p-4 text-center text-sm text-dim">
          No active issues right now. New reports will show up here.
        </div>
      )}
    </div>
  );
}
