import * as d3 from "d3";
import type { VizTheme } from "./theme";

export interface FunnelSpec {
  entry?: { label?: string; defects?: string[] };
  layers: { label: string; catches: string }[];
  exit?: { label?: string };
}
export interface FunnelOptions { theme: VizTheme }

interface Band { label: string; catches: string; i: number; yTop: number; wTop: number; wBot: number; rightMid: number; yMid: number }

/** Defence-in-depth funnel: code enters wide, each layer sheds the defect class it catches. */
export function renderFunnel(container: HTMLElement, spec: FunnelSpec, { theme }: FunnelOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());

  const COL = theme.colors;
  const GAP = theme.space.gap;
  const M = theme.space.margin;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const CHIPFONT = theme.fonts.chip;

  const TOP_W = 480;
  const BOT_W = 230;
  const BAND_H = 64;
  const ENTRY_H = 50;
  const EXIT_GAP = 36;
  const EXIT_H = 48;
  const CHIP_GUTTER = 46;
  const CHIP_H = 30;

  const layers = spec.layers;
  const n = layers.length;

  const leftPad = 8;
  const cx = leftPad + TOP_W / 2;
  const chipX = leftPad + TOP_W + CHIP_GUTTER;
  const chipW =
    Math.max(...layers.map((l) => theme.measure(l.catches, CHIPFONT)), 40) + 38; // room for "✕ "
  const totalW = chipX + chipW + leftPad;

  const funnelY = ENTRY_H;
  const funnelH = n * BAND_H;
  const exitY = funnelY + funnelH + EXIT_GAP;
  const totalH = exitY + EXIT_H;

  const widthAt = (t: number) => TOP_W + (BOT_W - TOP_W) * t; // t in [0,1]

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `${-M} ${-M} ${totalW + 2 * M} ${totalH + 2 * M}`)
    .attr("width", totalW + 2 * M)
    .attr("height", totalH + 2 * M)
    .style("display", "inline-block"); // natural size; container centers/scrolls

  const ARROW = theme.arrow(svg, `funnel-arrow-${Math.random().toString(36).slice(2, 8)}`, COL.border);

  // --- Entry label ---------------------------------------------------------
  const entry = svg.append("g");
  entry
    .append("text")
    .attr("x", cx)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("fill", COL.text)
    .style("font", FONT)
    .text(spec.entry && spec.entry.label ? spec.entry.label : "Raw code");
  if (spec.entry && spec.entry.defects) {
    entry
      .append("text")
      .attr("x", cx)
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .attr("fill", COL.sub)
      .style("font", SUBFONT)
      .text("potential defects: " + spec.entry.defects.join(" · "));
  }

  // --- Funnel bands --------------------------------------------------------
  const bandData: Band[] = layers.map((l, i) => {
    const yTop = funnelY + i * BAND_H;
    const wTop = widthAt(i / n);
    const wBot = widthAt((i + 1) / n);
    const rightMid = cx + (wTop + wBot) / 4; // right edge at mid-height
    return { ...l, i, yTop, wTop, wBot, rightMid, yMid: yTop + BAND_H / 2 };
  });

  const trap = (d: Band) => {
    const lt = cx - d.wTop / 2,
      rt = cx + d.wTop / 2,
      lb = cx - d.wBot / 2,
      rb = cx + d.wBot / 2;
    return `M${lt},${d.yTop} L${rt},${d.yTop} L${rb},${d.yTop + BAND_H} L${lb},${d.yTop + BAND_H} Z`;
  };

  // Connectors from each band to its shed-defect chip.
  svg
    .append("g")
    .selectAll("line")
    .data(bandData)
    .join("line")
    .attr("x1", (d) => d.rightMid + GAP)
    .attr("y1", (d) => d.yMid)
    .attr("x2", chipX - GAP)
    .attr("y2", (d) => d.yMid)
    .attr("stroke", COL.chipBorder)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3 3")
    .attr("marker-end", ARROW);

  const bands = svg
    .append("g")
    .selectAll("g")
    .data(bandData)
    .join("g");

  bands
    .append("path")
    .attr("d", trap)
    .attr("fill", COL.fill)
    .attr("stroke", COL.border)
    .attr("stroke-width", 1);

  bands
    .append("text")
    .attr("x", cx)
    .attr("y", (d) => d.yMid)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("fill", COL.text)
    .style("font", FONT)
    .text((d) => d.label);

  // --- Shed-defect chips (right column) ------------------------------------
  const chips = svg
    .append("g")
    .selectAll("g")
    .data(bandData)
    .join("g")
    .attr("transform", (d) => `translate(${chipX},${d.yMid - CHIP_H / 2})`);

  chips
    .append("rect")
    .attr("width", chipW)
    .attr("height", CHIP_H)
    .attr("rx", CHIP_H / 2)
    .attr("ry", CHIP_H / 2)
    .attr("fill", COL.defect);

  chips
    .append("text")
    .attr("x", chipW / 2)
    .attr("y", CHIP_H / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("fill", COL.defectText)
    .style("font", CHIPFONT)
    .text((d) => "✕ " + d.catches);

  // --- Exit ----------------------------------------------------------------
  const exitW = BOT_W;
  svg
    .append("line")
    .attr("x1", cx)
    .attr("y1", funnelY + funnelH + GAP)
    .attr("x2", cx)
    .attr("y2", exitY - GAP)
    .attr("stroke", COL.border)
    .attr("stroke-width", 1.4)
    .attr("marker-end", ARROW);

  const exit = svg.append("g").attr("transform", `translate(${cx - exitW / 2},${exitY})`);
  exit
    .append("rect")
    .attr("width", exitW)
    .attr("height", EXIT_H)
    .attr("rx", EXIT_H / 2)
    .attr("ry", EXIT_H / 2)
    .attr("fill", COL.fill)
    .attr("stroke", COL.good)
    .attr("stroke-width", 1.4);
  exit
    .append("text")
    .attr("x", exitW / 2)
    .attr("y", EXIT_H / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("fill", COL.text)
    .style("font", FONT)
    .text(spec.exit && spec.exit.label ? spec.exit.label : "Merged");
  exit
    .append("text")
    .attr("x", 18)
    .attr("y", EXIT_H / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("fill", COL.good)
    .style("font", "700 16px sans-serif")
    .text("✓");

  // Sequence: entry, then band and its chip in turn, then the exit; a pause; restart.
  const slots = 2 + n;
  entry.selectAll("text").each(function (_d, i) {
    theme.pulse(d3.select(this), "fill", i === 0 ? COL.text : COL.sub, COL.accent, 0, slots);
  });
  bands.each(function (d) {
    const sel = d3.select(this);
    theme.pulse(sel.select("path"), "fill", COL.fill, COL.accent, 1 + d.i, slots);
    theme.pulse(sel.select("path"), "stroke", COL.border, COL.accent, 1 + d.i, slots);
    theme.pulse(sel.select("text"), "fill", COL.text, COL.accentText, 1 + d.i, slots);
  });
  chips.each(function (d) {
    theme.pulse(d3.select(this).select("rect"), "fill", COL.defect, COL.accent, 1 + d.i, slots);
  });
  theme.pulse(exit.select("rect"), "fill", COL.fill, COL.accent, slots - 1, slots);
  theme.pulse(exit.select("rect"), "stroke", COL.good, COL.accent, slots - 1, slots);
  exit.selectAll("text").each(function () {
    theme.pulse(d3.select(this), "fill", d3.select(this).attr("fill"), COL.accentText, slots - 1, slots);
  });
}
