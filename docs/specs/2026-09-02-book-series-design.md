# Design — the playbook as a four-book series

**Date:** 2026-09-02 · **Status:** approved in brainstorm, pending spec review · **Owner:** nicolai@syv.ai
**Supersedes:** `docs/internal/2026-06-21-perspectives-section-design.md` (its posture, authority framing and ten perspectives carry over unchanged; the "new section beside the 14 modules" placement does not).

Internal working note. Excluded from the built site.

---

## Why this exists

The playbook today is 14 modules, about 26,000 words, most of it fundamentals a developer could pick up anywhere. The June note diagnosed the problem: a few sharp insights wrapped in a generic explainer layer that reads as AI-generated. Its answer was a "Perspectives" section beside the modules. This design goes further: the playbook becomes a series of short books, each answering a question the current material doesn't, rendered once as a readable book and once as a workshop deck from the same source.

Two workstreams, kept separable:

- **Content architecture.** Four books, what goes in each, what is retired.
- **Platform.** One source per chapter, two renderings, quizzes and interactive visuals as components.

The platform is settled here. The content is settled at the level of book spines and the fate of each existing module; chapter prose is written in later sub-projects.

## What the site is

A standalone self-study product and reference work, readable end to end without a workshop, with a maintained deck rendering of every chapter for use in the room. Workshops become a guided path through it.

Interactivity in scope for the first version: stateless quizzes with instant feedback, interactive demos and animated visuals, a deck view per chapter. Saved progress, accounts and certificates are explicitly out of scope; if that need arrives, it is a rebuild, not an extension.

## The series

The two audience tracks (developer / leadership) are replaced by the book split. Books 1 to 3 are technical. Book 4 is business-facing and gated.

### Book 1 — How agentic coding works

Developers new to agents. Table stakes, told once, short. Rewritten from scratch, target about 8,000 words, mining modules 00–08 and 10 for the sharp parts and delegating the rest to external references.

1. What an agent is, and the loop it runs
2. Context is the input
3. Briefing the agent
4. Tools, skills, MCP, hooks
5. Verification, three layers
6. Delegation and parallel work
7. Your setup

### Book 2 — Working well with agents

Developers who already use agents. The differentiated book. Supersedes the June note's perspective list and the published artifact course *Design principles for the agentic era* (local copies in `~/repos/syv/course-material/design-principles-agentic-era/`). Every chapter title is the perspective itself. Each chapter follows the mold from the June note: the headline is the perspective, then why it holds (grounded in real Syv work), then what it changes (copyable do's and don'ts), then at most one pointer to Book 1 for the basics.

**Part A — Verification makes speed safe**

1. Decide how you'll measure success before you build ← pilot
2. Think before you code
3. Give the agent evidence, not feelings
4. A rule recommends; a hook enforces
5. Don't reach for intelligence when rules will do
6. Context is finite; quality drops before the window fills
7. Orchestration moves the plan out of the model's head and into a script
8. A model and its harness are trained together; don't transplant methods

**Part B — Craft raises the ceiling**

9. Bad code is more expensive than ever
10. What agents get wrong
11. SOLID between modules
12. The judgment calls (DRY/YAGNI, KISS, Kernighan, Demeter, Least Astonishment)
13. What agents produce: six anti-pattern families
14. Patterns as instructions
15. Why naming changes the output
16. You can only steer what you understand

### Book 3 — The agentic SDLC

Tech leads and engineering managers running agentic delivery across teams. Substance comes from Syv's own practice (repo conventions, the shared skills plugin, review policy, Dash) plus synthesised external sources from the knowledge base. Mines modules 09, 11, 12, 13.

1. The pipeline: business context to merged PR
2. Team standards: shared instructions, skills, hooks as policy
3. Review and merge when agents write most of the code
4. Verification at scale: CI agents, semantic tests, adversarial review
5. Code health as the prerequisite
6. Observability, cost, model routing
7. Ownership, onboarding, portability

### Book 4 — Leading the shift (gated)

CTOs, heads of engineering, business leaders. No code. Written last. It ships only if it has its own material; otherwise it collapses into a one-page brief plus one deck drawn from Books 2 and 3. The guard exists because a Book 4 that restates Books 1–3 at lower resolution is exactly the padding this design removes.

1. What changes and what doesn't
2. The business case, honestly
3. Workslop: the cost is the thinking
4. Adoption sequencing
5. Accountability, governance, risk
6. Skills, hiring, roles
7. What to measure

