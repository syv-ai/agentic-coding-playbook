/* ============================================================================
   flow-diagram.js — interactive, theme-aware flow diagrams (D3)
   Author content as:

     <div class="flow-diagram" data-orientation="LR">
       <template>
         { "nodes": [...], "links": [...] }
       </template>
     </div>

   Node:  { "id": "a", "label": "Title", "sub": "optional subtitle" }
   Link:  { "source": "a", "target": "b", "dir": "both" }   // dir omitted = one-way

   Single-line nodes render as pills; nodes with a subtitle render as rounded
   rectangles. Arrows keep a visible GAP from each box. Hovering a node
   highlights it and its connections. Re-renders on Material instant-navigation.
   ========================================================================== */
(function () {
  function render(container) {
    if (typeof d3 === "undefined") return;
    // Config lives in a <template> (not a <script>): Material's instant
    // navigation re-creates <script> tags and drops their type attribute,
    // which would break a JSON data script on the second visit.
    const dataEl = container.querySelector("template");
    if (!dataEl) return;

    let spec;
    try {
      spec = JSON.parse(dataEl.content.textContent);
    } catch (e) {
      return;
    }

    // Clear any previous render (instant navigation re-invokes this).
    container.querySelectorAll("svg").forEach((s) => s.remove());

    const horizontal = (container.dataset.orientation || "LR").toUpperCase() === "LR";

    const COL = window.VIZ.colors();
    const { gap: GAP, spacing: SPACING, margin: MARGIN } = window.VIZ.space;
    const FONT = window.VIZ.fonts.label;
    const SUBFONT = window.VIZ.fonts.sub;
    const PAD_X = 14; // horizontal text padding inside a node

    // Off-DOM canvas for text measurement.
    const ctx = document.createElement("canvas").getContext("2d");
    const measure = (t, font) => {
      ctx.font = font;
      return ctx.measureText(t).width;
    };

    const nodes = spec.nodes.map((n) => {
      const w = Math.max(
        96,
        Math.max(measure(n.label, FONT), n.sub ? measure(n.sub, SUBFONT) : 0) + PAD_X * 2
      );
      return { ...n, w, h: n.sub ? 62 : 44, pill: !n.sub };
    });

    const maxW = Math.max(...nodes.map((n) => n.w));
    const maxH = Math.max(...nodes.map((n) => n.h));

    let cursor = 0;
    nodes.forEach((n) => {
      if (horizontal) {
        n.x = cursor;
        n.y = (maxH - n.h) / 2;
        cursor += n.w + SPACING;
      } else {
        n.x = (maxW - n.w) / 2;
        n.y = cursor;
        cursor += n.h + SPACING;
      }
    });

    const totalW = horizontal ? cursor - SPACING : maxW;
    const totalH = horizontal ? maxH : cursor - SPACING;
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `${-MARGIN} ${-MARGIN} ${totalW + 2 * MARGIN} ${totalH + 2 * MARGIN}`)
      .attr("width", totalW + 2 * MARGIN)
      .attr("height", totalH + 2 * MARGIN)
      .style("display", "inline-block"); // natural size; container centers/scrolls

    // Shared arrowhead marker.
    const ARROW = window.VIZ.arrow(svg, "flow-arrow", COL.line);

    // Links (with a gap from each node edge).
    const links = svg
      .append("g")
      .selectAll("line")
      .data(spec.links)
      .join("line")
      .each(function (l) {
        const s = byId[l.source];
        const t = byId[l.target];
        let x1, y1, x2, y2;
        if (horizontal) {
          y1 = s.y + s.h / 2;
          y2 = t.y + t.h / 2;
          x1 = s.x + s.w + GAP;
          x2 = t.x - GAP;
        } else {
          x1 = s.x + s.w / 2;
          x2 = t.x + t.w / 2;
          y1 = s.y + s.h + GAP;
          y2 = t.y - GAP;
        }
        d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
      })
      .attr("stroke", COL.line)
      .attr("stroke-width", 1.4)
      .attr("marker-end", ARROW)
      .attr("marker-start", (l) => (l.dir === "both" ? ARROW : null));

    // Nodes.
    const g = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    g.append("rect")
      .attr("width", (d) => d.w)
      .attr("height", (d) => d.h)
      .attr("rx", (d) => (d.pill ? d.h / 2 : 10))
      .attr("ry", (d) => (d.pill ? d.h / 2 : 10))
      .attr("fill", COL.fill)
      .attr("stroke", COL.border)
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", (d) => d.w / 2)
      .attr("y", (d) => (d.sub ? d.h / 2 - 7 : d.h / 2))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", COL.text)
      .style("font", FONT)
      .text((d) => d.label);

    g.filter((d) => d.sub)
      .append("text")
      .attr("x", (d) => d.w / 2)
      .attr("y", (d) => d.h / 2 + 12)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", COL.sub)
      .style("font", SUBFONT)
      .text((d) => d.sub);

    // Hover interactivity: highlight a node and its connections.
    const adj = {};
    spec.links.forEach((l) => {
      (adj[l.source] = adj[l.source] || new Set()).add(l.target);
      (adj[l.target] = adj[l.target] || new Set()).add(l.source);
    });

    g.style("cursor", "pointer")
      .on("pointerenter", function (ev, d) {
        const near = (id) => id === d.id || (adj[d.id] && adj[d.id].has(id));
        g.style("opacity", (n) => (near(n.id) ? 1 : 0.3));
        d3.select(this).select("rect").attr("stroke", COL.accent).attr("stroke-width", 2);
        links
          .attr("stroke", (l) => (l.source === d.id || l.target === d.id ? COL.accent : COL.line))
          .attr("opacity", (l) => (l.source === d.id || l.target === d.id ? 1 : 0.25));
      })
      .on("pointerleave", function () {
        g.style("opacity", 1);
        g.select("rect").attr("stroke", COL.border).attr("stroke-width", 1);
        links.attr("stroke", COL.line).attr("opacity", 1);
      });
  }

  function renderAll() {
    document.querySelectorAll(".flow-diagram").forEach(render);
  }

  if (typeof window.document$ !== "undefined") {
    window.document$.subscribe(renderAll); // Material: fires on load + each instant nav
  } else {
    document.addEventListener("DOMContentLoaded", renderAll);
  }
})();
