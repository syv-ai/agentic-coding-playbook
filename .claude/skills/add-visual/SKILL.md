---
name: add-visual
description: How to add or restyle a D3 diagram in the playbook docs (MkDocs Material). Use for any flowchart, diagram, chart, or graphic in docs/.
---

# add-visual

## What

All diagrams are custom **D3** (no Mermaid). Renderers + shared theme live in `docs/javascripts/visuals/`, registered in `mkdocs.yml` under `extra_javascript`:

- `theme.js` — global `window.VIZ` (colors, spacing, fonts, arrowhead factory). **Loads first.**
- `flow-diagram.js` — pill (single-line) / rounded (with `sub`) node flows. `data-orientation` `LR` | `TD`.
- `quality-funnel.js` — defense-in-depth funnel.

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
