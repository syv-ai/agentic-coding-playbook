import * as d3 from "d3";
import type { VizTheme } from "./theme";

/**
 * Shared drawing vocabulary for every form. Shape carries type, not colour:
 * start/end are ovals, steps are rectangles, decisions are diamonds, stores are soft-filled rectangles.
 * Colour is editorial: at most one or two `focal` nodes per figure take the accent.
 */
export type NodeKind = "step" | "start" | "end" | "decision" | "store";

export interface DiagramNode {
  id: string;
  /** May contain \n for a second line. */
  label: string;
  /** Technical sublabel, set in mono. */
  sub?: string;
  kind?: NodeKind;
  /** The one or two nodes the figure is about. */
  focal?: boolean;
}

export interface DiagramEdge {
  source: string;
  target: string;
  /** Short, set in uppercase mono with an opaque mask. */
  label?: string;
  /** The happy path: accent stroke and arrowhead. Use once. */
  accent?: boolean;
  /** Optional, passive or return relationships. */
  dashed?: boolean;
  dir?: "both";
}

export interface Point { x: number; y: number }
export interface NodeSize { w: number; h: number; lines: string[] }

export const LINE_H = 18;
export const SUB_H = 14;

/** Snap up to the grid (default 8) so every node dimension is divisible by 4. */
export const snapUp = (v: number, g = 8) => Math.ceil(v / g) * g;
export const snap = (v: number, g = 4) => Math.round(v / g) * g;

export function sizeNode(n: DiagramNode, theme: VizTheme, minW = 112): NodeSize {
  const lines = String(n.label).split("\n");
  const textW = Math.max(...lines.map((l) => theme.measure(l, theme.fonts.label)), n.sub ? theme.measure(n.sub, theme.fonts.sub) : 0);
  const contentH = lines.length * LINE_H + (n.sub ? SUB_H : 0);
  if (n.kind === "decision") {
    return { lines, w: snapUp(Math.max(160, textW * 1.7 + 32)), h: snapUp(Math.max(80, contentH + 48)) };
  }
  return { lines, w: snapUp(Math.max(minW, textW + 32)), h: snapUp(contentH + 28) };
}

/** Draw a node at the origin of `g`; returns the shape selection for animation. */
export type AnySel = d3.Selection<any, any, any, any>;

export function drawNode(g: AnySel, n: DiagramNode, size: NodeSize, theme: VizTheme): AnySel {
  const C = theme.colors;
  const kind = n.kind ?? "step";
  const terminal = kind === "start" || kind === "end";
  // A node is either filled or outlined, never both: fills are bounded by their colour delta alone.
  const fill = n.focal ? C.accentTint : terminal || kind === "store" ? C.fillSoft : C.fill;
  const outlined = fill === C.fill;
  const stroke = outlined ? C.border : "none";
  const strokeWidth = outlined ? 1 : 0;
  const { w, h } = size;

  const shape: AnySel = kind === "decision"
    ? g.append("polygon").attr("points", `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`)
    : g.append("rect").attr("width", w).attr("height", h).attr("rx", terminal ? h / 2 : 6).attr("ry", terminal ? h / 2 : 6);
  shape.attr("class", "shape").attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth);

  const total = size.lines.length * LINE_H + (n.sub ? SUB_H : 0);
  const top = (h - total) / 2;
  size.lines.forEach((ln, i) => {
    g.append("text").attr("class", "label").attr("x", w / 2).attr("y", top + LINE_H / 2 + i * LINE_H)
      .attr("text-anchor", "middle").attr("dominant-baseline", "central")
      .attr("fill", C.text).style("font", theme.fonts.label).text(ln);
  });
  if (n.sub) {
    g.append("text").attr("class", "sub").attr("x", w / 2).attr("y", top + size.lines.length * LINE_H + SUB_H / 2 + 1)
      .attr("text-anchor", "middle").attr("dominant-baseline", "central")
      .attr("fill", C.sub).style("font", theme.fonts.sub).text(n.sub);
  }
  return shape;
}

/** Sequential highlight of one node: shape fill and stroke to accent, text to accent-text. */
export function pulseNode(g: AnySel, n: DiagramNode, theme: VizTheme, slot: number, slots: number) {
  const C = theme.colors;
  const shape = g.select(".shape");
  theme.pulse(shape, "fill", shape.attr("fill"), C.accent, slot, slots);
  if (shape.attr("stroke") !== "none") theme.pulse(shape, "stroke", shape.attr("stroke"), C.accent, slot, slots);
  g.selectAll("text").each(function () {
    const t = d3.select(this);
    theme.pulse(t, "fill", t.attr("fill"), C.accentText, slot, slots);
  });
}

