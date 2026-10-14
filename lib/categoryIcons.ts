import type { Category } from "./types";

// Inner SVG markup (24x24 viewBox, stroke-based) for each category. Shared by the
// React <CategoryIcon> and the Leaflet map pins, which need raw HTML strings.
export const CATEGORY_SVG: Record<Category, string> = {
  Pothole: '<path d="M3 19h18"/><ellipse cx="12" cy="13.5" rx="7" ry="2.5"/><path d="M8 10.5 9.5 8M16 10.5 14.5 8"/>',
  Garbage: '<path d="M3 6h18M9 6V4h6v2M5.5 6l1.2 14h10.6l1.2-14M10 10v6M14 10v6"/>',
  Streetlight: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.6.6.8 1.2.8 2.4h6c0-1.2.2-1.8.8-2.4A6 6 0 0 0 12 3Z"/>',
  "Water Leakage": '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
  Sewage: '<path d="M2 8c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0M2 13c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0M2 18c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0"/>',
  Traffic: '<rect x="8" y="2.5" width="8" height="19" rx="2"/><circle cx="12" cy="7" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="17" r="1.4"/>',
  Other: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
};

export function categorySvg(category: Category, size: number, color: string, strokeWidth = 2): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${CATEGORY_SVG[category]}</svg>`;
}
