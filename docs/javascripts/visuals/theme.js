/* ============================================================================
   viz-theme.js — global theme for all D3 visualizations on the site.
   Loaded before the individual viz scripts; they read window.VIZ for colors,
   spacing (incl. the arrow→target gap), fonts, and a shared arrowhead factory.
   Change a value here once and every diagram updates.
   ========================================================================== */
window.VIZ = (function () {
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  return {
    // Colors — resolved fresh each call so theme/palette changes are picked up.
    colors() {
      return {
        fill: "#000000",
        border: "#ffffff",
        text: "#ffffff",
        sub: "#a1a1aa", // muted text — light enough to read on black
        line: "#ffffff",
        chipBorder: "#8b8b93", // connector lines
        good: "#7ee787",
        // "defect"/error accent — solid fill, no border. Tunable, not canonical;
        // keep it readable but not neon-intense.
        defect: "#e0857c",
        defectText: "#0a0a0b", // dark text for contrast on the coral chip
        accent: cssVar("--md-accent-fg-color", "#cdbcff"),
      };
    },

    // Spacing, in user units.
    space: {
      gap: 12, // gap between an arrowhead/line end and the element it points at
      spacing: 78, // distance between consecutive nodes in a flow
      margin: 16, // outer SVG margin so arrowheads/strokes aren't clipped
    },

    fonts: {
      label: '600 14px "IBM Plex Sans", sans-serif',
      sub: '11.5px "IBM Plex Sans", sans-serif',
      chip: '12px "IBM Plex Sans", sans-serif',
    },

    /* Append a shared arrowhead marker to an SVG and return its url(#id).
       refX is tuned so the arrow TIP lands at the line end — keep your line
       end `gap` away from the target and the gap stays visible. */
    arrow(svg, id, color) {
      let defs = svg.select("defs");
      if (defs.empty()) defs = svg.append("defs");
      defs
        .append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 8)
        .attr("refY", 5)
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M0,0 L10,5 L0,10 z")
        .attr("fill", color);
      return `url(#${id})`;
    },
  };
})();
