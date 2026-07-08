---
name: tilbud
description: >
  Write a syv.ai client proposal (tilbud, forslag, offer, PoC-beskrivelse,
  bud på udbud) in the company's fixed format and style, and render it as a
  branded PDF. Works from any session — bootstraps the private 1brain repo
  where the full proposal skill, templates and Typst PDF pipeline live.
  Trigger on opgavebeskrivelser, kravspecifikationer, SKI-udbud, RFPs and
  "lav et tilbud til …", also when the word "tilbud" isn't used directly.
---

# Tilbud — syv.ai proposals

The full proposal machinery lives in the private brain repo (`syv-ai/1brain`):
the interview process, the section-by-section structure, style rules, pricing
patterns and the Typst PDF pipeline. This wrapper gets you there and keeps a
single source of truth — do not improvise a format from memory.

1. **Bootstrap the brain.** Resolve, clone and pull `syv-ai/1brain` exactly as
   the `hjernen` skill describes. Already inside a 1brain checkout? Skip.
2. **Follow the real skill.** Read `<clone>/.claude/skills/tilbud/SKILL.md`
   and follow it end to end — interview first, then write the document into
   `kunder/<klient>/tilbud/` per the repo's `CLAUDE.md`.
3. **PDF.** When the user wants the customer-ready document, follow
   `<clone>/.claude/skills/syvai-tilbud-pdf/SKILL.md` (Typst-based; needs
   `pip install typst` once).
4. **Leave the brain healthy.** `make indeks` and `make tjek` green, commit on
   `main` with a short Danish message, push — as CLAUDE.md prescribes.

Requires `gh` authenticated with access to the syv-ai org.

## Related skills

- **hjernen** — the clone bootstrap this skill builds on, and the general
  query/contribute entry point to the brain.
