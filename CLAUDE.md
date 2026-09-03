# Agentic Coding Playbook — agent guide

A four-book series on agentic coding, published as one Astro site with a book view and a deck view per chapter. Design: `docs/specs/2026-09-02-book-series-design.md`. The repo also ships the `syv-skills` Claude Code plugin.

## Repo layout

- `web/` — the site. `src/content/books/<book>/NN-<slug>.mdx` are chapters; `book.yaml` per book; `src/content/pages/` holds Sources and About. Components in `src/components/`, D3 renderers in `src/lib/viz/`. `npm run dev`, `npm test`, `npm run build`, `npm run check:links` from `web/`.
- `docs/specs/` — design specs. `docs/plans/` — implementation plans.
- `docs/internal/` — working notes: knowledge base (`sources.md`, `further-reading.md`), coverage plans, editorial decisions.
- `docs/legacy/` — the retired 14-module playbook, kept as mining material. Not built.
- `skills/`, `agents/`, `.claude-plugin/` — the `syv-skills` plugin. Do not touch when working on the site.
- `.claude/skills/add-visual/` — how to add a D3 visual to a chapter. `.claude/commands/knowledge.md` — the `/knowledge` source-intake command.

## Writing chapters

- One MDX file per chapter; `##` headings are sections in the book and slides in the deck. A `---` inside a section forces a slide break. `<Notes>` are speaker notes (hidden in the book). `<BookOnly>` / `<DeckOnly>` scope content to one rendering.
- Front matter: `title`, `order`, `summary`, `status` (`draft` | `review` | `published`; only published chapters build), optional `part`, optional `sources`.
- Quizzes and demos share one layout: wrap every interactive island in `Interactive` (`src/components/Interactive.tsx`): title (· meta) and description on the left, the primary action on the right, body below. Demos live in the chapter's `_components/` folder.
- Book 2 chapters follow the mold: the title is the perspective; then why it holds (grounded in real Syv work); then what it changes (copyable do's and don'ts); then at most one pointer to Book 1 for the basics.

## Adding or updating sources, citations, or knowledge

**Use the `/knowledge` slash command.** Do not hand-edit `docs/internal/sources.md` or `docs/internal/further-reading.md` unless the user explicitly asks for a manual change. The pipeline is `further-reading.md` → `sources.md` → the Sources page at `web/src/content/pages/sources.md`. Promotion to the Sources page is a manual editorial step.

## Editing principles

- **Tool stance.** Principles are agnostic because tomorrow's harness is unknown; the evidence is honestly Claude-Code-sourced. Label Claude Code specifics as such; do not present another tool's method as portable.
- **Posture.** Craft raises the ceiling; verification makes speed safe. Every Book 2 chapter sits under one half.
- **Authority, stated honestly.** Production at scale and model-builder depth. No fabricated client specifics.
- **Voice.** Plain, short, declarative. Claim-style headers that are the point itself. No slogans, no seniority framing.
- **Visual language.** Custom D3 via the `<Visual>` component, no Mermaid; forms are `flow`, `flowchart`, `loop`, `funnel`. Shape carries type, at most two focal accents, orthogonal connectors, nodes pulse in sequence and connectors never move. See `.claude/skills/add-visual/`. No same-hue text on its own fill; colour deltas rather than borders when a fill differs from the background; no dark grey on black.
- **Internal vs published.** Anything a reader should see goes in `web/src/content/`. Working notes go in `docs/internal/`.
