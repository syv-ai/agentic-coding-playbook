# Agentic Coding Playbook — agent guide

Four books on agentic coding, published as one Astro site. Every chapter renders as a book page and as a deck. Design spec: `docs/specs/2026-09-02-book-series-design.md`. The repo also ships the `syv-skills` plugin (`skills/`, `agents/`, `.claude-plugin/`); leave it alone when working on the site.

## Where things are

- `web/` — the site. Chapters are `src/content/books/<book>/NN-<slug>.mdx`, one `book.yaml` per book, `src/content/pages/` for Sources and About. Components in `src/components/`, figure renderers in `src/lib/viz/`, chapter demos in the chapter's `_components/`. From `web/`: `npm run dev`, `npm test`, `npm run check`, `npm run build`, `npm run check:links`.
- `docs/specs/` and `docs/plans/` — design and implementation. `docs/internal/` — working notes and the knowledge base. `docs/legacy/` — the retired 14 modules, mining material only, not built.
- `.claude/skills/add-visual/` — the figure grammar; load it before touching a figure. `.claude/commands/knowledge.md` — source intake; never hand-edit `docs/internal/sources.md` or `further-reading.md`.

## Writing chapters

- `##` is a section in the book and a slide in the deck. `---` inside a section forces a slide break. `<Notes>` are speaker notes. `<BookOnly>` and `<DeckOnly>` scope content to one rendering.
- Front matter: `title`, `order`, `summary`, `status` (`draft` | `review` | `published`; only published builds), optional `part` and `sources`.
- Book 2 mold: the title is the perspective; why it holds, grounded in real Syv work with no invented client detail; what it changes, as copyable do's and don'ts; at most one pointer to Book 1.
- Voice: plain, short, declarative. Headers are claims. No slogans, no seniority framing. Principles are tool-agnostic; evidence is Claude-Code-sourced and labelled as such. Posture: craft raises the ceiling, verification makes speed safe.
- Readers see `web/src/content/`. Contributor notes go in `docs/internal/`.

## Design rules

The mechanical ones are enforced: the build rejects figures over budget, and tests check contrast, the figure grammar and the interactive layout. The rest are decisions already taken; do not relitigate them.

Chrome
- Header content aligns with the page content column. The book switcher is a borderless pill dropdown, centred. Sidebars collapse; their toggles appear on hover.
- Buttons are pills. List items have space between them and accent-coloured markers. Subheadings carry a `#` deep link.
- No left-border callouts, no raised card backgrounds, no shadows. Emphasis is a 6% tint of the meaning colour, or typography. Quotes: accent opening mark, the work title is the link, never a bare URL.
- Colour: text keeps at least 4.5:1 contrast on its background in both themes. No same-hue text on its own fill. A fill that differs from the background is bounded by the colour delta, not a border. No dark grey on black.

Interactives
- Every quiz and demo wraps in `Interactive` (`src/components/Interactive.tsx`): title (· meta) and description on the left, the primary action on the right, body below. Nothing shows before the reader starts except that header.
- Quizzes open on a landing view, then one question at a time, then the result.

Figures
- Only `<Visual kind=...>`: `flow`, `flowchart`, `loop`, `funnel`. Shape carries type. At most two focal nodes, one accent link, nine nodes.
- Layout is editorial: beyond a plain chain, every node gets `at: [column, row]` and the figure is composed to fill a portrait rectangle, roughly 3:4, with no empty corners. The router draws the connectors. Automatic ranking is for chains only, and even then steps sideways rather than stacking one column. Figure text is 14px or larger at natural size. Figures scale down, never up, and expand to a lightbox on demand.
- Motion: nodes light up one after another, slowly (about 1.6s each, a 2.4s rest), then restart; connectors never move; no hover effects; reduced motion gets a static figure.
