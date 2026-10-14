"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * FLIP re-rank: children marked with `data-flip="<key>"` glide from their previous position
 * to their new one whenever `deps` change, so a row keeps its identity as the board re-sorts.
 */
export function useFlip<T extends HTMLElement>(deps: unknown) {
  const ref = useRef<T>(null);
  const last = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-flip]");
    const next = new Map<string, number>();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    nodes.forEach((node) => {
      const key = node.dataset.flip!;
      const top = node.getBoundingClientRect().top;
      next.set(key, top);
      const prev = last.current.get(key);
      if (reduce || prev === undefined || prev === top) return;
      node.animate(
        [{ transform: `translateY(${prev - top}px)` }, { transform: "translateY(0)" }],
        { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    });
    last.current = next;
  }, [deps]);

  return ref;
}
