---
name: add-visual
description: How to add or restyle a D3 diagram in the playbook docs (MkDocs Material). Use for any flowchart, diagram, chart, or graphic in docs/.
---

# add-visual

## What

All diagrams are custom **D3** (no Mermaid). Renderers + shared theme live in `docs/javascripts/visuals/`, registered in `mkdocs.yml` under `extra_javascript`:

- `theme.js` — global `window.VIZ` (colors, spacing, fonts, arrowhead factory). **Loads first.**
- `flow-diagram.js` — **linear** pill/rounded node flows. `data-orientation` `LR` | `TD`.
- `graph-diagram.js` — **branching/looping** flows with edge labels + decision nodes. Layout via **dagre** (CDN). Node `kind:"decision"` → diamond; link `label` → edge label.
- `quality-funnel.js` — defense-in-depth funnel.

Pick `flow-diagram` for a simple chain; `graph-diagram` when there are branches, loops, decisions, or edge labels.

One-offs → inline SVG in the `.md`. App-like interactives → a built `<iframe>` component.

## Why

- Site is static (GitHub Pages); D3 runs client-side.
- D3 gives control + interactivity Mermaid can't (e.g. arrow gaps, hover).
- Config lives in a `<template>`, **not** `<script>` — Material's instant navigation rewrites `<script>` tags and breaks the diagram on the second visit.
- External CSS can't reliably style SVG internals — theme through `window.VIZ` in JS instead.

## How

Author in a page:

```html
<div class="flow-diagram" data-orientation="TD">
<template>
{ "nodes": [ { "id": "a", "label": "Title", "sub": "optional subtitle" } ],
  "links": [ { "source": "a", "target": "b", "dir": "both" } ] }
</template>
</div>
```

New renderer — copy an existing one; it must:

1. `window.document$.subscribe(renderAll)` — runs on load + every instant nav.
2. Be idempotent — clear prior `svg` first.
3. Read all style from `window.VIZ` (never hardcode).
4. Read config from `container.querySelector("template").content.textContent`.
5. Be registered in `mkdocs.yml` after `visuals/theme.js`.

Verify: `mkdocs build --strict` is clean and the `<template>` JSON is present in `site/<page>/index.html`. Don't headless-screenshot — ask the user to check, including navigate-away-and-back.

## Theme (`visuals/theme.js`)

- Dark-first: black fill `#000`, white borders/labels/lines, muted text `#a1a1aa`, violet accent, green `good`.
- No same-hue text on its own fill.
- Boundary = color delta (solid fill, no border) when fill ≠ page bg; thin white border only for black nodes (fill = page bg).
- No dark-grey on black.
- Visible gap between arrowheads and their targets (`VIZ.space.gap`).
- `defect` (error accent) is tunable, not canonical — readable, not neon.

## Layout — the sizing system

- **Render at natural pixel size; never scale to fit.** SVGs are sized in real px (not `width:100%`), so the font is always the intended size. This is the rule that prevents the "stretched diagram → shrunk font" problem. Don't reintroduce `width:100%` / `max-width` scaling on the SVG.
- A diagram wider than the content column **scrolls horizontally** (container `overflow-x:auto` in `extra.css`); a narrower one centers.
- Therefore: **design each diagram to fit the content column at natural size** where you can — keep node count and label lengths reasonable. Very wide flows will scroll, which is acceptable but a signal to simplify or split.
- To narrow a wide node, put a `\n` in its `label` to wrap it onto multiple lines (supported by `graph-diagram`).
- Default orientation `LR`; use `TD` only when genuinely top-down.
