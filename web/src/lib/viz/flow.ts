import * as d3 from "d3";
import type { VizTheme } from "./theme";
import { drawEdgeLabel, drawNode, markers, newSvg, pulseNode, sizeNode, snap, type DiagramEdge, type DiagramNode, type NodeSize } from "./primitives";

export type FlowNode = DiagramNode;
export type FlowLink = DiagramEdge;
export interface FlowSpec { nodes: FlowNode[]; links: FlowLink[] }
export interface FlowOptions { orientation?: "LR" | "TD"; theme: VizTheme; title?: string }

interface Placed extends DiagramNode { size: NodeSize; x: number; y: number }

/** Linear chain. Nodes share an axis, so connectors are straight; labels sit above (LR) or beside (TD) the line. */
export function renderFlow(container: HTMLElement, spec: FlowSpec, { orientation = "LR", theme, title }: FlowOptions): void {
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
  const totalW = (horizontal ? cursor - SPACING : maxW) + 2 * M;
  const totalH = (horizontal ? maxH : cursor - SPACING) + 2 * M;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const svg = newSvg(container, totalW, totalH, title);
  const mk = markers(svg, theme);
  const root = svg.append("g").attr("transform", `translate(${M},${M})`);

  // Connectors first, so nodes paint over them.
  const edges = root.append("g").attr("class", "edges");
  spec.links.forEach((l) => {
    const s = byId[l.source], t = byId[l.target];
    if (!s || !t) return;
    const [x1, y1, x2, y2] = horizontal
      ? [s.x + s.size.w + GAP, s.y + s.size.h / 2, t.x - GAP, t.y + t.size.h / 2]
      : [s.x + s.size.w / 2, s.y + s.size.h + GAP, t.x + t.size.w / 2, t.y - GAP];
    const color = l.accent ? C.accent : C.sub;
    edges.append("line").attr("class", "edge").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", color).attr("stroke-width", l.accent ? 1.4 : 1.2)
      .attr("stroke-dasharray", l.dashed ? "4 3" : null)
      .attr("marker-end", l.accent ? mk.accent : mk.plain)
      .attr("marker-start", l.dir === "both" ? (l.accent ? mk.accent : mk.plain) : null);
    if (l.label) drawEdgeLabel(edges, { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, l.label, theme, horizontal ? "above" : "beside", l.accent ? C.accent : undefined);
  });

  const groups = root.append("g").selectAll("g").data(nodes).join("g")
    .attr("class", "node").attr("transform", (d) => `translate(${d.x},${d.y})`);
  groups.each(function (d) { drawNode(d3.select(this), d, d.size, theme); });

  // Motion: nodes light up in chain order; connectors stay still.
  groups.each(function (d, i) { pulseNode(d3.select(this), d, theme, i, nodes.length); });
}
