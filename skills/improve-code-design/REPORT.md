# Report

Write only when there are **two or more strong candidates**. One candidate, or none, goes in the conversation. Do not build the report to justify the review — a page with sections to fill is the main pressure toward padding, and this rule is what removes it.

## Form: one self-contained page

**Deliver the page.** If your harness can publish artifacts (in Claude Code, the `Artifact` tool), publish it and give the user the link, following the harness's own artifact guidance (in Claude Code, load the `artifact-design` skill first). Publishing uploads the page, including any quoted code; mention that once. Otherwise write a self-contained HTML file to the OS temp directory, open it in the browser (`open` on macOS, `xdg-open` on Linux, `start ""` on Windows), and give the user the file's full absolute path, resolved (for example with `realpath`) rather than `$TMPDIR/…`, `~` or a relative path.

The same page works both ways, with three differences:

- **Skeleton.** A published page is content only (`<title>`, `<style>`, markup, scripts): the publisher adds `<!doctype>`, `<html>`, `<head>` and `<body>`, and doubled skeleton tags break rendering. A local file is a complete HTML document.
- **Mermaid.** Artifacts render `<pre class="mermaid">` natively, so don't load the Mermaid library there. A local file loads it from the CDN.
- **External resources.** Artifacts allow scripts only from a few hosts (`cdn.tailwindcss.com`, `cdn.jsdelivr.net/npm/`, `cdnjs.cloudflare.com`) and block remote stylesheets (except Google Fonts), images and fetches. Inline everything else so the page works in both.

To revise a published report, republish the same file, which keeps the link. A local revision gets a new file name.

The rest of the contract applies either way:

**Nothing loads from the network.** This report needs no library: inline the CSS, hand-build diagrams as inline `<svg>`, and use system font stacks, so it renders the same published or offline.

**Both themes.** Define the palette as custom properties on `:root`, redefine only those properties under `@media (prefers-color-scheme: dark)`, then again under `:root[data-theme="dark"]` and `:root[data-theme="light"]` so a viewer toggle wins in both directions. Style components through the tokens, never inside the media query. Diagram strokes and fills are tokens too — an SVG with a hardcoded `#111` disappears on a dark ground.

**Wide content scrolls itself.** Code blocks, before/after pairs and diagrams each sit in a container with `overflow-x: auto`. The page body never scrolls sideways.

## Design

The subject is a diff, so the page borrows the diff's furniture: a fixed left gutter, monospace where identity matters, a stripe in the margin carrying weight. Utilitarian and precise, not editorial. No hero.

**Colour.** One accent, one warning tone, cool-biased neutrals. Do not give the six families six colours — family is the weakest of the three signals on a card and would take the most ink. Families are set as a small monospace label; **strength is the only thing colour encodes.**

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--ink` | `#12151C` | `#E8EAF0` | Body text |
| `--paper` | `#F7F8F7` | `#0E1016` | Page ground |
| `--raise` | `#FFFFFF` | `#171A22` | Card ground |
| `--rule` | `#DDE0E4` | `#272B36` | Hairlines, gutter |
| `--muted` | `#666E7D` | `#8B93A3` | Labels, metadata |
| `--accent` | `#2F3E9E` | `#8B96E8` | Strength stripe, links, edit-site marks |
| `--warn` | `#8A5214` | `#D9A05B` | The cost box, and nothing else |

Strength is ink density on one hue, not three hues: **Strong** is a solid `--accent` gutter stripe with a filled label; **Worth exploring** is the same stripe at 45% opacity with an outlined label; **Speculative** is a dotted stripe and a `--muted` label. Colour and form both carry it, so it survives a greyscale print and a colour-blind reader.

**Type.** No webfonts. Headings and the report title in the monospace stack with tight tracking — the subject is code, and it keeps the page off the serif-display default. Body in the system sans stack at a ~68ch measure. Paths, symbols and counts in monospace with `font-variant-numeric: tabular-nums`.

```css
--mono: ui-monospace, "SF Mono", "Cascadia Mono", "JetBrains Mono", Menlo, monospace;
--sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

**Layout.** Single column on a fixed left gutter about 3rem wide, carrying the strength stripe and the family label. Cards break the measure to hold a before/after pair side by side; they stack below ~720px. Lay out with grid and `gap`, never per-element margins.

## Structure

```
<title>           Design review — <repo>
header            repo · date · comment-trust mode
section#coverage  the tally and what was not examined
section#findings  the candidate cards
section#next      what to tackle first
```

No introduction paragraph.

### Coverage

Above the candidates, not below. Four things, as a compact stat row rather than prose:

- The `inventory.py check` percentage, and the files not examined.
- Structure: the `cochange.py` window, or **unassessed** if it was not run. Never zero.
- The six families with a count each, so the shape reads at a glance.
- **The gate tally, in one line:** drafted, kept, downgraded, dropped — plus any drop you overturned on appeal and why.

The gate tally is what makes the findings credible. A reader who can see that eleven candidates became three trusts the three; a report showing only its findings looks like everything the review could think of.

A tally that reads as complete when it is not is worse than a missing candidate.

### Candidate card

One `<article>` each. The diagram carries the weight.

- **Title** — the codebase's own nouns. "Payment method conditional grows per feature", not "OCP violation in payments.py".
- **Gutter** — strength stripe, family label, standard name.
- **Files** — monospace, with line ranges.
- **Before / After** — side by side.
- **Problem** — one sentence: what it costs, not what it looks like.
- **Principle** — one line, operational form, module scale.
- **Remedy** — named, as a heading.
- **Cost** — one line in the `--warn` box: what the remedy costs and how you would know it was the wrong call. Every card gets one. A card without one was not gated.

If a diagram needs a paragraph to be understood, redraw it.

### Diagrams

Vary them across the report. Hand-built inline SVG, around 320px so before/after sits side by side. Stroke and fill from tokens.

- **Edit site** (Rigidity) — the same change twice, marking where the edit lands. Before: every feature edits one function, marked in `--accent`. After: every feature is a new entry.
- **Reasons to change** (Bloat) — inbound arrows labelled with kinds of requirement, not callers. The count of distinct labels is the finding.
- **Signature as changelog** (Long Parameter List) — the signature as a stack, one parameter per line, annotated with the feature that added each.
- **Distance** (Make-it-work) — a value travelling from where it was produced to where it surfaced, patch at the far end, origin untouched.
- **Pass count** (Churn) — one bar per traversal, intermediate collections drawn and dimmed.
- **Overlay** (Structure) — several diffs shown individually, each unremarkable, then overlaid so the shape they made together appears. Drive it from `cochange.py` output.
- **Box count** (Over-build) — boxes left, boxes right, labelled with implementations and callers.

### Next

One card: which to tackle first, one sentence why, anchor link. If several findings share a root cause, say it here rather than repeating it per card.

Do not write agent instructions here. That comes out of the grilling conversation, once the design decisions are settled.

## Tone

Nouns from LANGUAGE.md, including the banned list.
