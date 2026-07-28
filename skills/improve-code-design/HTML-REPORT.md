# HTML report

One self-contained file in the OS temp directory. Tailwind and Mermaid from CDNs — Mermaid for graph-shaped diagrams, hand-built divs and inline SVG for the rest. All-Mermaid looks generic.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Design review — {{repo}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="coverage">...</section>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header and coverage

Repo, date, files examined. A tally of the six families with a count each, so the shape of the problem is visible immediately.

Then coverage, in plain sight: what was not examined, and any family assessed shallowly. Structure needs cross-module comparison — without it, mark it unassessed rather than showing zero. A tally that reads as complete when it is not is worse than a missing candidate.

No introduction paragraph.

## Candidate card

One `<article>` each. The diagram carries the weight.

- **Title** — in the codebase's own nouns. "Payment method conditional grows per feature", not "OCP violation in payments.py".
- **Badges** — family (Bloat stone, Rigidity indigo, Over-build violet, Make-it-work rose, Churn teal, Structure slate-900), standard name, strength (`Strong` emerald, `Worth exploring` amber, `Speculative` slate).
- **Files** — `font-mono text-sm`, with line ranges.
- **Before / After** — side by side.
- **Problem** — one sentence: what it costs, not what it looks like.
- **Principle** — one line, at module scale.
- **Remedy** — named, as a heading.
- **Cost** — one line in an amber box: what the remedy costs and how you would know it was the wrong call. Every card gets one.

If a diagram needs a paragraph to be understood, redraw it.

## Diagrams

Vary them across the report.

- **Edit site** (Rigidity, Open/Closed) — the same change twice, marking where the edit lands. Before: every feature edits one function, in red. After: every feature is a new entry.
- **Reasons to change** (SRP, Bloat) — inbound arrows labelled with kinds of requirement, not callers. The count of distinct labels is the finding.
- **Signature as changelog** (Long Parameter List) — the signature as a stack, one parameter per line, annotated with the feature that added each.
- **Distance** (Make-it-work) — a value travelling from where it was produced to where it surfaced, patch at the far end, origin untouched.
- **Pass count** (Churn) — one bar per traversal, intermediate collections drawn and greyed.
- **Overlay** (Structure) — several diffs shown individually, each unremarkable, then overlaid so the shape they made together appears.
- **Box count** (Over-build) — boxes left, boxes right, labelled with implementations and callers.

## Style

Editorial, not corporate dashboard. Generous whitespace; `font-serif` headings work with stone/slate. One accent, red for edit sites, amber for costs; family badges are the only other colour. Diagrams around 320px so before/after sits side by side. `text-xs uppercase tracking-wider` for labels inside diagrams. Only scripts are the Tailwind CDN and the Mermaid import.

## Top recommendation

One card: which to tackle first, one sentence why, anchor link. If several findings share a root cause, say it here rather than per card.

## Tone

Nouns from [LANGUAGE.md](LANGUAGE.md).

Never: "clean", "messy", "spaghetti", "best practice", "code quality". "Architecture" belongs to the sibling skill.

Fits: "Two reasons to change: tax rules and the PDF vendor." · "Every payment method edits `charge()`." · "One implementation, one caller." · "The `None` was produced in the draft-order path and patched at the leaf." · "Four passes over `order.lines` where one would do."
