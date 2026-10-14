"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so every map is loaded client-side only.
function MapLoading() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-zinc-900 text-sm font-semibold text-zinc-500">
      Loading map…
    </div>
  );
}

export const IssuesMap = dynamic(() => import("./IssuesMap"), { ssr: false, loading: MapLoading });
export const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false, loading: MapLoading });
export const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false, loading: MapLoading });
