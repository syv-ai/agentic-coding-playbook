# Visuals — custom D3 diagrams

All diagrams on the playbook site are custom **D3** (no Mermaid). This directory holds the renderers and the shared theme.

## Files

- **`theme.js`** — the global theme (`window.VIZ`): colors, spacing (incl. the arrow→target `gap`), fonts, and a shared arrowhead factory. **Loads first.** Change a value here and every diagram updates. Never hardcode colors/spacing in a renderer.
- **`flow-diagram.js`** — pill (single-line) / rounded (with `sub`) node flows. `data-orientation="LR"` or `"TD"`. Arrow gaps + hover highlight.
- **`quality-funnel.js`** — a "defense in depth" funnel with shed-defect chips.

Each renderer is registered in `mkdocs.yml` under `extra_javascript`, **after** `theme.js`.

## Authoring a diagram in a page

Put the config in a **`<template>`** (never a `<script>` — Material's instant navigation rewrites script tags and breaks the diagram on the second visit):

```html
<div class="flow-diagram" data-orientation="TD">
<template>
{ "nodes": [ { "id": "a", "label": "Title", "sub": "optional subtitle" } ],
  "links": [ { "source": "a", "target": "b", "dir": "both" } ] }
</template>
</div>
```

## Writing a new renderer

Copy the shape of an existing file. A renderer must:

1. Render via Material's lifecycle: `window.document$.subscribe(renderAll)` (fires on first load **and** every instant navigation).
2. Be idempotent — clear prior output first: `container.querySelectorAll("svg").forEach(s => s.remove())`.
3. Read colors/spacing/fonts from `window.VIZ` — never hardcode.
4. Read config from `container.querySelector("template").content.textContent`.

## Design rules

- No same-hue text on its own background — text must contrast with the element's fill.
- Mark boundaries with a color delta (solid fill, no border) **when** the fill differs from the page background; use a thin white border only for black-filled nodes whose fill equals the page.
- No dark-grey on black — keep muted greys light enough to read.
- Keep a visible gap between arrowheads and what they point at (`VIZ.space.gap`).
- The error/"defect" accent (`VIZ.colors().defect`) is tunable, not canonical — keep it readable, not neon.

Full guidance: the `/add-visual` skill in `.claude/skills/add-visual/`.