/**
 * Orthogonal polyline with rounded corners (quarter arcs, r = 8 by default).
 * Points must be axis-aligned pairwise; the radius shrinks on short segments.
 */
export function elbowPath(points: Point[], r = 8): string {
  if (points.length < 2) return "";
  const parts = [`M${points[0].x},${points[0].y}`];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], a = points[i - 1], b = points[i + 1];
    const inLen = Math.hypot(p.x - a.x, p.y - a.y), outLen = Math.hypot(b.x - p.x, b.y - p.y);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    if (rr < 1) { parts.push(`L${p.x},${p.y}`); continue; }
    const ux = (p.x - a.x) / inLen, uy = (p.y - a.y) / inLen;
    const vx = (b.x - p.x) / outLen, vy = (b.y - p.y) / outLen;
    const sweep = ux * vy - uy * vx > 0 ? 1 : 0;
    parts.push(`L${p.x - ux * rr},${p.y - uy * rr}`);
    parts.push(`A${rr},${rr} 0 0 ${sweep} ${p.x + vx * rr},${p.y + vy * rr}`);
  }
  const last = points[points.length - 1];
  parts.push(`L${last.x},${last.y}`);
  return parts.join(" ");
}

/**
 * Connector label: uppercase mono in the standard text colour on an opaque mask, never on the stroke.
 * `above` centres it 6px above a horizontal segment; `beside` puts it 6px right of a vertical one.
 */
export interface Box { x: number; y: number; w: number; h: number }

/** Where a connector label's mask will sit; used for drawing and for sizing the canvas. */
export function edgeLabelBox(at: Point, text: string, theme: VizTheme, place: "above" | "beside"): Box {
  const w = snapUp(theme.measure(text.toUpperCase(), theme.fonts.edge) * 1.12 + 8, 4);
  const h = 14, gap = 6;
  return place === "above" ? { x: at.x - w / 2, y: at.y - gap - h, w, h } : { x: at.x + gap, y: at.y - h / 2, w, h };
}

export function drawEdgeLabel(parent: AnySel, at: Point, text: string, theme: VizTheme, place: "above" | "beside") {
  const C = theme.colors;
  const t = text.toUpperCase();
  const { x, y, w, h } = edgeLabelBox(at, t, theme, place);
  const g = parent.append("g").attr("class", "edge-label");
  g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("rx", 2).attr("fill", C.bg);
  g.append("text").attr("x", x + w / 2).attr("y", y + h / 2 + 0.5).attr("text-anchor", "middle").attr("dominant-baseline", "central")
    .attr("fill", C.text).style("font", theme.fonts.edge).style("letter-spacing", "0.12em").text(t);
  return g;
}

export interface Markers { plain: string; accent: string }
export function markers(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, theme: VizTheme): Markers {
  const uid = Math.random().toString(36).slice(2, 8);
  return {
    plain: theme.arrow(svg, `arrow-${uid}`, theme.colors.sub),
    accent: theme.arrow(svg, `arrow-accent-${uid}`, theme.colors.accent),
  };
}

export function newSvg(container: HTMLElement, w: number, h: number, title?: string) {
  container.querySelectorAll("svg").forEach((s) => s.remove());
  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`).attr("width", w).attr("height", h)
    .attr("role", "img").style("display", "inline-block")
    .style("width", "100%").style("max-width", `${w}px`).style("height", "auto");
  if (title) svg.attr("aria-label", title);
  return svg;
}

/** The longest segment carries the label: above it when horizontal, beside it when vertical. */
export function labelSpot(points: Point[]): { at: Point; place: "above" | "beside" } {
  let best = 0, len = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    if (d > len) { len = d; best = i; }
  }
  const a = points[best], b = points[best + 1];
  return { at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, place: Math.abs(a.y - b.y) < 1 ? "above" : "beside" };
}

/**
 * Sideways step per rank for a top-down figure, so it fills a portrait rectangle instead of a
 * single column. Zero when the figure is already wide enough; capped so each node still overlaps
 * the one above it and the figure never exceeds the column.
 */
export function stagger(ranks: number, naturalW: number, naturalH: number, maxNodeW: number, theme: VizTheme): number {
  if (ranks < 2) return 0;
  const targetW = Math.min(theme.space.maxWidth, Math.max(naturalW, naturalH * theme.space.aspect));
  return snap(Math.max(0, Math.min((targetW - naturalW) / (ranks - 1), maxNodeW * 0.6)));
}
