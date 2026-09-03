import * as d3 from "d3";
import * as dagre from "@dagrejs/dagre";
import type { VizTheme } from "./theme";
import { drawEdgeLabel, drawNode, edgeLabelBox, elbowPath, labelSpot, markers, newSvg, pulseNode, sizeNode, snap, snapUp, stagger, type DiagramEdge, type DiagramNode, type NodeSize, type Point } from "./primitives";

export interface FlowchartNode extends DiagramNode {
  /** Editorial placement on a grid: [column, row], both from 0. Give it to every node or to none. */
  at?: [number, number];
}
export type FlowchartLink = DiagramEdge;
export interface FlowchartSpec { nodes: FlowchartNode[]; links: FlowchartLink[] }
export interface FlowchartOptions { orientation?: "LR" | "TD"; theme: VizTheme; title?: string }

interface Placed extends FlowchartNode { size: NodeSize; cx: number; cy: number }
interface Route { l: DiagramEdge; points: Point[] }
type Side = "left" | "right" | "top" | "bottom";

const COL_GAP = 64, ROW_GAP = 48;

/**
 * Branching and looping flows. Two ways to place nodes:
 *  - editorial: every node has `at: [col, row]`; columns and rows size to their widest and tallest node.
 *    This is the default for anything beyond a plain chain, because composition is a design decision.
 *  - automatic: dagre ranks the nodes; top-down, ranks step sideways to fill a portrait rectangle.
 * Either way the connectors are ours: orthogonal with rounded elbows, a visible gap before every arrowhead,
 * one attach point per connector when several share a side, labels on masks, nothing behind a box.
 */
export function renderFlowchart(container: HTMLElement, spec: FlowchartSpec, { orientation = "TD", theme, title }: FlowchartOptions): void {
  const C = theme.colors;
  const M = theme.space.margin;
  const sized = new Map(spec.nodes.map((n) => [n.id, sizeNode(n, theme)]));
  const editorial = spec.nodes.length > 0 && spec.nodes.every((n) => Array.isArray(n.at));
  const { nodes, routes } = editorial ? gridLayout(spec, sized, theme) : rankLayout(spec, sized, theme, orientation === "LR");

  // ---- Canvas: nodes, routes and label masks all fit inside ---------------
  const labelBoxes = routes.filter((r) => r.l.label).map((r) => { const { at, place } = labelSpot(r.points); return edgeLabelBox(at, r.l.label!, theme, place); });
  const all = [
    ...nodes.flatMap((n) => [{ x: n.cx - n.size.w / 2, y: n.cy - n.size.h / 2 }, { x: n.cx + n.size.w / 2, y: n.cy + n.size.h / 2 }]),
    ...routes.flatMap((r) => r.points),
    ...labelBoxes.flatMap((b) => [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y + b.h }]),
  ];
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
    const { at, place } = labelSpot(points);
    drawEdgeLabel(labels, at, l.label, theme, place, l.accent ? C.accent : undefined);
  });

  const groups = root.append("g").selectAll("g").data(nodes).join("g")
    .attr("class", "node").attr("transform", (d) => `translate(${d.cx - d.size.w / 2},${d.cy - d.size.h / 2})`);
  groups.each(function (d) { drawNode(d3.select(this), d, d.size, theme); });

  // Motion: nodes light up in spec order; connectors stay still.
  groups.each(function (d, i) { pulseNode(d3.select(this), d, theme, i, nodes.length); });
}

/** Attach-point fanning: every connector on one side of a box gets its own point, ≥12px apart. */
function fanner() {
  const wants: Record<string, { key: string; sortKey: number }[]> = {};
  return {
    want(node: Placed, side: Side, key: string, sortKey: number) { (wants[`${node.id}:${side}`] ??= []).push({ key, sortKey }); },
    offset(node: Placed, side: Side, key: string): number {
      const list = wants[`${node.id}:${side}`] ?? [];
      if (list.length <= 1) return 0;
      const sorted = [...list].sort((a, b) => a.sortKey - b.sortKey);
      const k = sorted.findIndex((e) => e.key === key) + 1;
      const L = side === "left" || side === "right" ? node.size.h : node.size.w;
      return snap((L * k) / (list.length + 1) - L / 2);
    },
  };
}

const port = (n: Placed, side: Side, off: number, gap = 0): Point => {
  switch (side) {
    case "right": return { x: n.cx + n.size.w / 2 + gap, y: n.cy + off };
    case "left": return { x: n.cx - n.size.w / 2 - gap, y: n.cy + off };
    case "bottom": return { x: n.cx + off, y: n.cy + n.size.h / 2 + gap };
    case "top": return { x: n.cx + off, y: n.cy - n.size.h / 2 - gap };
  }
};