### Where the 14 modules go

| Module | Destination | Note |
|---|---|---|
| 00 Introduction, 01 The agentic loop | 1.1 | merged |
| 02 Environment setup, 10 Building your system | 1.7 | principle level; Claude Code examples labelled |
| 03 Context engineering, 08 Long-running agents | 1.2, 2.6 | basics to Book 1, the context-rot argument to Book 2 |
| 04 Effective prompting | 1.3, 2.3 | drop the pagination example |
| 05 Tools and MCP | 1.4 | |
| 06 Verification and quality | 1.5, 2.1 | layers to Book 1, the flagship perspective to Book 2 |
| 07 Subagents and parallelism | 1.6, 2.7 | |
| 09 Production workflows | 3.2, 3.4, 3.6 | |
| 11 Business context to agent tasks | 3.1, 2.2 | spec-as-artifact and mockups to "think before you code" |
| 12 Enterprise adoption | 3.5, 3.7, 4.2 | economics argument to Book 4 |
| 13 Observability and lifecycle | 3.6 | |
| 14 Software distillation, atomic agents | 2.14, otherwise retired | single-responsibility skills folded into patterns |
| research-summary, about-syv | series-level pages | Sources and About live outside the books |

The modules move to `docs/legacy/` on the branch as mining material. They are not built.

## Constraints carried over

- **Posture:** craft raises the ceiling; verification makes speed safe. Every Book 2 chapter sits under one half.
- **Authority, stated honestly:** production at scale (C25 clients) and model-builder depth (DanskGPT, Plapre, Dash). No fabricated client specifics; a credibility frame unless the user supplies named, shareable cases.
- **Tool stance:** principles are agnostic because tomorrow's harness is unknown; the evidence is honestly Claude-Code-sourced. Not a flat agnosticism.
- **Voice:** plain, short, declarative, no slogans, no seniority framing. Claim-style headers.
- **Visual language:** custom D3, no Mermaid. No same-hue text on background; colour deltas rather than borders when a fill differs from the content background; no dark grey on black.
- **Knowledge pipeline:** `further-reading.md` → `sources.md` via `/knowledge`, never hand-edited.

## Platform

