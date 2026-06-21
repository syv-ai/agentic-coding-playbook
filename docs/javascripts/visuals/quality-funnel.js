/* ============================================================================
   quality-funnel.js — a "defense in depth" funnel (D3), theme-aware.

     <div class="funnel-diagram">
       <template>
       {
         "entry": { "label": "Raw code", "defects": ["style","logic",...] },
         "layers": [ { "label": "Formatter / linter", "catches": "style" }, ... ],
         "exit": { "label": "Merged with confidence" }
       }
       </template>
     </div>

   Code enters wide at the top; each layer narrows the funnel and sheds the
   defect class it catches (shown in the right-hand column). Hovering a layer
   highlights it and the class it removes. Re-renders on instant navigation.
   ========================================================================== */
(function () {
  function render(container) {
    if (typeof d3 === "undefined") return;
    // Config lives in a <template> (not a <script>): Material's instant
    // navigation re-creates <script> tags and drops their type attribute.
    const dataEl = container.querySelector("template");
    if (!dataEl) return;
    let spec;
    try {
      spec = JSON.parse(dataEl.content.textContent);
    } catch (e) {
      return;
    }
    container.querySelectorAll("svg").forEach((s) => s.remove());

    const COL = window.VIZ.colors();
    const GAP = window.VIZ.space.gap; // gap between arrows and what they point at
    const M = window.VIZ.space.margin;
    const FONT = window.VIZ.fonts.label;
    const SUBFONT = window.VIZ.fonts.sub;
    const CHIPFONT = window.VIZ.fonts.chip;

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

    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (t, font) => {
      ctx.font = font;
      return ctx.measureText(t).width;
    };

    const leftPad = 8;
    const cx = leftPad + TOP_W / 2;
    const chipX = leftPad + TOP_W + CHIP_GUTTER;
    const chipW =
      Math.max(...layers.map((l) => measure(l.catches, CHIPFONT)), 40) + 38; // room for "✕ "
    const totalW = chipX + chipW + leftPad;

    const funnelY = ENTRY_H;
    const funnelH = n * BAND_H;
    const exitY = funnelY + funnelH + EXIT_GAP;
    const totalH = exitY + EXIT_H;

    const widthAt = (t) => TOP_W + (BOT_W - TOP_W) * t; // t in [0,1]

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `${-M} ${-M} ${totalW + 2 * M} ${totalH + 2 * M}`)
      .attr("width", totalW + 2 * M)
      .attr("height", totalH + 2 * M)
      .style("display", "inline-block"); // natural size; container centers/scrolls

    const ARROW = window.VIZ.arrow(svg, "funnel-arrow", COL.border);

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
    const bandData = layers.map((l, i) => {
      const yTop = funnelY + i * BAND_H;
      const wTop = widthAt(i / n);
      const wBot = widthAt((i + 1) / n);
      const rightMid = cx + (wTop + wBot) / 4; // right edge at mid-height
      return { ...l, i, yTop, wTop, wBot, rightMid, yMid: yTop + BAND_H / 2 };
    });

    const trap = (d) => {
      const lt = cx - d.wTop / 2,
        rt = cx + d.wTop / 2,
        lb = cx - d.wBot / 2,
        rb = cx + d.wBot / 2;
      return `M${lt},${d.yTop} L${rt},${d.yTop} L${rb},${d.yTop + BAND_H} L${lb},${d.yTop + BAND_H} Z`;
    };

    // Connectors from each band to its shed-defect chip.
    const connectors = svg
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

    // --- Interactivity -------------------------------------------------------
    function focus(i) {
      bands.style("opacity", (d) => (d.i === i ? 1 : 0.35));
      bands.select("path").attr("stroke", (d) => (d.i === i ? COL.accent : COL.border)).attr("stroke-width", (d) => (d.i === i ? 2 : 1));
      chips.style("opacity", (d) => (d.i === i ? 1 : 0.3));
      chips.select("rect").attr("fill", (d) => (d.i === i ? COL.accent : COL.defect));
      connectors.attr("stroke", (d) => (d.i === i ? COL.accent : COL.chipBorder)).attr("opacity", (d) => (d.i === i ? 1 : 0.4));
    }
    function reset() {
      bands.style("opacity", 1);
      bands.select("path").attr("stroke", COL.border).attr("stroke-width", 1);
      chips.style("opacity", 1);
      chips.select("rect").attr("fill", COL.defect);
      connectors.attr("stroke", COL.chipBorder).attr("opacity", 1);
    }

    bands.style("cursor", "pointer").on("pointerenter", (e, d) => focus(d.i)).on("pointerleave", reset);
    chips.style("cursor", "pointer").on("pointerenter", (e, d) => focus(d.i)).on("pointerleave", reset);
  }

  function renderAll() {
    document.querySelectorAll(".funnel-diagram").forEach(render);
  }

  if (typeof window.document$ !== "undefined") {
    window.document$.subscribe(renderAll);
  } else {
    document.addEventListener("DOMContentLoaded", renderAll);
  }
})();
