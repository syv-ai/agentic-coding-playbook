import * as d3 from "d3";
import * as dagre from "@dagrejs/dagre";
import type { VizTheme } from "./theme";

export interface GraphNode { id: string; label: string; sub?: string; kind?: "decision" }
export interface GraphLink { source: string; target: string; label?: string; dir?: "both" }
export interface GraphSpec { nodes: GraphNode[]; links: GraphLink[] }
export interface GraphOptions { orientation?: "LR" | "TD"; theme: VizTheme }

interface SizedNode extends GraphNode { lines: string[]; w: number; h: number; pill: boolean }
interface LaidOutNode extends SizedNode { cx: number; cy: number }
interface Point { x: number; y: number }
interface Edge { v: string; w: string; points: Point[]; label?: string; lx?: number; ly?: number; both: boolean }

/** Branching/looping flow: dagre for layout, our primitives for drawing. */
export function renderGraph(container: HTMLElement, spec: GraphSpec, { orientation = "LR", theme }: GraphOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());

  const COL = theme.colors;
  const GAP = theme.space.gap;
  const M = theme.space.margin;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const EDGEFONT = theme.fonts.sub;
  const PAD_X = 14;
  const rankdir = orientation === "TD" ? "TB" : "LR";

  // ---- Node sizing (labels may contain \n for multiple lines) ------------
  const LH = 18, SUBLH = 14, SUBGAP = 2;
  const sized: Record<string, SizedNode> = {};
  spec.nodes.forEach((nd) => {
    const lines = String(nd.label).split("\n");
    const textW = Math.max(
      ...lines.map((l) => theme.measure(l, FONT)),
      nd.sub ? theme.measure(nd.sub, SUBFONT) : 0
    );
    const contentH = lines.length * LH + (nd.sub ? SUBGAP + SUBLH : 0);
    let w: number, h: number;
    if (nd.kind === "decision") {
      w = Math.max(132, textW * 1.7 + 28);
      h = contentH + 46; // diamonds need extra room around the text
    } else {
      w = Math.max(96, textW + PAD_X * 2);
      h = contentH + 24;
    }
    sized[nd.id] = { ...nd, lines, w, h, pill: lines.length === 1 && !nd.sub && nd.kind !== "decision" };
  });

  // ---- dagre layout ------------------------------------------------------
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir, nodesep: 42, ranksep: theme.space.spacing, edgesep: 18, marginx: M, marginy: M });
  g.setDefaultEdgeLabel(() => ({}));
  spec.nodes.forEach((nd) => g.setNode(nd.id, { width: sized[nd.id].w, height: sized[nd.id].h }));
  spec.links.forEach((l, i) => {
    const cfg: Record<string, unknown> = {};
    if (l.label) { cfg.label = l.label; cfg.width = theme.measure(l.label, EDGEFONT) + 10; cfg.height = 16; }
    g.setEdge(l.source, l.target, cfg, "e" + i);
  });
  dagre.layout(g);

  const pull = (a: Point, b: Point, d: number): Point => {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: a.x + (dx / len) * d, y: a.y + (dy / len) * d };
  };
  const nodes: LaidOutNode[] = g.nodes().map((id) => ({ ...sized[id], cx: g.node(id).x, cy: g.node(id).y }));
  const edges: Edge[] = g.edges().map((e) => {
    const ed = g.edge(e) as { points: Point[]; label?: string; x?: number; y?: number };
    const pts = ed.points.map((p) => ({ x: p.x, y: p.y }));
    if (pts.length >= 2) {
      pts[0] = pull(pts[0], pts[1], GAP);
      pts[pts.length - 1] = pull(pts[pts.length - 1], pts[pts.length - 2], GAP);
    }
    const link = spec.links.find((l) => l.source === e.v && l.target === e.w);
    return { v: e.v, w: e.w, points: pts, label: ed.label, lx: ed.x, ly: ed.y, both: Boolean(link && link.dir === "both") };
  });
  const G = g.graph() as { width?: number; height?: number };
  const W = G.width ?? 0;
  const H = G.height ?? 0;

  // ---- Render ------------------------------------------------------------
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W)
    .attr("height", H)
    .style("display", "inline-block"); // natural size; container centers/scrolls

  const ARROW = theme.arrow(svg, `graph-arrow-${Math.random().toString(36).slice(2, 8)}`, COL.line);
  const lineGen = d3.line<Point>().x((p) => p.x).y((p) => p.y).curve(d3.curveCatmullRom.alpha(0.5));

  svg
    .append("g")
    .selectAll("path")
    .data(edges)
    .join("path")
    .attr("class", "edge")
    .attr("d", (d) => lineGen(d.points))
    .attr("fill", "none")
    .attr("stroke", COL.line)
    .attr("stroke-width", 1.4)
    .attr("marker-end", ARROW)
    .attr("marker-start", (d) => (d.both ? ARROW : null));

  const labelled = edges.filter((d): d is Edge & { label: string } => Boolean(d.label));
  const edgeLabels = svg
    .append("g")
    .selectAll("g")
    .data(labelled)
    .join("g")
    .attr("transform", (d) => `translate(${d.lx ?? 0},${d.ly ?? 0})`);
  edgeLabels
    .append("rect")
    .attr("x", (d) => -(theme.measure(d.label, EDGEFONT) + 10) / 2)
    .attr("y", -9)
    .attr("width", (d) => theme.measure(d.label, EDGEFONT) + 10)
    .attr("height", 18)
    .attr("rx", 4)
    .attr("fill", COL.bg);
  edgeLabels
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("fill", COL.sub)
    .style("font", EDGEFONT)
    .text((d) => d.label);

  const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.cx - d.w / 2},${d.cy - d.h / 2})`);

  node.each(function (d) {
    const sel = d3.select(this);
    if (d.kind === "decision") {
      sel
        .append("polygon")
        .attr("points", `${d.w / 2},0 ${d.w},${d.h / 2} ${d.w / 2},${d.h} 0,${d.h / 2}`)
        .attr("fill", COL.fill).attr("stroke", COL.border).attr("stroke-width", 1);
    } else {
      sel
        .append("rect")
        .attr("width", d.w).attr("height", d.h)
        .attr("rx", d.pill ? d.h / 2 : 10).attr("ry", d.pill ? d.h / 2 : 10)
        .attr("fill", COL.fill).attr("stroke", COL.border).attr("stroke-width", 1);
    }
    // Label (one <text> per line) + optional sub, vertically centered.
    const total = d.lines.length * LH + (d.sub ? SUBGAP + SUBLH : 0);
    const top = (d.h - total) / 2;
    d.lines.forEach((ln, i) => {
      sel
        .append("text")
        .attr("x", d.w / 2)
        .attr("y", top + LH / 2 + i * LH)
        .attr("text-anchor", "middle").attr("dominant-baseline", "central")
        .attr("fill", COL.text).style("font", FONT)
        .text(ln);
    });
    if (d.sub) {
      sel
        .append("text")
        .attr("x", d.w / 2)
        .attr("y", top + d.lines.length * LH + SUBGAP + SUBLH / 2)
        .attr("text-anchor", "middle").attr("dominant-baseline", "central")
        .attr("fill", COL.sub).style("font", SUBFONT)
        .text(d.sub);
    }
  });

  // Slow, looping motion along every edge; the loop's cycle reads as a cycle without any pointer.
  edges.forEach((e, i) => {
    const d = lineGen(e.points);
    if (d) theme.travel(svg, d, COL.accent, 3.5, i * 0.7);
  });
}
