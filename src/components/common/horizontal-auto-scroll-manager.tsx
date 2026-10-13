"use client";

import { useEffect, useRef } from "react";

/**
 * Universal Horizontal Auto-Scroll Engine:
 * When the pointer/cursor enters within 20% of either edge of any horizontally scrollable
 * container (e.g. wide tables, lists, matriculation registries, question carousels),
 * automatically and smoothly scrolls horizontally towards that edge.
 * Stops immediately when the cursor moves away from the 20% boundary or leaves the container.
 */
export function HorizontalAutoScrollManager() {
  const stateRef = useRef<{
    activeEl: HTMLElement | null;
    speed: number;
    rafId: number | null;
  }>({
    activeEl: null,
    speed: 0,
    rafId: null,
  });

  useEffect(() => {
    const isScrollable = (el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      const ox = style.overflowX;
      return (
        (ox === "auto" || ox === "scroll" || ox === "overlay") &&
        el.scrollWidth > el.clientWidth + 4
      );
    };

    const findContainer = (start: HTMLElement | null): HTMLElement | null => {
      let cur: HTMLElement | null = start;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        if (isScrollable(cur)) {
          return cur;
        }
        cur = cur.parentElement;
      }
      return null;
    };

    const stopScroll = () => {
      if (stateRef.current.rafId !== null) {
        cancelAnimationFrame(stateRef.current.rafId);
        stateRef.current.rafId = null;
      }
      stateRef.current.speed = 0;
      stateRef.current.activeEl = null;
    };

    const step = () => {
      const { activeEl, speed } = stateRef.current;
      if (!activeEl || speed === 0) {
        stopScroll();
        return;
      }

      const prevScroll = activeEl.scrollLeft;
      activeEl.scrollLeft += speed;

      // Stop if maximum reached or scroll position cannot change further
      if (
        (speed > 0 && activeEl.scrollLeft + activeEl.clientWidth >= activeEl.scrollWidth - 1) ||
        (speed < 0 && activeEl.scrollLeft <= 0) ||
        activeEl.scrollLeft === prevScroll
      ) {
        stopScroll();
        return;
      }

      stateRef.current.rafId = requestAnimationFrame(step);
    };

    const startScroll = (el: HTMLElement, speed: number) => {
      stateRef.current.activeEl = el;
      stateRef.current.speed = speed;
      if (stateRef.current.rafId === null) {
        stateRef.current.rafId = requestAnimationFrame(step);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore touch gestures to preserve native mobile pinch/swipe
      if (e.pointerType === "touch") {
        stopScroll();
        return;
      }

      const target = e.target as HTMLElement | null;
      const container = findContainer(target);

      if (!container) {
        stopScroll();
        return;
      }

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) {
        stopScroll();
        return;
      }

      // Check if pointer is vertically within the container bounds
      if (e.clientY < rect.top || e.clientY > rect.bottom) {
        stopScroll();
        return;
      }

      const relX = e.clientX - rect.left;
      const ratio = relX / rect.width;

      // Right 20% zone: ratio >= 0.80 (cursor is 20% left to the end of displayable part)
      if (ratio >= 0.80) {
        const proximity = Math.min(1, (ratio - 0.80) / 0.20);
        // Smoothly accelerate speed from 4px up to 24px per frame based on closeness to edge
        const speed = Math.max(4, Math.round(4 + proximity * 20));
        startScroll(container, speed);
      }
      // Left 20% zone: ratio <= 0.20 (cursor is within 20% of start)
      else if (ratio <= 0.20) {
        const proximity = Math.min(1, (0.20 - ratio) / 0.20);
        const speed = -Math.max(4, Math.round(4 + proximity * 20));
        startScroll(container, speed);
      } else {
        stopScroll();
      }
    };

    const handlePointerLeave = () => {
      stopScroll();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("pointerup", handlePointerLeave, { passive: true });
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      stopScroll();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerup", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, []);

  return null;
}
