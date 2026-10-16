# HTML Report Format

The architectural review is one self-contained page. Tailwind comes from its CDN; Mermaid from its CDN in a local file, natively in a published page.

**Deliver the page.** If your harness can publish a page (in Claude Code, the `Artifact` tool, when it is in your tool list; load the `artifact-design` skill first), publish it and give the user the link. The page is private to the user until they choose to share it, but publishing does upload it, quoted code included; mention that once. Put the one-sentence summary in the publish description, not the title. To revise it, republish the same file: the link stays and a new version is added. Otherwise write a self-contained HTML file to the OS temp directory, open it in the browser (`open` on macOS, `xdg-open` on Linux, `start ""` on Windows), and give the user the file's full absolute path, resolved (for example with `realpath`) rather than `$TMPDIR/…`, `~` or a relative path.

The same page works both ways, with three differences:

- **Skeleton.** A published page is content only (`<title>`, `<style>`, markup, scripts): the publisher adds `<!doctype>`, `<html>`, `<head>` and `<body>`, and doubled skeleton tags break rendering. A local file is a complete HTML document.
- **Mermaid.** Published pages render `<pre class="mermaid">` natively, so don't load the Mermaid library there. A local file loads it from the CDN.
- **External resources.** Published pages load scripts only from `cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, `unpkg.com`, `cdn.tailwindcss.com` and `code.jquery.com`, and stylesheets only from Google Fonts; other hosts, images and fetches are blocked. Inline everything else so the page works in both.

The rest of the contract applies either way:

- **Title.** A 2–4 word name such as "Checkout service architecture", not "Architecture review — …". The explanation goes in the publish description.
- **Pinned scripts.** Every script URL names an exact version, as in the scaffold. Don't use a bare name, a major-only tag or `@latest`.
- **Both themes.** Colours are tokens on `:root`, redefined under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and again under `:root[data-theme="dark"]`, so a viewer's explicit theme choice wins both ways. `body` gets an explicit background from a token. The scaffold maps the tokens into Tailwind (`bg-paper`, `text-ink`, `border-rule`); use those instead of Tailwind's palette classes and `dark:` variants, which ignore an explicit theme choice. Diagram strokes and fills use the tokens too.
- **Phone width.** Keep a side gutter of at least 16px, let before/after pairs stack below ~720px, and put diagrams and code in their own `overflow-x: auto` container so the page never scrolls sideways.

The scaffold below is the local-file form. To publish it, keep the `<title>`, both Tailwind scripts and the `<style>` block, drop the Mermaid import and the skeleton tags, and keep the `<main>` content.

Mermaid handles graph-shaped diagrams reliably; hand-built divs and inline SVG handle the more editorial visuals (mass diagrams, cross-sections). Mix the two — don't lean on Mermaid for everything, it'll start to look generic.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{repo name}} architecture</title>
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
    <script>
      tailwind.config = { theme: { extend: { colors: {
        paper: "var(--paper)", raise: "var(--raise)", ink: "var(--ink)", muted: "var(--muted)",
        rule: "var(--rule)", accent: "var(--accent)", strong: "var(--strong)",
        warn: "var(--warn)", "warn-soft": "var(--warn-soft)", leak: "var(--leak)", deep: "var(--deep)",
      } } } };
    </script>
    <script type="module">
      import mermaid from "https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.esm.min.mjs";
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({ startOnLoad: true, theme: dark ? "dark" : "neutral", securityLevel: "loose" });
    </script>
    <style>
      :root {
        --paper: #f6f6f3; --raise: #ffffff; --ink: #16181d; --muted: #646b77; --rule: #dcdee2;
        --accent: #3b45a8; --strong: #1d7a4f; --warn: #8a5a12; --warn-soft: #fbf0dc;
        --leak: #c62828; --deep: #1c2230;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) {
          --paper: #0f1116; --raise: #171a21; --ink: #e7e9ee; --muted: #9098a6; --rule: #2a2e38;
          --accent: #9aa3f0; --strong: #6cc79a; --warn: #dcaa62; --warn-soft: #2d2313;
          --leak: #f07178; --deep: #3a4560;
          color-scheme: dark;
        }
      }
      :root[data-theme="dark"] {
        --paper: #0f1116; --raise: #171a21; --ink: #e7e9ee; --muted: #9098a6; --rule: #2a2e38;
        --accent: #9aa3f0; --strong: #6cc79a; --warn: #dcaa62; --warn-soft: #2d2313;
        --leak: #f07178; --deep: #3a4560;
        color-scheme: dark;
      }
      body { background: var(--paper); color: var(--ink); }
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: var(--leak); }
      .deep { border: 3px solid var(--deep); }
    </style>
  </head>
  <body class="bg-paper text-ink font-sans">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header

Repo name, date, and a compact legend: solid box = module, dashed line = seam, red arrow = leakage, thick-bordered box = deep module. No introduction paragraph — straight into the candidates.

## Candidate card

The diagrams carry the weight. Prose is sparse, plain, and uses the glossary terms ([LANGUAGE.md](LANGUAGE.md)) without ceremony.

Each candidate is one `<article>`:

- **Title** — short, names the deepening (e.g. "Collapse the Order intake pipeline").
- **Badge row** — recommendation strength (`Strong` = `strong`, `Worth exploring` = `warn`, `Speculative` = `muted`), plus a tag for the dependency category (`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **Files** — monospaced list, `font-mono text-sm`.
- **Before / After diagram** — the centrepiece. Two columns, side by side. See patterns below.
- **Problem** — one sentence. What hurts.
- **Solution** — one sentence. What changes.
- **Wins** — bullets, ≤6 words each. e.g. "Tests hit one interface", "Pricing logic stops leaking", "Delete 4 shallow wrappers".
- **ADR callout** (if applicable) — one line in a `warn-soft` box.

