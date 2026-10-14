"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { Issue } from "@/lib/types";
import { issueIcon } from "./icons";
import { TILE_CLASS, TILE_URL } from "./tiles";
import { useFreshMapKey } from "./useFreshMapKey";

export default function MiniMap({ issue }: { issue: Issue }) {
  const mapKey = useFreshMapKey();
  if (mapKey === null) return <div className="h-full w-full bg-panel" />;

  return (
    <MapContainer
      key={mapKey}
      center={[issue.lat, issue.lng]}
      zoom={16}
      className="h-full w-full"
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      doubleClickZoom={false}
      touchZoom={false}
      attributionControl={false}
    >
      <TileLayer url={TILE_URL} className={TILE_CLASS} />
      <Marker position={[issue.lat, issue.lng]} icon={issueIcon(issue.category, issue.status, issue.upvotes)} interactive={false} />
    </MapContainer>
  );
}
