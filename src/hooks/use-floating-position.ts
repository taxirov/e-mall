"use client";

import { useEffect, useState, type RefObject } from "react";

export type FloatingRect = { top: number; left: number; width: number };

/**
 * Tracks an anchor element's viewport position while `open` is true, so a
 * dropdown can be rendered into a portal (escaping any scrollable/clipping
 * ancestor, e.g. a Dialog's max-h + overflow-y-auto) and still line up
 * under the anchor. Recomputes on scroll (any ancestor, via capture) and
 * resize.
 */
export function useFloatingPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean): FloatingRect | null {
  const [rect, setRect] = useState<FloatingRect | null>(null);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(null);
      return;
    }
    function update() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  return rect;
}
