# Agentic Coding Playbook

This repository is a workshop playbook on agentic coding, with developer and
leadership tracks sharing a tool-agnostic foundation. It also contains a
Next.js slide viewer and a distributable collection of agent skills.

## Layout

- `docs/00-*.md` through `docs/14-*.md` are the published workshop modules.
- `docs/research-summary.md` is the published, curated source list.
- `docs/internal/` contains contributor-only research, plans, and editorial notes.
- `docs/javascripts/visuals/` contains the D3 renderers and shared visual theme.
- `slides/` is the Next.js slide viewer; it reads the published Markdown in `docs/`.
- `.agents/skills/` contains project-local maintenance skills.
- `skills/`, `agents/`, and `.claude-plugin/` are the separate distributable
  product surface. `.claude-plugin/` packages the top-level `skills/` collection;
  keep it unchanged for repository-local guidance work.

## Editorial boundaries

Published material belongs in `docs/`; working notes and unresolved editorial
decisions belong in `docs/internal/`. Keep the playbook tool-agnostic: when a
source discusses a particular product, separate the transferable principle from
that product's implementation.

Use punchy, claim-style headings for posture and argument sections rather than
neutral topic labels. Published documentation uses custom D3 for diagrams; do
not add Mermaid there. This D3-only rule is for published docs, not internal
notes or distributable skill examples.

## Source intake

Use `.agents/skills/knowledge/SKILL.md` for a source URL, path, pasted source, or
an update request supplied in context. The intake pipeline is
`further-reading.md` → `sources.md` → `docs/research-summary.md`:

1. New or unprocessed material normally starts in
   `docs/internal/further-reading.md`.
2. Material selected for citation moves to `docs/internal/sources.md`.
3. Promotion to `docs/research-summary.md` is a manual editorial decision.

Never edit `docs/research-summary.md` directly as part of source intake. Scan
published modules and internal planning material for meaningful contradictions,
and record superseding or active-tension alerts next to the affected passage.

## Docs and slides

The Markdown in `docs/` is the canonical source for both MkDocs and the slides
app; do not maintain a second copy of module content. The slide parser treats
`##` headings outside fenced code blocks as slide boundaries. Keep each slide's
content valid when changing headings.

`slides/lib/constants.ts` couples `MODULE_META` to the docs filenames, slugs,
numbers, titles, descriptions, and part indices. Update that metadata whenever
a module is renamed, added, removed, or moved between parts.

## Validation

Run these commands from the repository root when the relevant dependencies are
available:

```bash
git diff --check
mkdocs build --strict
cd slides && npm run lint && npm run build
```

Install documentation dependencies from `requirements-docs.txt` and run
`npm ci` in `slides/` only when needed for validation. Do not commit `site/`,
`slides/node_modules/`, or other generated outputs and dependencies.

## Project-local skills

The local maintenance skills are portable Agent Skills under
`.agents/skills/<name>/SKILL.md`; use their skill names rather than assuming a
slash-command interface. The top-level `skills/` collection, `agents/` definitions,
and `.claude-plugin/` manifest are a separate distributable product surface and
should not be conflated with the local skills.
