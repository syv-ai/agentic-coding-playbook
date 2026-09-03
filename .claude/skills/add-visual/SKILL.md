---
name: add-visual
description: How to add or restyle a diagram in a playbook chapter (Astro, web/). Use for any flowchart, loop, chain, funnel, or other figure in a chapter.
---

# add-visual

## The forms

Every figure is custom D3 (no Mermaid), rendered client-side by `web/src/lib/viz/` and placed with `<Visual>`. Pick the form by the shape of the idea, not the data:

| Showing | `kind` | Spec |
|---|---|---|
| A chain: this, then this, then this | `flow` | `nodes`, `links`; `orientation` `TD` (default) or `LR` |
| Decision logic, branches, a loop that exits | `flowchart` | `nodes`, `links`; `orientation` |
| A reinforcing cycle where the last step feeds the first, optionally writing to a shared centre | `loop` | `stations` (3 to 8, clockwise from the top), optional `hub`, `spokes` `in`/`out`/`none` |
| Defence in depth: layers that each shed a defect class | `funnel` | `entry`, `layers`, `exit` |

One-offs get inline SVG in the MDX. App-like interactives are React islands in the chapter's `_components/` folder, wrapped in `Interactive`.

Before drawing, ask whether a sentence or a table would do the job. The budget is enforced at build time by `src/lib/viz/budget.ts`: 2 to 9 nodes, at most 2 focal nodes (1 in a loop), 1 accent link, labels of 28 characters per line, edge labels of 14. Over budget, `astro build` fails and names the figure.

## Grammar (shared by every form, in `primitives.ts`)

- **Shape carries type, not colour.** `kind`: `start`/`end` are ovals in the soft fill, `step` is a rectangle in the canvas colour with the ink outline, `decision` is a diamond, `store` is a soft-filled rectangle. The loop hub is the one inverted box.
- **Filled or outlined, never both.** A node in the canvas colour gets the ink outline; any node with a fill (soft, focal, hub) has no border, its colour delta is the boundary. `drawNode` enforces this.
- **Colour is editorial.** At most one or two nodes per figure set `focal: true` and take the accent tint and stroke. At most one link sets `accent: true` (the happy path). If you want to accent four things you have not decided what the figure is about.
- **Labels.** Node names in sans; `sub` (ports, states, qualifiers) in mono, muted, and rare: most nodes need none. Link `label` is short, drawn uppercase mono on an opaque mask with a 6px gap off the stroke, never on it. Every label on the canvas is the standard text colour; only subtitles are muted, and text on a coloured fill takes that fill's text token.
- **Connectors.** Orthogonal with rounded elbows (r = 8), drawn before nodes, a 12px gap before every arrowhead, one attach point per connector when several share a box edge, back-edges in a lane outside the nodes. The ring arcs and hub spokes of `loop` are the sanctioned exceptions. `dashed: true` for optional or return relationships.
- **Grid and size.** Node dimensions are multiples of 8, positions of 4, gaps 24 to 64. Names are 14px, sublabels 11px mono, edge labels 10px mono: readable at natural size, which is the largest the figure is drawn. A figure scales down with the column and never up; the expand button opens it in a lightbox.
- **Layout is editorial.** For anything beyond a plain chain, give every node `at: [column, row]` and compose the figure yourself: a loop is a rectangle of cells with the return running through an empty cell, a branch is two columns, entry above and exit below. Columns and rows size to their widest and tallest node; the router draws the connectors (straight within a row or column, an L through a free cell, otherwise a Z through the row gap). Fill the rectangle: no empty corners, no single column. Automatic ranking (no `at`) is only for chains.
- **Build into a portrait rectangle.** `orientation` defaults to `TD`, and top-down figures step sideways rank by rank (`stagger()` in `primitives.ts`) until they fill about a 3:4 shape, capped at the column width (`theme.space.aspect`, `theme.space.maxWidth`). A single narrow column is as wrong as a figure that overflows. Use `LR` only for a short chain.

## How

```mdx
import Visual from "../../../components/Visual.astro";

<Visual kind="flowchart" caption="One line under the figure; it also becomes the accessible name."
  spec={{
    nodes: [
      { id: "check", label: "Write the check", sub: "before any code", focal: true },
      { id: "pass", label: "Passes?", kind: "decision" },
      { id: "done", label: "Done", kind: "end" },
    ],
    links: [{ source: "check", target: "pass" }, { source: "pass", target: "done", label: "yes" }],
  }} />
```

The spec is serialised into `data-spec`; `mountVisuals()` renders every figure on load, redraws when the theme changes, and reveals on scroll.

## Motion

One rule: **elements light up one after another in reading order, slowly, pause, and restart. Connectors never move.** The pace is one number in `theme.pulse` (1.6s per element, 2.4s rest); do not speed it up per figure. Use `pulseNode(g, node, theme, slot, slots)` for every node of the figure with one shared `slots` count. It is a no-op when `theme.animate` is false (reduced motion). No hover effects, no travelling dots, no blinking.

## Adding a form

Add `web/src/lib/viz/<kind>.ts` exporting `render<Kind>(container, spec, { theme, title, ... })`, built from `primitives.ts` (`sizeNode`, `drawNode`, `elbowPath`, `drawEdgeLabel`, `markers`, `newSvg`, `pulseNode`). Register it in `index.ts`, add the kind to `Visual.astro`, and write a jsdom test like `flowchart.test.ts` that checks the grammar (orthogonal paths, masked labels, grid, pulses on nodes only). Read every colour, font and spacing value from the `VizTheme`; measure text with `theme.measure`; clear any previous `svg` first.

## Theme

Colours are CSS custom properties (`--viz-*` in `web/src/styles/global.css`), one set for light and one for dark; the deck forces the dark set. No same-hue text on its own fill; boundary by colour delta when fill differs from the background, a thin border only when it does not; no dark grey on black.

## Verify

`npm test` and `npm run build` in `web/` are clean. Then ask the user to look at the chapter in both the book and deck views and in both themes. Do not headless-screenshot.
