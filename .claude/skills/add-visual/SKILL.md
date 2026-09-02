---
name: add-visual
description: How to add or restyle a D3 diagram in a playbook chapter (Astro, web/). Use for any flowchart, diagram, chart, or graphic in a chapter.
---

# add-visual

## What

All diagrams are custom **D3** (no Mermaid), rendered client-side by `web/src/lib/viz/` and placed with the `<Visual>` component:

- `flow` — linear chain of pill/rounded nodes. `orientation` `LR` | `TD`.
- `graph` — branching/looping flows with edge labels and decision diamonds; layout via dagre. Node `kind: "decision"` → diamond; link `label` → edge label; `dir: "both"` → arrowheads at both ends.
- `funnel` — defence-in-depth funnel: entry, layers that each shed a defect class, exit.

Pick `flow` for a chain, `graph` when there are branches, loops, decisions or edge labels. One-offs → inline SVG in the MDX. App-like interactives → a React island in the chapter's `_components/` folder.

## How

In a chapter `.mdx`:

```mdx
import Visual from "../../../components/Visual.astro";

<Visual kind="graph" orientation="LR" caption="One line under the figure."
  spec={{ nodes: [{ id: "a", label: "Title", sub: "optional" }], links: [{ source: "a", target: "b", label: "yes" }] }} />
```

The spec is serialised into `data-spec`; `mountVisuals()` renders every figure on load, redraws when the theme changes, and reveals on scroll.

New renderer: add `web/src/lib/viz/<kind>.ts` exporting `render<Kind>(container, spec, { theme, ... })`, register it in `index.ts`, add the kind to `Visual.astro`'s prop type, and write a jsdom test like `flow.test.ts`. It must:

1. Clear any previous `svg` in the container first (idempotent).
2. Read every colour, font and spacing value from the `VizTheme` passed in (never hardcode).
3. Measure text with `theme.measure`, not a canvas of its own.
4. Render at natural pixel size; the container scrolls horizontally if the diagram is wider than the column.
5. Use slow, looping motion (`theme.travel` sends a dot along a path forever) rather than hover effects. Skip motion when `theme.animate` is false.

## Theme

Colours come from CSS custom properties (`--viz-*` in `web/src/styles/global.css`), one set for light and one for dark. The deck forces the dark set. Rules: no same-hue text on its own fill; boundary by colour delta when fill ≠ background, a thin border only when fill = background; no dark grey on black; a visible gap between arrowheads and targets (`theme.space.gap`).

## Verify

`npm test` and `npm run build` in `web/` are clean. Then ask the user to look at the chapter in both the book and deck views and in both themes. Do not headless-screenshot.
