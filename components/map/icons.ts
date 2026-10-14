import L from "leaflet";
import type { Category, Status } from "@/lib/types";
import { categorySvg } from "@/lib/categoryIcons";
import { STATUS_STYLES } from "@/lib/utils";

// Custom divIcon pins instead of Leaflet's default PNG markers, which render as
// broken images under bundlers (the default icon URLs can't be resolved).
const cache = new Map<string, L.DivIcon>();

function pinHtml(color: string, inner: string) {
  return `
    <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))">
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1C7.7 1 1 7.6 1 15.9 1 27 16 41 16 41s15-14 15-25.1C31 7.6 24.3 1 16 1Z" fill="${color}" stroke="#09090b" stroke-width="2"/>
        <circle cx="16" cy="15.5" r="10" fill="#09090b"/>
      </svg>
      <span style="position:absolute;top:7px;left:8px;width:16px;height:16px;display:flex">${inner}</span>
    </div>`;
}

export function issueIcon(category: Category, status: Status): L.DivIcon {
  const key = `${category}|${status}`;
  let icon = cache.get(key);
  if (!icon) {
    const color = STATUS_STYLES[status].hex;
    icon = L.divIcon({
      className: "civic-pin",
      html: pinHtml(color, categorySvg(category, 16, color, 2.2)),
      iconSize: [32, 42],
      iconAnchor: [16, 41],
      popupAnchor: [0, -36],
    });
    cache.set(key, icon);
  }
  return icon;
}

export const pickerIcon = L.divIcon({
  className: "civic-pin",
  html: pinHtml("#8b5cf6", '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="#8b5cf6"/></svg>'),
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});
