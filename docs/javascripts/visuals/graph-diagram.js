/* ============================================================================
   graph-diagram.js — branching/looping flow diagrams (D3 render + dagre layout)

     <div class="graph-diagram" data-orientation="LR">
       <template>
       { "nodes": [ { "id": "a", "label": "Title", "sub": "optional", "kind": "decision" } ],
         "links": [ { "source": "a", "target": "b", "label": "yes", "dir": "both" } ] }
       </template>
     </div>

   Layout comes from dagre (handles branches, edge labels, and cycles/loops);
   rendering uses our own primitives + window.VIZ theme. Node `kind:"decision"`
   → diamond. Link `label` → edge label. `dir:"both"` → arrowheads on both ends.
   Arrows keep a visible gap from nodes. Re-renders on Material instant nav.
   ========================================================================== */
(function () {
  function render(container) {
    if (typeof d3 === "undefined" || typeof dagre === "undefined") return;
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
    const GAP = window.VIZ.space.gap;
    const M = window.VIZ.space.margin;
    const FONT = window.VIZ.fonts.label;
    const SUBFONT = window.VIZ.fonts.sub;
    const EDGEFONT = window.VIZ.fonts.sub;
    const PAD_X = 14;
    const rankdir = (container.dataset.orientation || "LR").toUpperCase() === "TD" ? "TB" : "LR";

    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (t, font) => {
      ctx.font = font;
      return ctx.measureText(t).width;
    };

    // ---- Node sizing (labels may contain \n for multiple lines) ------------
    const LH = 18, SUBLH = 14, SUBGAP = 2;
    const sized = {};
    spec.nodes.forEach((nd) => {
      const lines = String(nd.label).split("\n");
      const textW = Math.max(
        ...lines.map((l) => measure(l, FONT)),
        nd.sub ? measure(nd.sub, SUBFONT) : 0
      );
      const contentH = lines.length * LH + (nd.sub ? SUBGAP + SUBLH : 0);
      let w, h;
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
    g.setGraph({ rankdir, nodesep: 42, ranksep: window.VIZ.space.spacing, edgesep: 18, marginx: M, marginy: M });
    g.setDefaultEdgeLabel(() => ({}));
    spec.nodes.forEach((nd) => g.setNode(nd.id, { width: sized[nd.id].w, height: sized[nd.id].h }));
    spec.links.forEach((l, i) => {
      const cfg = {};
      if (l.label) { cfg.label = l.label; cfg.width = measure(l.label, EDGEFONT) + 10; cfg.height = 16; }
      g.setEdge(l.source, l.target, cfg, "e" + i);
    });
    dagre.layout(g);

    const pull = (a, b, d) => {
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      return { x: a.x + (dx / len) * d, y: a.y + (dy / len) * d };
    };
    const nodes = g.nodes().map((id) => ({ ...sized[id], cx: g.node(id).x, cy: g.node(id).y }));
    const edges = g.edges().map((e) => {
      const ed = g.edge(e);
      const pts = ed.points.map((p) => ({ x: p.x, y: p.y }));
      if (pts.length >= 2) {
        pts[0] = pull(pts[0], pts[1], GAP);
        pts[pts.length - 1] = pull(pts[pts.length - 1], pts[pts.length - 2], GAP);
      }
      const link = spec.links.find((l) => l.source === e.v && l.target === e.w);
      return { v: e.v, w: e.w, points: pts, label: ed.label, lx: ed.x, ly: ed.y, both: link && link.dir === "both" };
    });
    const G = g.graph();

    // ---- Render ------------------------------------------------------------
    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${G.width} ${G.height}`)
      .attr("width", G.width)
      .attr("height", G.height)
      .style("display", "inline-block"); // natural size; container centers/scrolls

    const ARROW = window.VIZ.arrow(svg, "graph-arrow", COL.line);
    const ARROW_HI = window.VIZ.arrow(svg, "graph-arrow-hi", COL.accent);
    const lineGen = d3.line().x((p) => p.x).y((p) => p.y).curve(d3.curveCatmullRom.alpha(0.5));

    const edgePaths = svg
      .append("g")
      .selectAll("path")
      .data(edges)
      .join("path")
      .attr("d", (d) => lineGen(d.points))
      .attr("fill", "none")
      .attr("stroke", COL.line)
      .attr("stroke-width", 1.4)
      .attr("marker-end", ARROW)
      .attr("marker-start", (d) => (d.both ? ARROW : null));

    const edgeLabels = svg
      .append("g")
      .selectAll("g")
      .data(edges.filter((d) => d.label))
      .join("g")
      .attr("transform", (d) => `translate(${d.lx},${d.ly})`);
    edgeLabels
      .append("rect")
      .attr("x", (d) => -(measure(d.label, EDGEFONT) + 10) / 2)
      .attr("y", -9)
      .attr("width", (d) => measure(d.label, EDGEFONT) + 10)
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

    // ---- Hover: highlight a node + its incident edges ----------------------
    const shapeOf = (sel) => sel.select("rect,polygon");
    node
      .style("cursor", "pointer")
      .on("pointerenter", function (ev, d) {
        const inc = (ed) => ed.v === d.id || ed.w === d.id;
        node.style("opacity", (nn) => (nn.id === d.id ? 1 : 0.32));
        shapeOf(d3.select(this)).attr("stroke", COL.accent).attr("stroke-width", 2);
        edgePaths
          .attr("stroke", (ed) => (inc(ed) ? COL.accent : COL.line))
          .attr("opacity", (ed) => (inc(ed) ? 1 : 0.22))
          .attr("marker-end", (ed) => (inc(ed) ? ARROW_HI : ARROW))
          .attr("marker-start", (ed) => (ed.both ? (inc(ed) ? ARROW_HI : ARROW) : null));
        edgeLabels.style("opacity", (ed) => (inc(ed) ? 1 : 0.22));
      })
      .on("pointerleave", function () {
        node.style("opacity", 1);
        shapeOf(node).attr("stroke", COL.border).attr("stroke-width", 1);
        edgePaths
          .attr("stroke", COL.line).attr("opacity", 1)
          .attr("marker-end", ARROW)
          .attr("marker-start", (ed) => (ed.both ? ARROW : null));
        edgeLabels.style("opacity", 1);
      });
  }

  function renderAll() {
    document.querySelectorAll(".graph-diagram").forEach(render);
  }

  if (typeof window.document$ !== "undefined") {
    window.document$.subscribe(renderAll);
  } else {
    document.addEventListener("DOMContentLoaded", renderAll);
  }
})();
