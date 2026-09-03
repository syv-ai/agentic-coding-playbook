import * as d3 from "d3";
import type { VizTheme } from "./theme";
import { drawEdgeLabel, drawNode, markers, newSvg, pulseNode, sizeNode, snapUp, type DiagramNode, type NodeSize, type Point } from "./primitives";

export interface LoopStation extends DiagramNode {
  /** Label on this station's spoke to the hub. */
  spokeLabel?: string;
}
export interface LoopSpec {
  /** 3 to 8 stations, clockwise from the top. The last always feeds the first. */
  stations: LoopStation[];
  /** Optional shared centre that every pass writes to. */
  hub?: { label: string; sub?: string };
  /** Direction of the hub spokes. Default "in": stations write to the hub. */
  spokes?: "in" | "out" | "none";
}
export interface LoopOptions { theme: VizTheme; title?: string }

interface Station extends LoopStation { size: NodeSize; theta: number; cx: number; cy: number }

/** Reinforcing cycle: stations on a ring, clockwise arrows between neighbours, dashed spokes to a hub. */
export function renderLoop(container: HTMLElement, spec: LoopSpec, { theme, title }: LoopOptions): void {
  const C = theme.colors;
  const { gap: GAP, margin: M } = theme.space;
  const N = spec.stations.length;

  const stations: Station[] = spec.stations.map((s, k) => ({
    ...s, size: sizeNode(s, theme, 144), theta: -Math.PI / 2 + (k * 2 * Math.PI) / N, cx: 0, cy: 0,
  }));
  const maxW = Math.max(...stations.map((s) => s.size.w));
  const maxH = Math.max(...stations.map((s) => s.size.h));
  const hubSize = spec.hub ? sizeNode({ id: "hub", label: spec.hub.label, sub: spec.hub.sub }, theme, 176) : undefined;
  if (hubSize) hubSize.h = snapUp(hubSize.h + 24);
  const R = snapUp(Math.max(160, (N * (maxW + 48)) / (2 * Math.PI), hubSize ? Math.hypot(hubSize.w / 2, hubSize.h / 2) + maxH / 2 + 40 : 0), 8);
  const W = 2 * R + maxW + 2 * M, Hh = 2 * R + maxH + 2 * M;
  const cx = W / 2, cy = Hh / 2;
  stations.forEach((s) => { s.cx = cx + R * Math.cos(s.theta); s.cy = cy + R * Math.sin(s.theta); });

  const svg = newSvg(container, W, Hh, title);
  const mk = markers(svg, theme);
  const onRing = (a: number): Point => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  const inside = (s: Station, p: Point) => Math.abs(p.x - s.cx) <= s.size.w / 2 && Math.abs(p.y - s.cy) <= s.size.h / 2;
  /**
   * Angular distance from a station's centre to where the ring leaves its box, in one direction.
   * Found numerically so every arc stays on one circle; a box on a ring is not symmetric about its radius.
   */
  const edgeAngle = (s: Station, sign: 1 | -1) => {
    let d = 0;
    const stepA = Math.PI / 720;
    while (d < Math.PI / N && inside(s, onRing(s.theta + sign * d))) d += stepA;
    return d;
  };
  const gapA = GAP / R;

  // Ring arcs first (behind stations), clockwise from each station to the next.
  const ring = svg.append("g").attr("class", "ring-arcs");
  stations.forEach((s, k) => {
    const t = stations[(k + 1) % N];
    const a0 = s.theta + edgeAngle(s, 1) + gapA / 2;
    const a1 = t.theta + (k + 1 === N ? 2 * Math.PI : 0) - edgeAngle(t, -1) - gapA;
    const p0 = onRing(a0), p1 = onRing(a1);
    ring.append("path").attr("class", "ring")
      .attr("d", `M${p0.x.toFixed(3)},${p0.y.toFixed(3)} A${R},${R} 0 0 1 ${p1.x.toFixed(3)},${p1.y.toFixed(3)}`)
      .attr("fill", "none").attr("stroke", C.sub).attr("stroke-width", 1.2).attr("marker-end", mk.plain);
  });

  // Spokes: dashed radii between each station and the hub, arrowhead stopping a gap short.
  const spokes = svg.append("g").attr("class", "spokes");
  const dir = spec.spokes ?? "in";
  if (spec.hub && hubSize && dir !== "none") {
    const boxDist = (ux: number, uy: number, hw: number, hh: number) => Math.min(hw / (Math.abs(ux) || 1e-9), hh / (Math.abs(uy) || 1e-9));
    stations.forEach((s) => {
      const ux = Math.cos(s.theta), uy = Math.sin(s.theta);
      const dS = boxDist(ux, uy, s.size.w / 2, s.size.h / 2);
      const dH = boxDist(ux, uy, hubSize.w / 2, hubSize.h / 2);
      const near = { x: s.cx - ux * (dS + (dir === "out" ? GAP : 0)), y: s.cy - uy * (dS + (dir === "out" ? GAP : 0)) };
      const far = { x: cx + ux * (dH + (dir === "in" ? GAP : 0)), y: cy + uy * (dH + (dir === "in" ? GAP : 0)) };
      const [a, b] = dir === "in" ? [near, far] : [far, near];
      spokes.append("line").attr("class", "spoke").attr("x1", a.x).attr("y1", a.y).attr("x2", b.x).attr("y2", b.y)
        .attr("stroke", C.chipBorder).attr("stroke-width", 1).attr("stroke-dasharray", "4 3").attr("marker-end", mk.plain);
      if (s.spokeLabel) drawEdgeLabel(spokes, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, s.spokeLabel, theme, Math.abs(ux) < 0.3 ? "beside" : "above");
    });
  }

  const groups = svg.append("g").selectAll("g").data(stations).join("g")
    .attr("class", "station node").attr("transform", (d) => `translate(${(d.cx - d.size.w / 2).toFixed(1)},${(d.cy - d.size.h / 2).toFixed(1)})`);
  groups.each(function (d) { drawNode(d3.select(this), d, d.size, theme); });

  let hubG: d3.Selection<any, any, any, any> | undefined;
  if (spec.hub && hubSize) {
    hubG = svg.append("g").attr("class", "hub node").attr("transform", `translate(${cx - hubSize.w / 2},${cy - hubSize.h / 2})`);
    const shape = drawNode(hubG, { id: "hub", label: spec.hub.label, sub: spec.hub.sub, kind: "store" }, hubSize, theme);
    // The hub is the one inverted box: ink fill, paper text.
    shape.attr("fill", C.text).attr("stroke", C.text);
    hubG.selectAll("text").attr("fill", C.bg);
  }

  // Motion: stations clockwise, then the hub; ring and spokes stay still.
  const slots = N + (hubG ? 1 : 0);
  groups.each(function (d, i) { pulseNode(d3.select(this), d, theme, i, slots); });
  if (hubG) pulseNode(hubG, { id: "hub", label: spec.hub!.label }, theme, N, slots);
}
