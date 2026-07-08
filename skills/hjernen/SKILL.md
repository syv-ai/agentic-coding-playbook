---
name: hjernen
description: >
  Query or contribute to syv.ai's shared company brain — the private 1brain
  GitHub repo (kunder, tilbud, teknik, strategi, wiki) — from any session,
  regardless of the current directory. Bootstraps a local clone when needed.
  Use when the user asks what syv.ai knows about a client or topic ("hvad ved
  vi om Krifa?", "har vi løst noget lignende før?"), wants something added to
  the brain ("tilføj til hjernen", mødenoter, læringer, nye dokumenter), or
  mentions 1brain or hjernen. All brain content is in Danish.
---

# Hjernen — syv.ai's shared brain

The brain is a private GitHub repo (`syv-ai/1brain`) of markdown pages: one
workspace per client (hub, distilled case pages, full proposals in `tilbud/`,
source documents in `kilder/`), plus internal projects, tech patterns,
strategy and a cross-cutting wiki. Its root `CLAUDE.md` is the complete
schema — this skill deliberately duplicates none of it. Your job: get a fresh
clone, then follow the repo's own rules.

## 1. Locate or bootstrap the clone

Resolve the clone in this order:

1. `$SYV_HJERNE`, if the environment variable is set.
2. An existing clone — check `~/syv-ai/1brain`, `~/Desktop/1brain`, `~/1brain`.
3. Otherwise clone it: `gh repo clone syv-ai/1brain ~/syv-ai/1brain`.

Then bring it current: `git -C <clone> pull --ff-only`. If the pull fails or
the tree is dirty, report what you found before proceeding — someone may have
local work in flight.

If `gh` is missing or unauthenticated, stop and have the user run
`! gh auth login` themselves (interactive; the account needs access to the
syv-ai org).

## 2. Read the schema

Read `<clone>/CLAUDE.md` before doing anything else. It defines the structure,
frontmatter, link rules, language (Danish), guardrails (never credentials,
sensitive personal data or HR/salary), the `make indeks` / `make tjek`
toolchain, and how retrieval is meant to work. It is the single source of
truth; where this skill and CLAUDE.md disagree, CLAUDE.md wins.

## 3a. Answering questions ("spørg hjernen")

Follow CLAUDE.md's section on retrieval and synthesis: start from the
front-page `README.md` and the domain hubs, follow links, search across
`kunder/`, `teknik/` and `wiki/`, and synthesize across domains. Answer in
Danish and cite the pages the answer builds on (file paths or GitHub links).
If the conversation surfaces knowledge that should be in the brain but isn't,
offer to add it.

## 3b. Adding knowledge ("tilføj til hjernen")

Follow CLAUDE.md's session checklist: right location, template from
`skabeloner/`, exact frontmatter, selective links, then `make indeks` and
`make tjek` until green. Commit directly on `main` with a short Danish
message and push. If the push is rejected, `git pull --rebase` and retry
once; if it still fails, leave the commit local and tell the user.

Never write content that violates the guardrails — strip it and note
`[persondata udeladt]`, as the schema prescribes.

## Proposals

Writing a client proposal has its own flow (interview → fixed format →
branded PDF): use the `tilbud` skill, which builds on this bootstrap.

## Done when

- [ ] Clone resolved and freshly pulled
- [ ] `CLAUDE.md` read, and followed throughout
- [ ] Question answered in Danish with cited pages — or the change is
      committed with indeks + tjek green, and pushed

## Related skills

- **tilbud** — write a client proposal in the company format, with PDF.
