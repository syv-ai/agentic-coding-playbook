---
client: Norlys
date: 2026-05-05
duration: 150min
format: in-person
audience:
  - "Software developers in the algo-trading / energy-trading part of Norlys"
  - "Count not confirmed (likely 10–25); plan for either end of that range"
  - "Technical level expected to be solid; this is a traditional company but a competent room"
prior_exposure: |
  Confirmed baseline is light Copilot use. Likely a mix of Copilot users and people
  who haven't touched any AI tooling yet. Treat anything beyond Copilot (Cursor,
  Claude Code, agentic harnesses) as new territory for most of the room. Assume
  the audience has heard productivity claims before and is appropriately skeptical.
stack: |
  Confirmed unknown — language-agnostic framing required throughout. When code is
  needed (snippets, demos, examples), use Python. Treat everything else as an
  assumption to label, not a fact to assert.

  Trading domain implies (likely, not confirmed): low-latency hot paths in C++ or
  Rust, business logic in Java or Python, infrastructure in Python/Go,
  KDB+/q in some shops. Don't lean on stack-specific examples without checking
  the room first.
---

## Goals

Set by Søren in the email exchange, refined for this track:

- **Move the room from "I'm trying Copilot a bit" to "AI can accelerate our development and become a team capability."** This is the explicit goal for Track 2; everything else serves it.
- **Create excitement AND concrete cases the developers go back and actually test.** The success criterion: if nobody tries anything next week, the workshop didn't land.
- **Treat their risk profile as a feature, not an obstacle.** Trading software has real consequences (regulators, money, latency). The deck should make the case that agentic coding is *more* valuable in high-stakes contexts, not less — because the deterministic infrastructure they already need is exactly what makes agents reliable.

## Constraints

Søren explicitly said "do whatever you want" — no hard avoids. Soft constraints derived from the audience:

- **Avoid:** AI-evangelist energy, vendor pitches, "anyone can code now" framing, productivity claims without caveats, examples from web/B2B SaaS that don't transfer to a trading firm's risk profile.
- **Emphasize:** the deterministic-vs-probabilistic infrastructure argument (#8 in the playbook), two-way critique / review discipline (#11/#12), and the engineering-manager analogy (#7) — these all map cleanly onto a regulated, latency-sensitive shop.
- **Skip:** modules that don't fit a 150-minute developer track for this audience — leadership-track material, deep MCP server development, Software Distillation, full-lifecycle examples that aren't trading-shaped.

## Tone

Pragmatic, hype-free, and skeptical-friendly — the audience is risk-conscious and at a good technical level, so treat them as knowledgeable adults. Lead with the constraints they care about (correctness, latency, regulators) rather than productivity numbers.

Keep the syv.ai voice — friendly, occasionally funny, relaxed. The room came out of curiosity; meet them there. Punchy claim-style section headers are fine ("The slop problem is real, but it's not new"); AI-bro hype isn't.

## Specific scenarios

Drawn from Søren's note on what fills the mental space of a trading-firm developer:

- **"What happens when the agent writes a bug into a hot path?"** The deterministic-infrastructure argument should answer this directly: type checkers, generated clients, CI tests, linters do the load-bearing correctness work; the agent operates inside that envelope.
- **"How do we review the volume of code agents produce?"** The two-way critique section should land here — review reasoning, not diff; pre-review for fatigue mitigation; named-gap framing on reviewer variance.
- **"Where does this *not* work?"** Distribution framing (#6): agents excel in the fat middle (well-specified work with clear interfaces); novel algorithms and ambiguous product calls sit in the tails. Be honest about which parts of trading work belong in each.

## Notes

- **Language: Danish.** Slides in Danish; technical terms ("agentic loop", "two-way critique", "AGENTS.md") stay in English without translation. Speaker notes can be bilingual where it helps.
- **Format: in-person.** Station-based hands-on works as designed; Søren is doing Track 1 in parallel.
- **Co-presenter context:** Søren is leading Track 1 (algo-trading use cases & roadmap). The two tracks reconvene afterwards for shared presentation of perspectives. Worth a single slide near the end pointing forward to that reconvene so the developer track lands as feeding into a larger conversation.
- **No prior workshop with Norlys** to anchor on. Treat this as a first-touch engagement; the success criterion is whether they try something next week, not whether we've covered every section in the playbook.
- **Open dialog over fixed program.** Build the deck with explicit pause points for discussion and questions, not a forced march through slides. The 150 minutes should *feel* like a conversation with structure, not a lecture.
