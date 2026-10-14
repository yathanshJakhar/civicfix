"use client";

import { useMemo, useState } from "react";
import { IssuesMap } from "@/components/map";
import type { MapMode } from "@/components/map/IssuesMap";
import { useIssues } from "@/lib/api";
import { ACTIVE_STATUSES, isActive } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";

const MODES: { value: MapMode; label: string }[] = [
  { value: "markers", label: "Markers" },
  { value: "heatmap", label: "Heatmap" },
  { value: "both", label: "Both" },
];

export default function MapPage() {
  const { issues, error, loading, reload } = useIssues();
  const [mode, setMode] = useState<MapMode>("both");
  // Resolved issues are hidden from the map (markers and heatmap).
  const active = useMemo(() => issues?.filter(isActive) ?? null, [issues]);

  return (
    // Fill the space between the top of the screen and the bottom nav.
    <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] mx-auto max-w-lg bg-zinc-950">
      {active && <IssuesMap issues={active} mode={mode} />}

      {/* Floating header + toggle */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-800 space-y-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5">
          <div>
            <h1 className="text-base font-extrabold text-white">Issue map</h1>
            <p className="text-xs text-zinc-400">
              {active ? `${active.length} active issue${active.length === 1 ? "" : "s"} across Delhi NCR` : loading ? "Loading issues…" : "Couldn't load issues"}
            </p>
          </div>
          <div className="flex gap-2.5">
            {ACTIVE_STATUSES.map((s) => (
              <span key={s} className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />
                {s}
              </span>
            ))}
          </div>
        </div>
        <div
          className="pointer-events-auto flex rounded-xl border border-zinc-800 bg-zinc-950 p-1"
          role="radiogroup"
          aria-label="Map layers"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={`h-10 flex-1 rounded-lg text-sm font-bold transition ${
                mode === m.value ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex h-full animate-pulse items-center justify-center bg-zinc-900 text-sm font-semibold text-zinc-500">
          Loading map…
        </div>
      )}
      {error && (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-bold text-white">Couldn&apos;t load issues</p>
          <p className="text-sm text-zinc-400">{error}</p>
          <button onClick={reload} className="h-12 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white">
            Try again
          </button>
        </div>
      )}
      {active?.length === 0 && (
        <div className="absolute inset-x-3 bottom-3 z-800 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-sm text-zinc-300">
          No active issues right now. New reports will show up here.
        </div>
      )}
    </div>
  );
}
