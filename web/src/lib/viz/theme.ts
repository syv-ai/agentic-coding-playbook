import type { Selection } from "d3";

export interface VizColors {
  bg: string; fill: string; border: string; text: string; sub: string; line: string;
  chipBorder: string; good: string; defect: string; defectText: string; accent: string; accentText: string;
}

export interface VizTheme {
  colors: VizColors;
  space: { gap: number; spacing: number; margin: number };
  fonts: { label: string; sub: string; chip: string };
  /** Append a shared arrowhead marker and return its url(#id). */
  arrow(svg: Selection<SVGSVGElement, unknown, null, undefined>, id: string, color: string): string;
  /** Text width in px for the given CSS font. */
  measure(text: string, font: string): number;
  /** False when the reader prefers reduced motion; renderers then draw static figures. */
  animate: boolean;
  /**
   * The one motion rule for visuals: elements light up one after another, then the cycle restarts.
   * Adds a looping <animate> on `attr` that holds `rest`, switches to `active` during this element's
   * slot (`slot` of `slots`), and returns. Every element of one figure must share `slots` and `step`.
   */
  pulse(el: Selection<any, any, any, any>, attr: string, rest: string, active: string, slot: number, slots: number, step?: number): void;
}

const FONTS = {
  label: '600 14px "IBM Plex Sans", sans-serif',
  sub: '11.5px "IBM Plex Sans", sans-serif',
  chip: '12px "IBM Plex Sans", sans-serif',
};

/** Read the viz tokens from CSS custom properties on <html>, so light/dark and any palette change apply. */
export function readTheme(root: HTMLElement = document.documentElement): VizTheme {
  const css = getComputedStyle(root);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  const animate = typeof window === "undefined" || typeof window.matchMedia !== "function" ? true : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    animate,
    colors: {
      bg: v("--viz-bg", "#ffffff"),
      fill: v("--viz-fill", "#ffffff"),
      border: v("--viz-border", "#1a1a1e"),
      text: v("--viz-text", "#1a1a1e"),
      sub: v("--viz-sub", "#5c5c66"),
      line: v("--viz-line", "#1a1a1e"),
      chipBorder: v("--viz-connector", "#8e8e98"),
      good: v("--viz-good", "#15803d"),
      defect: v("--viz-defect", "#e0857c"),
      defectText: v("--viz-defect-text", "#1a1a1e"),
      accent: v("--viz-accent", "#7c3aed"),
      accentText: v("--viz-accent-text", "#ffffff"),
    },
    space: { gap: 12, spacing: 46, margin: 16 },
    fonts: FONTS,
    arrow(svg, id, color) {
      let defs = svg.select<SVGDefsElement>("defs");
      if (defs.empty()) defs = svg.append("defs");
      defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5)
        .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", color);
      return `url(#${id})`;
    },
    measure(text, font) {
      if (!ctx) return text.length * 8; // jsdom has no canvas; a rough width keeps layout deterministic in tests
      ctx.font = font;
      return ctx.measureText(text).width;
    },
    pulse(el, attr, rest, active, slot, slots, step = 0.7) {
      if (!animate) return;
      const pause = 1.2; // seconds of rest at the end of every cycle
      const total = slots * step + pause;
      const ramp = Math.min(0.15, step * 0.2) / total; // short fade in and out
      const t0 = (slot * step) / total;
      const t1 = ((slot + 1) * step) / total;
      const times = [0, t0, t0 + ramp, t1 - ramp, t1, 1];
      const values = [rest, rest, active, active, rest, rest];
      // keyTimes must be non-decreasing; drop the duplicate leading point for the first slot.
      if (t0 === 0) { times.shift(); values.shift(); }
      el.append("animate")
        .attr("attributeName", attr)
        .attr("values", values.join(";"))
        .attr("keyTimes", times.map((t) => t.toFixed(4)).join(";"))
        .attr("dur", `${total}s`)
        .attr("repeatCount", "indefinite");
    },
  };
}
