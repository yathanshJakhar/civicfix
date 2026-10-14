"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Issue } from "@/lib/types";
import { StatusBadge } from "@/components/Badges";
import { DELHI_CENTER } from "@/lib/utils";
import { issueIcon } from "./icons";
import { TILE_ATTRIBUTION, TILE_CLASS, TILE_URL } from "./tiles";
import { useFreshMapKey } from "./useFreshMapKey";

export type MapMode = "markers" | "heatmap" | "both";

function HeatLayer({ issues }: { issues: Issue[] }) {
  const map = useMap();

  useEffect(() => {
    let layer: L.Layer | null = null;
    let cancelled = false;

    (async () => {
      // leaflet.heat is a plugin that attaches itself to the global `L`.
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.heat");
      if (cancelled) return;
      const points = issues.map((i) => [i.lat, i.lng, 0.5 + i.upvotes * 0.1] as L.HeatLatLngTuple);
      layer = L.heatLayer(points, {
        radius: 30,
        blur: 22,
        max: 2,
        minOpacity: 0.35,
        gradient: { 0.2: "#4c1d95", 0.45: "#7c3aed", 0.7: "#c084fc", 0.9: "#f0abfc", 1: "#ffffff" },
      }).addTo(map);
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, issues]);

  return null;
}

export default function IssuesMap({ issues, mode }: { issues: Issue[]; mode: MapMode }) {
  const mapKey = useFreshMapKey();
  if (mapKey === null) return <div className="h-full w-full bg-zinc-900" />;

  return (
    <MapContainer key={mapKey} center={DELHI_CENTER} zoom={11} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution={TILE_ATTRIBUTION}
        url={TILE_URL}
        className={TILE_CLASS}
      />
      {mode !== "markers" && <HeatLayer issues={issues} />}
      {mode !== "heatmap" &&
        issues.map((issue) => (
          <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={issueIcon(issue.category, issue.status)}>
            <Popup>
              <div className="w-52 space-y-2">
                <p className="text-sm font-bold leading-snug text-white">{issue.title}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={issue.status} />
                  <span className="text-xs font-semibold text-zinc-400">{issue.upvotes} upvotes</span>
                </div>
                <Link
                  href={`/issue/${issue.id}`}
                  className="block rounded-lg bg-violet-600 py-2.5 text-center text-sm font-bold text-white!"
                >
                  View issue
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
