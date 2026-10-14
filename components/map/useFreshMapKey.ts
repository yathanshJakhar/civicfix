"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Returns a key for <MapContainer>, or null while the map must not be rendered.
 *
 * Why: Next.js (with Cache Components) hides pages you navigate away from using
 * React's <Activity> instead of unmounting them. Hiding runs effect cleanups, and
 * react-leaflet's MapContainer destroys its Leaflet map in its cleanup, but it keeps
 * that dead map in state. When the page is shown again, layers try to attach to the
 * destroyed map ("Cannot read properties of undefined (reading 'appendChild')").
 * Fast Refresh during development triggers the same cleanup/re-run cycle.
 *
 * Fix: drop the map when effects are cleaned up (key = null), and hand out a brand
 * new key when they run again, so React mounts a fresh container and Leaflet map.
 * A layout effect is used so this happens synchronously, before the page is hidden
 * or painted again.
 */
export function useFreshMapKey(): number | null {
  const mounts = useRef(0);
  const [key, setKey] = useState<number | null>(null);

  useLayoutEffect(() => {
    mounts.current += 1;
    setKey(mounts.current);
    return () => setKey(null);
  }, []);

  return key;
}
