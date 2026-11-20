"use client";

import { useEffect, useRef } from "react";
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
        gradient: { 0.2: "#f2c46d", 0.45: "#e8922c", 0.7: "#c4531c", 0.9: "#9c2714", 1: "#6e140a" },
      }).addTo(map);
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, issues]);

  return null;
}

/** Centres on one issue and opens its popup when the map is opened from a ticket. */
function FocusIssue({ issue, markers }: { issue: Issue | undefined; markers: React.RefObject<Map<string, L.Marker>> }) {
  const map = useMap();
  useEffect(() => {
    if (!issue) return;
    map.setView([issue.lat, issue.lng], 16);
    const t = setTimeout(() => markers.current.get(issue.id)?.openPopup(), 300);
    return () => clearTimeout(t);
  }, [map, issue, markers]);
  return null;
}

/** Without a focused issue, frame every active issue so the first view shows the pins. */
function FitIssues({ issues, skip, topInset }: { issues: Issue[]; skip: boolean; topInset: number }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (skip || fitted.current || issues.length === 0) return;
    fitted.current = true;
    if (issues.length === 1) map.setView([issues[0].lat, issues[0].lng], 14);
    else
      map.fitBounds(L.latLngBounds(issues.map((i) => [i.lat, i.lng] as L.LatLngTuple)), {
        paddingTopLeft: [32, topInset],
        paddingBottomRight: [32, 40],
        maxZoom: 15,
      });
  }, [map, issues, skip, topInset]);
  return null;
}

export default function IssuesMap({
  issues,
  mode,
  focusId,
  topInset = 190,
}: {
  issues: Issue[];
  mode: MapMode;
  focusId?: string | null;
  /** Pixels kept clear at the top when fitting to the pins (room for an overlaid header card). */
  topInset?: number;
}) {
  const mapKey = useFreshMapKey();
  const markers = useRef(new Map<string, L.Marker>());
  if (mapKey === null) return <div className="h-full w-full bg-panel" />;

  const focus = focusId ? issues.find((i) => i.id === focusId) : undefined;

  return (
    <MapContainer key={mapKey} center={DELHI_CENTER} zoom={11} className="h-full w-full" zoomControl={false}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} className={TILE_CLASS} />
      {mode !== "markers" && <HeatLayer issues={issues} />}
      {mode !== "heatmap" &&
        issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={issueIcon(issue.category, issue.status, issue.upvotes)}
            zIndexOffset={issue.upvotes * 10}
            ref={(m) => {
              if (m) markers.current.set(issue.id, m);
              else markers.current.delete(issue.id);
            }}
          >
            <Popup autoPanPaddingTopLeft={[16, 200]} autoPanPaddingBottomRight={[16, 24]}>
              <div className="w-56">
                <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 pr-8">
                  <StatusBadge status={issue.status} />
                  <span className="flex items-baseline gap-1.5">
                    <span className="figure text-base font-bold text-saffron">{issue.upvotes}</span>
                    <span className="label">Upvotes</span>
                  </span>
                </div>
                <p className="px-3.5 py-3 text-sm font-medium leading-snug text-ink">{issue.title}</p>
                <Link href={`/issue/${issue.id}`} className="btn btn-primary min-h-11 w-full text-ink!">
                  View issue
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      <FocusIssue issue={focus} markers={markers} />
      <FitIssues issues={issues} skip={!!focusId} topInset={topInset} />
    </MapContainer>
  );
}
