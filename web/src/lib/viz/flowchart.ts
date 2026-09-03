import * as d3 from "d3";
import * as dagre from "@dagrejs/dagre";
import type { VizTheme } from "./theme";
import { drawEdgeLabel, drawNode, elbowPath, markers, newSvg, pulseNode, sizeNode, snap, snapUp, type DiagramEdge, type DiagramNode, type NodeSize, type Point } from "./primitives";

export type FlowchartNode = DiagramNode;
export type FlowchartLink = DiagramEdge;
export interface FlowchartSpec { nodes: FlowchartNode[]; links: FlowchartLink[] }
export interface FlowchartOptions { orientation?: "LR" | "TD"; theme: VizTheme; title?: string }

interface Placed extends DiagramNode { size: NodeSize; cx: number; cy: number }
type Side = "front" | "back" | "under";

/**
 * Branching and looping flows. dagre places nodes on ranks; the connectors are ours:
 * orthogonal with rounded elbows, a visible gap before every arrowhead, fanned attach
 * points when several connectors share an edge, and back-edges routed in a lane below
 * (LR) or beside (TD) the nodes so they never pass behind a box.
 */
export function renderFlowchart(container: HTMLElement, spec: FlowchartSpec, { orientation = "TD", theme, title }: FlowchartOptions): void {
  const H = orientation === "LR";
  const C = theme.colors;
  const { gap: GAP, spacing: RANKSEP, margin: M } = theme.space;

  // ---- Layout -------------------------------------------------------------
  const sized = new Map(spec.nodes.map((n) => [n.id, sizeNode(n, theme)]));
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: H ? "LR" : "TB", nodesep: 40, ranksep: RANKSEP, edgesep: 16, marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));
  spec.nodes.forEach((n) => g.setNode(n.id, { width: sized.get(n.id)!.w, height: sized.get(n.id)!.h }));
  spec.links.forEach((l, i) => g.setEdge(l.source, l.target, {}, `e${i}`));
  dagre.layout(g);

  const nodes: Placed[] = spec.nodes.map((n) => ({ ...n, size: sized.get(n.id)!, cx: snap(g.node(n.id).x), cy: snap(g.node(n.id).y) }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Primary axis u runs with the flow, cross axis v across it.
  const U = (n: Placed) => (H ? n.cx : n.cy);
  const V = (n: Placed) => (H ? n.cy : n.cx);
  const DU = (n: Placed) => (H ? n.size.w : n.size.h);
  const DV = (n: Placed) => (H ? n.size.h : n.size.w);
  const pt = (u: number, v: number): Point => (H ? { x: u, y: v } : { x: v, y: u });

  // ---- Attach points: fan connectors that share a side of a box ----------
  const forward = (l: DiagramEdge) => U(byId.get(l.target)!) > U(byId.get(l.source)!) + 1;
  const wants: Record<string, { edge: number; end: "s" | "t"; sortKey: number }[]> = {};
  const want = (node: Placed, side: Side, edge: number, end: "s" | "t", sortKey: number) => {
    (wants[`${node.id}:${side}`] ??= []).push({ edge, end, sortKey });
  };
  spec.links.forEach((l, i) => {
    const s = byId.get(l.source)!, t = byId.get(l.target)!;
    if (forward(l)) { want(s, "front", i, "s", V(t)); want(t, "back", i, "t", V(s)); }
    else { want(s, "under", i, "s", U(t)); want(t, "under", i, "t", U(s)); }
  });
  const offset = (node: Placed, side: Side, edge: number, end: "s" | "t"): number => {
    const list = wants[`${node.id}:${side}`] ?? [];
    if (list.length <= 1) return 0;
    const sorted = [...list].sort((a, b) => a.sortKey - b.sortKey);
    const k = sorted.findIndex((e) => e.edge === edge && e.end === end) + 1;
    const L = side === "under" ? DU(node) : DV(node);
    return snap((L * k) / (list.length + 1) - L / 2);
  };

  // ---- Routes -------------------------------------------------------------
  const maxV = Math.max(...nodes.map((n) => V(n) + DV(n) / 2));
  let lanes = 0;
  const routes = spec.links.map((l, i) => {
    const s = byId.get(l.source)!, t = byId.get(l.target)!;
    if (forward(l)) {
      const sv = V(s) + offset(s, "front", i, "s"), tv = V(t) + offset(t, "back", i, "t");
      const su = U(s) + DU(s) / 2, tu = U(t) - DU(t) / 2 - GAP;
      if (Math.abs(sv - tv) < 1) return { l, points: [pt(su, sv), pt(tu, sv)] };
      const mid = snap(su + (tu + GAP - su) / 2);
      return { l, points: [pt(su, sv), pt(mid, sv), pt(mid, tv), pt(tu, tv)] };
    }
    const lane = maxV + 24 + lanes++ * 16;
    const su = U(s) + offset(s, "under", i, "s"), tu = U(t) + offset(t, "under", i, "t");
    return { l, points: [pt(su, V(s) + DV(s) / 2), pt(su, lane), pt(tu, lane), pt(tu, V(t) + DV(t) / 2 + GAP)] };
  });

  // ---- Canvas -------------------------------------------------------------
  const all = [...nodes.flatMap((n) => [{ x: n.cx - n.size.w / 2, y: n.cy - n.size.h / 2 }, { x: n.cx + n.size.w / 2, y: n.cy + n.size.h / 2 }]), ...routes.flatMap((r) => r.points)];
  const minX = Math.min(...all.map((p) => p.x)), minY = Math.min(...all.map((p) => p.y));
  const maxX = Math.max(...all.map((p) => p.x)), maxY = Math.max(...all.map((p) => p.y));
  const W = snapUp(maxX - minX + 2 * M, 4), Hh = snapUp(maxY - minY + 2 * M, 4);
  const svg = newSvg(container, W, Hh, title);
  const mk = markers(svg, theme);
  const root = svg.append("g").attr("transform", `translate(${M - minX},${M - minY})`);

  // Connectors first, then labels, then nodes: labels never sit under a box.
  const edges = root.append("g").attr("class", "edges");
  routes.forEach(({ l, points }) => {
    const color = l.accent ? C.accent : C.sub;
    edges.append("path").attr("class", "edge").attr("d", elbowPath(points)).attr("fill", "none")
      .attr("stroke", color).attr("stroke-width", l.accent ? 1.4 : 1.2)
      .attr("stroke-dasharray", l.dashed ? "4 3" : null)
      .attr("marker-end", l.accent ? mk.accent : mk.plain)
      .attr("marker-start", l.dir === "both" ? (l.accent ? mk.accent : mk.plain) : null);
  });
  const labels = root.append("g").attr("class", "edge-labels");
  routes.forEach(({ l, points }) => {
    if (!l.label) return;
    // Longest segment carries the label; horizontal segments take it above, vertical ones beside.
    let best = 0, len = -1;
    for (let i = 0; i < points.length - 1; i++) {
      const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      if (d > len) { len = d; best = i; }
    }
    const a = points[best], b = points[best + 1];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    drawEdgeLabel(labels, mid, l.label, theme, Math.abs(a.y - b.y) < 1 ? "above" : "beside", l.accent ? C.accent : undefined);
  });

  const groups = root.append("g").selectAll("g").data(nodes).join("g")
    .attr("class", "node").attr("transform", (d) => `translate(${d.cx - d.size.w / 2},${d.cy - d.size.h / 2})`);
  groups.each(function (d) { drawNode(d3.select(this), d, d.size, theme); });

  // Motion: nodes light up in spec order; connectors stay still.
  groups.each(function (d, i) { pulseNode(d3.select(this), d, theme, i, nodes.length); });
}
