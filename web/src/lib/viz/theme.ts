import type { Selection } from "d3";

export interface VizColors {
  bg: string; fill: string; border: string; text: string; sub: string; line: string;
  chipBorder: string; good: string; defect: string; defectText: string; accent: string;
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
  /** A small dot that travels along `path` forever. The slow, looping motion replaces hover effects. */
  travel(svg: Selection<SVGSVGElement, unknown, null, undefined>, path: string, color: string, seconds: number, delay?: number): void;
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
    travel(svg, path, color, seconds, delay = 0) {
      if (!animate) return;
      svg.append("circle").attr("class", "traveller").attr("r", 3.5).attr("fill", color)
        .append("animateMotion").attr("dur", `${seconds}s`).attr("begin", `${delay}s`).attr("repeatCount", "indefinite").attr("path", path);
    },
  };
}
