import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Animates its own height whenever the content inside changes size, so a block that grows or
 * shrinks slides the content below it rather than jumping. Height is measured with a
 * ResizeObserver; the transition lives in CSS (`.autoheight`) and is disabled under reduced motion.
 */
export default function AutoHeight({ children }: { children?: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  // Measure after every render, so a state change in the children always updates the height even
  // where ResizeObserver is silent (background tabs). The observer covers changes React does not
  // cause: fonts loading, the window resizing, a nested figure redrawing.
  useLayoutEffect(() => {
    const el = inner.current;
    if (el) setHeight(el.getBoundingClientRect().height);
  });
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setHeight(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="autoheight" style={{ height: height === undefined ? "auto" : height }}>
      <div ref={inner}>{children}</div>
    </div>
  );
}
