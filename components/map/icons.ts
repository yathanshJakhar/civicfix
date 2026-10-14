import L from "leaflet";
import type { Category, Status } from "@/lib/types";
import { categorySvg } from "@/lib/categoryIcons";
import { STATUS_STYLES } from "@/lib/utils";

// Custom divIcon pins instead of Leaflet's default PNG markers, which render as
// broken images under bundlers (the default icon URLs can't be resolved).
const cache = new Map<string, L.DivIcon>();

const GROUND = "#17120f";

/** Fixed upvote ramp: pin size reads community weight before any label does. */
export const PIN_STEPS = [
  { min: 0, size: 26 },
  { min: 10, size: 32 },
  { min: 25, size: 40 },
] as const;

function pinSize(upvotes: number): number {
  let size: number = PIN_STEPS[0].size;
  for (const step of PIN_STEPS) if (upvotes >= step.min) size = step.size;
  return size;
}

/** A square status tag with a pointer underneath, anchored at the pointer's tip. */
function tagHtml(color: string, size: number, inner: string) {
  const tip = Math.round(size * 0.28);
  return `
    <div style="position:relative;width:${size}px;height:${size + tip}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))">
      <div style="width:${size}px;height:${size}px;background:${GROUND};border:2px solid ${color};display:flex;align-items:center;justify-content:center">${inner}</div>
      <div style="position:absolute;left:50%;top:${size - 1}px;width:0;height:0;margin-left:-${tip}px;border-left:${tip}px solid transparent;border-right:${tip}px solid transparent;border-top:${tip}px solid ${color}"></div>
    </div>`;
}

export function issueIcon(category: Category, status: Status, upvotes = 0): L.DivIcon {
  const size = pinSize(upvotes);
  const key = `${category}|${status}|${size}`;
  let icon = cache.get(key);
  if (!icon) {
    const color = STATUS_STYLES[status].hex;
    const tip = Math.round(size * 0.28);
    icon = L.divIcon({
      className: "civic-pin",
      html: tagHtml(color, size, categorySvg(category, Math.round(size * 0.55), color, 2.2)),
      iconSize: [size, size + tip],
      iconAnchor: [size / 2, size + tip],
      popupAnchor: [0, -(size + tip) + 4],
    });
    cache.set(key, icon);
  }
  return icon;
}

export const pickerIcon = L.divIcon({
  className: "civic-pin",
  html: tagHtml("#f2a93b", 32, '<span style="width:10px;height:10px;background:#f2a93b;display:block"></span>'),
  iconSize: [32, 41],
  iconAnchor: [16, 41],
});
