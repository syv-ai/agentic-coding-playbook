---
name: add-visual
description: >
  How to add or restyle a D3 diagram in the playbook docs (MkDocs Material).
  Use for any flowchart, diagram, chart, or graphic in docs/.
---

# add-visual

## What

All diagrams in the published playbook docs are custom **D3** (no Mermaid).
Renderers and the shared theme live in `docs/javascripts/visuals/` and are
registered in `mkdocs.yml` under `extra_javascript`:

- `theme.js` — global `window.VIZ` (colors, spacing, fonts, and arrowhead
  factory). **Loads first.**
- `flow-diagram.js` — **linear** pill/rounded node flows. Use
  `data-orientation` `LR` or `TD`.
- `graph-diagram.js` — **branching or looping** flows with edge labels and
  decision nodes. Layout uses **dagre** (CDN). A node with `kind: "decision"`
  becomes a diamond; a link with `label` gets an edge label.
- `quality-funnel.js` — defense-in-depth funnel.

Pick `flow-diagram` for a simple chain; use `graph-diagram` when there are
branches, loops, decisions, or edge labels.

One-offs use inline SVG in the Markdown. App-like interactives use a built
`<iframe>` component.

## Why

- The site is static (GitHub Pages); D3 runs client-side.
- D3 gives control and interactivity Mermaid cannot, such as arrow gaps and
  hover behaviour.
- Put configuration in a `<template>`, **not `<script>`**. Material's instant
  navigation rewrites `<script>` tags and breaks diagrams on the second visit.
- External CSS cannot reliably style SVG internals. Theme through `window.VIZ`
  in JavaScript instead.

## How

Author a diagram in a page:

```html
<div class="flow-diagram" data-orientation="TD">
<template>
{ "nodes": [ { "id": "a", "label": "Title", "sub": "optional subtitle" } ],
  "links": [ { "source": "a", "target": "b", "dir": "both" } ] }
</template>
</div>
```

For a new renderer, copy an existing one. It must:

1. Call `window.document$.subscribe(renderAll)` on load and every instant nav.
2. Be idempotent: clear prior `svg` elements first.
3. Read all style from `window.VIZ`; never hardcode it.
4. Read config from `container.querySelector("template").content.textContent`.
5. Be registered in `mkdocs.yml` after `visuals/theme.js`.

Verify with `mkdocs build --strict` and check that the `<template>` JSON is
present in `site/<page>/index.html`. Do not headless-screenshot; ask the user
to check the rendered page, including navigating away and back.

## Theme (`visuals/theme.js`)

- Dark-first: black fill `#000`, white borders, labels, and lines, muted text
  `#a1a1aa`, violet accent, and green `good`.
- Do not put same-hue text on its own fill.
- Mark a boundary with a color delta (solid fill, no border) when its fill differs
  from the page background. Use a thin white border only for black nodes whose
  fill equals the page background.
- Do not use dark grey on black.
- Keep a visible gap between arrowheads and their targets (`VIZ.space.gap`).
- `defect` (the error accent) is tunable, not canonical; keep it readable, not
  neon.

## Layout — the sizing system

- Render at natural pixel size; never scale to fit. SVGs use real pixel sizes,
  not `width: 100%`, so the font keeps its intended size.
- A diagram wider than the content column scrolls horizontally. A narrower one
  centres. The container provides `overflow-x: auto` in `extra.css`.
- Design each diagram to fit the content column at natural size where possible.
  Very wide flows may scroll, which is acceptable but signals simplification or
  splitting may help.
- Put `\n` in a `graph-diagram` node's `label` to wrap long labels.
- The default orientation is `LR`; use `TD` only for genuinely top-down flows.
