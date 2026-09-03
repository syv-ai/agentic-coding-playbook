import * as d3 from "d3";
import type { VizTheme } from "./theme";
import { drawEdgeLabel, drawNode, elbowPath, labelSpot, markers, newSvg, pulseNode, sizeNode, snap, snapUp, stagger, type DiagramEdge, type DiagramNode, type NodeSize, type Point } from "./primitives";

export type FlowNode = DiagramNode;
export type FlowLink = DiagramEdge;
export interface FlowSpec { nodes: FlowNode[]; links: FlowLink[] }
export interface FlowOptions { orientation?: "LR" | "TD"; theme: VizTheme; title?: string }

interface Placed extends DiagramNode { size: NodeSize; x: number; y: number }

/** Linear chain. Left-to-right it is one row; top-down it steps sideways rank by rank to fill a portrait rectangle. */
export function renderFlow(container: HTMLElement, spec: FlowSpec, { orientation = "TD", theme, title }: FlowOptions): void {
  const horizontal = orientation === "LR";
  const C = theme.colors;
  const { gap: GAP, spacing: SPACING, margin: M } = theme.space;

  const nodes: Placed[] = spec.nodes.map((n) => ({ ...n, size: sizeNode(n, theme), x: 0, y: 0 }));
  const maxW = Math.max(...nodes.map((n) => n.size.w));
  const maxH = Math.max(...nodes.map((n) => n.size.h));
  let cursor = 0;
  nodes.forEach((n) => {
    if (horizontal) { n.x = cursor; n.y = snap((maxH - n.size.h) / 2); cursor += n.size.w + SPACING; }
    else { n.x = snap((maxW - n.size.w) / 2); n.y = cursor; cursor += n.size.h + SPACING; }
  });
  if (!horizontal) {
    const step = stagger(nodes.length, maxW, cursor - SPACING, maxW, theme);
    nodes.forEach((n, i) => { n.x += i * step; });
  }
  const totalW = snapUp(Math.max(...nodes.map((n) => n.x + n.size.w)) + 2 * M, 4);
  const totalH = snapUp(Math.max(...nodes.map((n) => n.y + n.size.h)) + 2 * M, 4);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const svg = newSvg(container, totalW, totalH, title);
  const mk = markers(svg, theme);
  const root = svg.append("g").attr("transform", `translate(${M},${M})`);

  // Connectors first, so nodes paint over them. Same-axis pairs are straight; staggered ones elbow.
  const edges = root.append("g").attr("class", "edges");
  const labels = root.append("g").attr("class", "edge-labels");
  spec.links.forEach((l) => {
    const s = byId[l.source], t = byId[l.target];
    if (!s || !t) return;
    let points: Point[];
    if (horizontal) {
      points = [{ x: s.x + s.size.w, y: s.y + s.size.h / 2 }, { x: t.x - GAP, y: t.y + t.size.h / 2 }];
    } else {
      const sx = s.x + s.size.w / 2, tx = t.x + t.size.w / 2, sy = s.y + s.size.h, ty = t.y - GAP;
      const mid = snap(sy + (ty + GAP - sy) / 2);
      points = Math.abs(sx - tx) < 1 ? [{ x: sx, y: sy }, { x: tx, y: ty }] : [{ x: sx, y: sy }, { x: sx, y: mid }, { x: tx, y: mid }, { x: tx, y: ty }];
    }
    const color = l.accent ? C.accent : C.sub;
    edges.append("path").attr("class", "edge").attr("d", elbowPath(points)).attr("fill", "none")
      .attr("stroke", color).attr("stroke-width", l.accent ? 1.4 : 1.2)
      .attr("stroke-dasharray", l.dashed ? "4 3" : null)
      .attr("marker-end", l.accent ? mk.accent : mk.plain)
      .attr("marker-start", l.dir === "both" ? (l.accent ? mk.accent : mk.plain) : null);
    if (l.label) {
      const { at, place } = labelSpot(points);
      drawEdgeLabel(labels, at, l.label, theme, place, l.accent ? C.accent : undefined);
    }
  });

  const groups = root.append("g").selectAll("g").data(nodes).join("g")
    .attr("class", "node").attr("transform", (d) => `translate(${d.x},${d.y})`);
  groups.each(function (d) { drawNode(d3.select(this), d, d.size, theme); });

  // Motion: nodes light up in chain order; connectors stay still.
  groups.each(function (d, i) { pulseNode(d3.select(this), d, theme, i, nodes.length); });
}