No paragraphs of explanation. If the diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits the candidate. Mix them. Don't make every diagram look the same — variety is part of the point.

### Mermaid graph (the workhorse for dependencies / call flow)

Use a Mermaid `flowchart` or `graph` when the point is "X calls Y calls Z, and look at the mess." Wrap it in a Tailwind-styled card so it doesn't feel parachuted in. Style with classDef to colour leakage edges red and the deep module dark. Sequence diagrams work well for "before: 6 round-trips; after: 1."

```html
<div class="rounded-lg border border-rule bg-raise p-4 overflow-x-auto">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      %% one mid red that reads on both themes; Mermaid styles can't use the tokens
      classDef leak stroke:#e5484d,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Hand-built boxes-and-arrows (when Mermaid's layout fights you)

Modules as `<div>`s with borders and labels. Arrows as inline SVG `<line>` or `<path>` elements positioned absolutely over a relative container. Reach for this when you want the "after" diagram to feel like one thick-bordered deep module with greyed-out internals — Mermaid won't render that with the right weight.

### Cross-section (good for layered shallowness)

Stack horizontal bands (`h-12 border-l-4`) to show layers a call passes through. Before: 6 thin layers each doing nothing. After: 1 thick band labelled with the consolidated responsibility.

### Mass diagram (good for "interface as wide as implementation")

Two rectangles per module — one for interface surface area, one for implementation. Before: interface rectangle is nearly as tall as the implementation rectangle (shallow). After: interface rectangle is short, implementation rectangle is tall (deep).

### Call-graph collapse

Before: a tree of function calls rendered as nested boxes. After: the same tree collapsed into one box, with the now-internal calls shown faded inside it.

## Style guidance

- Lean editorial, not corporate-dashboard. Generous whitespace. Serif optional for headings (`font-serif`).
- Colour sparingly, always through the tokens: one accent plus `leak` for leakage and `warn` for warnings.
- Keep diagrams ~320px tall so before/after sits comfortably side by side without scrolling; stack them at phone width.
- Use `text-xs uppercase tracking-wider` for module labels inside diagrams — they should read as schematic, not as UI.
- The only scripts are the Tailwind CDN and, in a local file, the Mermaid ESM import. The report is otherwise static — no app code, no interactivity beyond Mermaid's own rendering.

## Top recommendation section

One larger card. Candidate name, one sentence on why, anchor link to its card. That's it.

## Tone

Plain English, concise — but the architectural nouns and verbs come straight from [LANGUAGE.md](LANGUAGE.md). Concision is not an excuse to drift.

**Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute:** component, service, unit (for module) · API, signature (for interface) · boundary (for seam) · layer, wrapper (for module, when you mean module).

**Phrasings that fit the style:**

- "Order intake module is shallow — interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Two adapters justify the seam: HTTP in prod, in-memory in tests."

**Wins bullets** name the gain in glossary terms: *"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*, *"interface shrinks; implementation absorbs the wrappers"*. Don't write *"easier to maintain"* or *"cleaner code"* — those terms aren't in the glossary and don't earn their place.

No hedging, no throat-clearing, no "it's worth noting that…". If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term isn't in [LANGUAGE.md](LANGUAGE.md), reach for one that is before inventing a new one.
