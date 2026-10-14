"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { pickerIcon } from "./icons";
import { TILE_ATTRIBUTION, TILE_CLASS, TILE_URL } from "./tiles";
import { useFreshMapKey } from "./useFreshMapKey";
import { DELHI_CENTER } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
  }, [map, value]);
  return null;
}

export default function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (p: LatLng) => void }) {
  const mapKey = useFreshMapKey();
  if (mapKey === null) return <div className="h-full w-full bg-zinc-900" />;

  return (
    <MapContainer key={mapKey} center={value ? [value.lat, value.lng] : DELHI_CENTER} zoom={value ? 16 : 11} className="h-full w-full">
      <TileLayer
        attribution={TILE_ATTRIBUTION}
        url={TILE_URL}
        className={TILE_CLASS}
      />
      <ClickHandler onPick={onChange} />
      <Recenter value={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = e.target.getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
