import * as d3 from "d3";
import type { VizTheme } from "./theme";

export interface FlowNode { id: string; label: string; sub?: string }
export interface FlowLink { source: string; target: string; dir?: "both" }
export interface FlowSpec { nodes: FlowNode[]; links: FlowLink[] }
export interface FlowOptions { orientation?: "LR" | "TD"; theme: VizTheme }

interface Sized extends FlowNode { w: number; h: number; pill: boolean; x: number; y: number }

/** Linear pill/rounded-rect flow. Single-line nodes are pills; nodes with a subtitle are rounded rectangles. */
export function renderFlow(container: HTMLElement, spec: FlowSpec, { orientation = "LR", theme }: FlowOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());
  const horizontal = orientation === "LR";
  const COL = theme.colors;
  const { gap: GAP, spacing: SPACING, margin: MARGIN } = theme.space;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const PAD_X = 14;

  const nodes: Sized[] = spec.nodes.map((n) => {
    const w = Math.max(96, Math.max(theme.measure(n.label, FONT), n.sub ? theme.measure(n.sub, SUBFONT) : 0) + PAD_X * 2);
    return { ...n, w, h: n.sub ? 62 : 44, pill: !n.sub, x: 0, y: 0 };
  });
  const maxW = Math.max(...nodes.map((n) => n.w));
  const maxH = Math.max(...nodes.map((n) => n.h));

  let cursor = 0;
  nodes.forEach((n) => {
    if (horizontal) { n.x = cursor; n.y = (maxH - n.h) / 2; cursor += n.w + SPACING; }
    else { n.x = (maxW - n.w) / 2; n.y = cursor; cursor += n.h + SPACING; }
  });
  const totalW = horizontal ? cursor - SPACING : maxW;
  const totalH = horizontal ? maxH : cursor - SPACING;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `${-MARGIN} ${-MARGIN} ${totalW + 2 * MARGIN} ${totalH + 2 * MARGIN}`)
    .attr("width", totalW + 2 * MARGIN).attr("height", totalH + 2 * MARGIN)
    .style("display", "inline-block");
  const ARROW = theme.arrow(svg, `flow-arrow-${Math.random().toString(36).slice(2, 8)}`, COL.line);

  svg.append("g").selectAll("line").data(spec.links).join("line")
    .each(function (l) {
      const s = byId[l.source], t = byId[l.target];
      const [x1, y1, x2, y2] = horizontal
        ? [s.x + s.w + GAP, s.y + s.h / 2, t.x - GAP, t.y + t.h / 2]
        : [s.x + s.w / 2, s.y + s.h + GAP, t.x + t.w / 2, t.y - GAP];
      d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
    })
    .attr("stroke", COL.line).attr("stroke-width", 1.4).attr("marker-end", ARROW)
    .attr("marker-start", (l) => (l.dir === "both" ? ARROW : null));

  const g = svg.append("g").selectAll("g").data(nodes).join("g").attr("transform", (d) => `translate(${d.x},${d.y})`);
  g.append("rect").attr("width", (d) => d.w).attr("height", (d) => d.h)
    .attr("rx", (d) => (d.pill ? d.h / 2 : 10)).attr("ry", (d) => (d.pill ? d.h / 2 : 10))
    .attr("fill", COL.fill).attr("stroke", COL.border).attr("stroke-width", 1);
  g.append("text").attr("x", (d) => d.w / 2).attr("y", (d) => (d.sub ? d.h / 2 - 7 : d.h / 2))
    .attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("fill", COL.text).style("font", FONT).text((d) => d.label);
  g.filter((d) => Boolean(d.sub)).append("text").attr("x", (d) => d.w / 2).attr("y", (d) => d.h / 2 + 12)
    .attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("fill", COL.sub).style("font", SUBFONT).text((d) => d.sub ?? "");

  // Slow, looping motion along each link, staggered so the eye reads the chain left to right.
  spec.links.forEach((l, i) => {
    const s = byId[l.source], t = byId[l.target];
    const [x1, y1, x2, y2] = horizontal
      ? [s.x + s.w + GAP, s.y + s.h / 2, t.x - GAP, t.y + t.h / 2]
      : [s.x + s.w / 2, s.y + s.h + GAP, t.x + t.w / 2, t.y - GAP];
    theme.travel(svg, `M${x1},${y1} L${x2},${y2}`, COL.accent, 3, i * 0.8);
  });
}