**Astro with React islands**, static output, deployed to GitHub Pages. Chosen over extending the Next.js app in `slides/` (an app framework for a content site, and seven files of boilerplate-era code with little to preserve) and over keeping MkDocs with a separate deck app (two systems parsing one markdown dialect forever, and interactivity fighting Material's instant navigation).

### Repository layout on the branch

```
web/
  astro.config.mjs, package.json, tsconfig.json
  src/content/books/<book>/<nn>-<slug>.mdx     one file per chapter
  src/content/books/<book>/_components/        chapter-specific demos
  src/content/pages/                           sources, about
  src/components/                              Quiz, Visual, Demo, Callout, Source, Notes, BookOnly, DeckOnly
  src/layouts/                                 Book.astro, Deck.astro
  src/pages/                                   /, /<book>/, /<book>/<chapter>/, /<book>/<chapter>/deck/
  src/lib/                                     content schema, deck splitter, D3 renderers
docs/legacy/                                   the 14 modules, unbuilt
docs/internal/                                 unchanged
docs/specs/                                    design docs
skills/, agents/, .claude-plugin/              untouched
.github/workflows/docs.yml                     Node build of web/, deploy on main
```

Deleted on the branch: `mkdocs.yml`, `requirements-docs.txt`, `slides/`, `docs/javascripts/` (renderers ported into `web/src/lib/`), `docs/assets/` (moved into `web/public/` as needed). The name `site/` is avoided because it is MkDocs' gitignored build output.

### Content model

A chapter is one MDX file with typed front matter:

| Field | Type | Meaning |
|---|---|---|
| `title` | string | the chapter title; for Book 2, the perspective itself |
| `order` | integer | position within the book |
| `summary` | string | one sentence, shown in the TOC and as the opening slide |
| `status` | `draft` / `review` / `published` | only `published` chapters are built and listed |
| `part` | string, optional | part heading within the book (Book 2 uses A and B) |
| `sources` | string[], optional | slugs into `docs/internal/sources.md` |

Books are folders. Book metadata (title, audience sentence, order, gated flag) lives in a `book.yaml` in the folder.

The body's `##` headings are the unit of structure. The book view renders them as sections with an on-page TOC. The deck view renders each as one slide; a `---` inside a section forces an extra slide break; the title and summary form the opening slide; sections wrapped in `<BookOnly>` are skipped. Nothing else is inferred. If a slide is too dense, the author fixes the source, not the renderer.

Components, all usable in both renderings unless stated:

- **Quiz** — multiple-choice questions with instant feedback and a short explanation per answer. Stateless. Answered state stays in the reader's browser via `localStorage`, every access wrapped in try/catch, and the component works with no stored value. In the deck it renders as a live slide.
- **Visual** — wraps the D3 renderers (flow, graph, quality funnel, and new ones as needed). Config is passed as props. Animates on scroll in the book view, on entry in the deck. Redraws on theme change.
- **Demo** — a chapter-specific interactive piece (slider, before/after, click-through simulation) living in the chapter's `_components/` folder, not the shared set.
- **Callout** — `note`, `tension`, `supersedes` variants, matching the alert conventions already used in the knowledge base.
- **Source** — a quote card with a provenance chip: *Read in full* or *Stated, not quoted*, as in the artifact course.
- **Notes** — speaker notes. Hidden in the book view, toggled in the deck.
- **BookOnly / DeckOnly** — content that belongs to one rendering.

### Rendering

**Book view** at `/<book>/<chapter>/`: top bar with series name, book switcher, search and theme toggle; left sidebar with the book's TOC grouped by part; main column at about 70 characters per line; right-hand on-page TOC with an "open as deck" link; previous/next chapter in the footer.

**Deck view** at `/<book>/<chapter>/deck/`: 16:9 slide, book and chapter in the bottom-left, counter bottom-right. Keys: arrows for slides, `N` for notes, `F` for fullscreen, `Esc` back to the book view at the same section.

**Series index** at `/` lists all four books with their audience sentence and published chapter count. A book page at `/<book>/` lists its published chapters by part.

**Theming:** light and dark via CSS custom properties, following the system with a manual toggle. Every colour is defined on bare `:root` and redefined under the dark media query and the explicit dark attribute. Typography stays IBM Plex Sans and Mono for continuity. A visual identity pass is a later sub-project; the pilot ships a clean default.

## Sub-projects

Each gets its own spec, plan and implementation cycle. Only the first is specified here.

1. **Platform + pilot chapter** (this spec). Astro skeleton with all components and both renderings, proven on Book 2 chapter 1. Includes the documentation updates below and a rewrite of the `add-visual` skill for the Visual component.
2. Book 2, remaining 15 chapters.
3. Book 1.
4. Book 3.
5. Book 4, gated.
6. Visual identity pass.
7. Merge to `main` and cutover of GitHub Pages.

### Pilot scope

Book 2, chapter 1, *Decide how you'll measure success before you build*, written in full in the mold and voice above, with:

- one D3 visual (the verifiable loop),
- one chapter-specific demo (a loop with and without a checkable target),
- one three-question quiz,
- one source card,
- speaker notes,
- both renderings working end to end.

Plus the series index and four book pages, of which Book 2 lists one chapter and the others none.

### Verification

- CI on the branch runs `astro check` and a full `astro build` on every push; deploy only from `main`.
- Unit tests (Vitest) for the deck splitter and the content schema.
- A component test for Quiz: correct and incorrect feedback, and behaviour when `localStorage` throws.
- A post-build internal link check.
- Visual checks are done by the owner in a real browser, never by headless screenshots.

### Documentation updates in the pilot sub-project

- `CLAUDE.md` rewritten: real repo layout (`web/`, `docs/legacy/`, `docs/internal/`, `docs/specs/`, the skills plugin); the stale claims about a `decks/` directory, Slidev, and `generate-deck`/`edit-deck` skills removed; the tool-stance line replaced with the resolution above; visual language now "D3 via the Visual component".
- `docs/internal/2026-06-21-perspectives-section-design.md` gets a status line pointing here.
- `docs/internal/README.md` loses the reference to a slides migration plan that no longer exists and gains a pointer to `docs/specs/`.
- `.claude/commands/knowledge.md`: the promotion target `docs/research-summary.md` becomes the Sources page under `web/src/content/pages/`.
- `.claude/skills/add-visual/` rewritten for the new home of the renderers.

## Cutover

All work happens on the `book-series` branch off `main`. `main` keeps serving the current MkDocs site until the branch is merged. Merge when satisfied; sub-project 7 covers the switch.

## Out of scope

- Saved progress, accounts, certificates.
- Redirects from the old module URLs.
- Translation; the series is in English.
- Chapter prose for anything other than the pilot.