// ---------------------------------------------------------------------------
// Editorial grid
// ---------------------------------------------------------------------------
function gridLayout(spec: FlowchartSpec, sized: Map<string, NodeSize>, theme: VizTheme): { nodes: Placed[]; routes: Route[] } {
  const GAP = theme.space.gap;
  const cols = Math.max(...spec.nodes.map((n) => n.at![0])) + 1;
  const rows = Math.max(...spec.nodes.map((n) => n.at![1])) + 1;
  const colW = Array.from({ length: cols }, (_, c) => Math.max(0, ...spec.nodes.filter((n) => n.at![0] === c).map((n) => sized.get(n.id)!.w)));
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(0, ...spec.nodes.filter((n) => n.at![1] === r).map((n) => sized.get(n.id)!.h)));
  const colX = colW.map((_, c) => colW.slice(0, c).reduce((a, w) => a + w + COL_GAP, 0));
  const rowY = rowH.map((_, r) => rowH.slice(0, r).reduce((a, h) => a + h + ROW_GAP, 0));

  const nodes: Placed[] = spec.nodes.map((n) => {
    const [c, r] = n.at!;
    return { ...n, size: sized.get(n.id)!, cx: snap(colX[c] + colW[c] / 2), cy: snap(rowY[r] + rowH[r] / 2) };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const occupied = new Set(spec.nodes.map((n) => `${n.at![0]},${n.at![1]}`));
  const cellsBetween = (fixed: number, from: number, to: number, axis: "row" | "col") => {
    const out: string[] = [];
    for (let i = Math.min(from, to) + 1; i < Math.max(from, to); i++) out.push(axis === "row" ? `${i},${fixed}` : `${fixed},${i}`);
    return out;
  };
  const blocked = (cells: string[]) => cells.some((c) => occupied.has(c));

  // Decide each connector's shape and the sides it uses, then fan, then emit points.
  type Plan = { l: DiagramEdge; key: string; s: Placed; t: Placed; shape: "h" | "v" | "L" | "Z"; sSide: Side; tSide: Side };
  const fan = fanner();
  const plans: Plan[] = spec.links.map((l, i) => {
    const s = byId.get(l.source)!, t = byId.get(l.target)!;
    const [sc, sr] = s.at!, [tc, tr] = t.at!;
    const dc = tc - sc, dr = tr - sr;
    const key = `e${i}`;
    let plan: Plan;
    if (dr === 0) plan = { l, key, s, t, shape: "h", sSide: dc > 0 ? "right" : "left", tSide: dc > 0 ? "left" : "right" };
    else if (dc === 0) plan = { l, key, s, t, shape: "v", sSide: dr > 0 ? "bottom" : "top", tSide: dr > 0 ? "top" : "bottom" };
    else {
      // L: leave sideways, turn in the target's column. Z: leave downwards, cross in the gap between rows.
      // The L turns in cell (tc, sr); that corner and every cell it passes through must be empty.
      const lFree = !occupied.has(`${tc},${sr}`) && !blocked(cellsBetween(sr, sc, tc, "row")) && !blocked(cellsBetween(tc, sr, tr, "col"));
      plan = lFree
        ? { l, key, s, t, shape: "L", sSide: dc > 0 ? "right" : "left", tSide: dr > 0 ? "top" : "bottom" }
        : { l, key, s, t, shape: "Z", sSide: dr > 0 ? "bottom" : "top", tSide: dr > 0 ? "top" : "bottom" };
    }
    fan.want(plan.s, plan.sSide, key, plan.sSide === "left" || plan.sSide === "right" ? plan.t.cy : plan.t.cx);
    fan.want(plan.t, plan.tSide, key, plan.tSide === "left" || plan.tSide === "right" ? plan.s.cy : plan.s.cx);
    return plan;
  });

  const routes: Route[] = plans.map((p) => {
    const so = fan.offset(p.s, p.sSide, p.key), to = fan.offset(p.t, p.tSide, p.key);
    const a = port(p.s, p.sSide, so), b = port(p.t, p.tSide, to, GAP);
    if (p.shape === "h" || p.shape === "v") return { l: p.l, points: [a, b] };
    if (p.shape === "L") return { l: p.l, points: [a, { x: b.x, y: a.y }, b] };
    const [, sr] = p.s.at!, [, tr] = p.t.at!;
    const down = tr > sr;
    const edgeRow = down ? sr : tr; // the gap just below this row is the channel
    const channel = snap(rowY[edgeRow] + rowH[edgeRow] + ROW_GAP / 2);
    return { l: p.l, points: [a, { x: a.x, y: channel }, { x: b.x, y: channel }, b] };
  });
  return { nodes, routes };
}

// ---------------------------------------------------------------------------
// Automatic ranks (dagre), staggered into a portrait rectangle when top-down
// ---------------------------------------------------------------------------
function rankLayout(spec: FlowchartSpec, sized: Map<string, NodeSize>, theme: VizTheme, H: boolean): { nodes: Placed[]; routes: Route[] } {
  const { gap: GAP, spacing: RANKSEP } = theme.space;
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: H ? "LR" : "TB", nodesep: 40, ranksep: RANKSEP, edgesep: 16, marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));
  spec.nodes.forEach((n) => g.setNode(n.id, { width: sized.get(n.id)!.w, height: sized.get(n.id)!.h }));
  spec.links.forEach((l, i) => g.setEdge(l.source, l.target, {}, `e${i}`));
  dagre.layout(g);

  const nodes: Placed[] = spec.nodes.map((n) => ({ ...n, size: sized.get(n.id)!, cx: snap(g.node(n.id).x), cy: snap(g.node(n.id).y) }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Each rank is re-centred on its own mean, then stepped sideways, so dagre's nudges cannot turn into wiggles.
  if (!H) {
    const rankYs = [...new Set(nodes.map((n) => n.cy))].sort((a, b) => a - b);
    const naturalW = Math.max(...nodes.map((n) => n.cx + n.size.w / 2)) - Math.min(...nodes.map((n) => n.cx - n.size.w / 2));
    const naturalH = Math.max(...nodes.map((n) => n.cy + n.size.h / 2)) - Math.min(...nodes.map((n) => n.cy - n.size.h / 2));
    const step = stagger(rankYs.length, naturalW, naturalH, Math.max(...nodes.map((n) => n.size.w)), theme);
    rankYs.forEach((y, i) => {
      const rank = nodes.filter((n) => n.cy === y);
      const mean = rank.reduce((a, n) => a + n.cx, 0) / rank.length;
      rank.forEach((n) => { n.cx = snap(n.cx - mean + i * step); });
    });
  }

  // Primary axis u runs with the flow, cross axis v across it.
  const U = (n: Placed) => (H ? n.cx : n.cy);
  const V = (n: Placed) => (H ? n.cy : n.cx);
  const DU = (n: Placed) => (H ? n.size.w : n.size.h);
  const DV = (n: Placed) => (H ? n.size.h : n.size.w);
  const pt = (u: number, v: number): Point => (H ? { x: u, y: v } : { x: v, y: u });
  const front: Side = H ? "right" : "bottom", back: Side = H ? "left" : "top", under: Side = H ? "bottom" : "right";

  const forward = (l: DiagramEdge) => U(byId.get(l.target)!) > U(byId.get(l.source)!) + 1;
  const fan = fanner();
  spec.links.forEach((l, i) => {
    const s = byId.get(l.source)!, t = byId.get(l.target)!;
    if (forward(l)) { fan.want(s, front, `e${i}s`, V(t)); fan.want(t, back, `e${i}t`, V(s)); }
    else { fan.want(s, under, `e${i}s`, U(t)); fan.want(t, under, `e${i}t`, U(s)); }
  });

  const maxV = Math.max(...nodes.map((n) => V(n) + DV(n) / 2));
  let lanes = 0;
  const routes: Route[] = spec.links.map((l, i) => {
    const s = byId.get(l.source)!, t = byId.get(l.target)!;
    if (forward(l)) {
      const sv = V(s) + fan.offset(s, front, `e${i}s`), tv = V(t) + fan.offset(t, back, `e${i}t`);
      const su = U(s) + DU(s) / 2, tu = U(t) - DU(t) / 2 - GAP;
      if (Math.abs(sv - tv) < 1) return { l, points: [pt(su, sv), pt(tu, sv)] };
      const mid = snap(su + (tu + GAP - su) / 2);
      return { l, points: [pt(su, sv), pt(mid, sv), pt(mid, tv), pt(tu, tv)] };
    }
    const lane = maxV + 24 + lanes++ * 16;
    const su = U(s) + fan.offset(s, under, `e${i}s`), tu = U(t) + fan.offset(t, under, `e${i}t`);
    return { l, points: [pt(su, V(s) + DV(s) / 2), pt(su, lane), pt(tu, lane), pt(tu, V(t) + DV(t) / 2 + GAP)] };
  });
  return { nodes, routes };
}
