# Agentic Coding Playbook — agent guide

Workshop playbook on agentic coding. Two tracks (developer / leadership) sharing a common foundation; tool-agnostic stance.

## Repo layout

- `docs/00-introduction.md` … `docs/14-software-distillation-and-atomic-agents.md` — the published 14-module spine.
- `docs/research-summary.md` — curated, published source list. Editorial decisions only; do not write to this directly.
- `docs/internal/` — working notes for contributors. Coverage plans, source knowledge base, further-reading backlog, migration plans.
- `decks/` — Slidev workshop decks generated per audience.
- `.claude/skills/` — project skills (currently `generate-deck`, `edit-deck`).
- `.claude/commands/` — project slash commands.

## Adding or updating sources, citations, or knowledge

**Use the `/knowledge` slash command.** Do not hand-edit `docs/internal/sources.md` or `docs/internal/further-reading.md` directly unless the user has explicitly asked for a manual change.

`/knowledge <url-or-path-or-paste>` runs the full intake workflow: review the source, choose a destination, scan for contradictions with existing material, draft the entry with caveats, and flag conflicting passages with `> [!note]` (supersedes) or `> [!info]` (active tension) alert blocks. See `.claude/commands/knowledge.md` for the full spec.

Use `/knowledge update <slug>` to revise an existing entry.

The pipeline is `further-reading.md` → `sources.md` → `docs/research-summary.md`. The first two are managed by the command; promotion to `research-summary.md` is a manual editorial step.

## Editing principles

- **Tool-agnostic stance.** The playbook covers Claude Code, Cursor, Codex, and others. When citing tool-specific material, separate the principle (transferable) from the implementation (tool-specific) — see the shanraisshan entry in `further-reading.md` for the convention.
- **Voice and section headers.** Punchy, claim-style headers ("The slop problem is real, but it's not new") are preferred over neutral descriptive ones in posture/argument sections.
- **Visual language.** All diagrams are custom **D3** (no Mermaid). Renderers + shared theme live in `docs/javascripts/visuals/`; see the `/add-visual` skill.
- **Internal vs published.** Anything a workshop participant should read goes in `docs/`. Working notes, plans, and editorial decisions go in `docs/internal/`.
