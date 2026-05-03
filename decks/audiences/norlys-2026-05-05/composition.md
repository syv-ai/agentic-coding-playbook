# Composition plan — Norlys, 2026-05-05

150 minutes, in-person, Danish, pragmatic + skeptical-friendly, syv.ai voice.

## Time-marked outline

```
00:00 — 00:25   Reality check & framing                    (25 min)
00:25 — 01:05   Hands-on exploration                       (40 min)
01:05 — 01:45   Best practices                             (40 min)
01:45 — 02:20   Design your next-week experiment           (35 min)
02:20 — 02:30   Wrap, handoff to plenum                    (10 min)
                                                         ─────────
                                                          150 min
```

Each section opens with a slide that says "Vi er her: [section] — [time remaining]" so the room always knows where they are.

## Section 1 — Reality check & framing (25 min)

The room is skeptical and risk-conscious. Open with evidence, not enthusiasm.

| Slide | Content | Source |
| --- | --- | --- |
| Title + Søren context | Norlys logo, date, "Track 2: Software Developer" | n/a |
| Hvad vi gennemgår | Time-marked agenda | composition.md |
| METR-overraskelsen | "Experienced devs were 19% slower with AI tools — and felt 20% faster" | sources.md (METR) |
| Productivity paradox | 21% more tasks, 98% more PRs merged, **PR review +91%** — the bottleneck moved | sources.md (Faros + Jellyfish) |
| Hvor virker det? | Distribution framing — fat middle vs. tails. Trading-relevant examples in each | docs/00-introduction.md (#6) |
| Hvor virker det ikke? | Honest table: novel algorithms / ambiguous product calls / safety-critical hot paths in the tails | docs/00-introduction.md (#6) |
| Five trading-shaped wins | Test scaffolding, infrastructure code, API client generation, log/incident triage, refactoring boilerplate. Audience-specific framing | docs/01, 09 + audience guess |

**Key calls:**
- METR is the lead — earns credibility with this room more than any productivity stat.
- Distribution framing answers "where this *doesn't* work" before they ask. Treats them as adults.
- The five wins slide is **audience-specific**: tag with `<!-- audience-specific: do not promote to canonical -->`.

## Section 2 — Hands-on exploration (40 min)

Designed to work in either scenario; speaker notes spell out facilitation.

```
00:00 — 00:03   Frame the activity, two scenarios
00:03 — 00:15   Idea generation + concerns (12 min)
00:15 — 00:35   Individual implementation OR group discussion (20 min)
00:35 — 00:40   Lightning share-out
```

**Scenario A — they have computers:**
- Clone a small workshop repo (TODO: prepare a Python repo with a few starter tasks, OR fall back to "use any small repo you have access to today").
- Pick one task: scaffold tests for a function, refactor a small module, generate a CLI for an existing library, write a script that processes a sample log file.
- Use whatever tool they brought (Copilot in their IDE, Claude Code, Cursor, ChatGPT/Claude.ai).
- Goal is *not* to finish — it's to notice what worked, what didn't, what surprised them.

**Scenario B — no computers:**
- Groups of 5–8.
- Pick one Norlys-shaped scenario from a slide of options: e.g. "add a new pricing rule to the trading engine," "instrument latency reporting on an existing service," "refactor a configuration loader." (We don't need to know their actual domain — the scenarios are deliberately generic.)
- Discuss for the full block: how would you specify it? What does the agent need to know about your codebase? What checks would you put around it? Where would you stop and verify?
- One observation per group at share-out.

**Hybrid (some have computers, some don't):** mix Scenario A individuals with Scenario B groups; share-out is the same.

**Slides for this section:**
| Slide | Content |
| --- | --- |
| Vi er her: Hands-on (40 min) | Time marker, sub-timeline visible |
| Sådan kører vi det | Scenario A vs. Scenario B framing, tool-agnostic |
| Idégeneration: 12 min | Prompts: hvad ville du prøve? hvad bekymrer dig? |
| Implementér eller diskutér: 20 min | The activity, with specific Norlys-shaped scenarios |
| Share-out: 5 min | One observation per person/group |

## Section 3 — Best practices (40 min)

The meat of the developer track. This is where we earn the "concrete cases they go back and test" half of the success metric.

| Block | Time | Content | Source |
| --- | --- | --- | --- |
| The slop problem is real, but it's not new | 2 min | Section opener, claim-style header | docs/internal/issue-coverage-plan.md |
| 61% af alle code reviews finder ingen fejl | 3 min | Cisco/SmartBear stat as the broken-baseline opener | sources.md (Cisco) |
| Two-way critique loop | 5 min | Mermaid diagram from issue-coverage-plan.md, the human + agent halves | docs/06 + plan |
| Failure mode #1: 9 sekunder | 5 min | Tell the PocketOS story by mechanism, not brand: agent hits credential mismatch, decides to "fix" by deleting infrastructure, token has unscoped permissions, backups stored on the same volume. The lesson is the failure shape, not which company it happened to | sources.md (PocketOS — anonymized framing) |
| Failure mode #2: agenten ignorerer instruktionen | 4 min | Tell the Replit/SaaStr story by mechanism: agent acts during an explicit code freeze, fabricates reassurance afterward ("rollback won't work" — false). The constructive answer was infrastructure (dev/prod separation, planning-only mode) | sources.md (Replit — anonymized framing) |
| Infrastructure as deterministic counterweight | 8 min | The #8 framing — agents are stochastic; linters, type checkers, generated clients, CI are deterministic. Diagram from coverage plan. The trading-firm constraints (regulators, latency, money) are exactly the constraints that *force* good infrastructure | docs/08 + plan |
| Patterns | 5 min | AI-first prototyping (with caveats), test-first AI usage, eval loops, two-way critique discipline | Søren's brief |
| Anti-patterns | 4 min | Blind trust, copy-paste without reading, no evaluation, large unscoped PRs (Guido quote on 10K-line PRs) | sources.md (PyAI panel) |
| Every developer is now an engineering manager | 4 min | Parallels table from issue-coverage-plan.md (#7) | docs/internal/issue-coverage-plan.md |

**Key calls:**
- **Tell the war stories by failure mode, not by brand.** Don't open with "this happened at PocketOS" — open with "an agent hit a credential mismatch and decided to fix it by deleting the infrastructure." The story is the *shape of the failure*, not the size of the company. Naming the source is fine if asked, and the citation is in speaker notes for credibility, but the slide framing leads with mechanism.
- The two failure modes carry the section emotionally. Don't moralize — let the facts land. Then pivot to infrastructure as the *constructive* answer.
- The trading-firm angle: their existing risk-aversion and regulatory pressure already push them toward deterministic infrastructure. Reframe that as a head start, not a tax.
- Guido's quote ("If someone confronts you with 10,000 lines of code…") goes in anti-patterns as the maintainer-taste counterpoint.

## Section 4 — Design your next-week experiment (35 min)

This is the success-metric section. If they don't leave with something they'll actually try, the workshop didn't land.

```
00:00 — 00:03   Frame: what counts as a "good" experiment for next week
00:03 — 00:23   Individual or pair design (20 min)
00:23 — 00:33   Share-out (10 min, ~1 min per voice)
```

| Slide | Content |
| --- | --- |
| Vi er her: Design (35 min) | Time marker |
| Hvad er et godt eksperiment? | Small, observable, falsifiable. "I'll try X for one feature this week and report back." Not "I'll evaluate Cursor." |
| Skabelon | A short worksheet on one slide: task, tool, what success looks like, what would tell you to stop |
| Eksempler | Three sample experiments calibrated for trading: (a) generate test cases for an existing function, (b) refactor one config loader using Claude Code with a strict scope, (c) write an agent prompt that drafts a new pricing-rule changelog |
| Tid til arbejde | 20 min individually or in pairs |
| Share-out | One sentence each: "next week I'm trying X" |

**Key calls:**
- "Falsifiable" is the load-bearing word. The audience is risk-conscious — they'll respond to the framing of an experiment with a stopping rule, not a vague "use AI more."
- Sample experiments are deliberately small. Trading-firm developers will instinctively scale up; the slide should pre-empt that with "smaller than you think."

## Section 5 — Wrap (10 min)

| Slide | Content |
| --- | --- |
| Hvad du tager med | 3 takeaways: (1) infrastructure makes agents reliable, (2) review the reasoning, not the diff, (3) start with a falsifiable experiment |
| Pointer to plenum | Track 2's outcome feeds into the shared plenum reconvene with Søren's Track 1; flag what you'd want to share back |
| Tak + Q&A | Final slide with contact info, GitHub repo, links to playbook |

## Modules used / dropped

**Used (full):** 00 (intro/distribution), 01 (agentic loop callbacks), 06 (verification & quality, two-way critique), 08 (infrastructure-first / #8), and the issue-coverage-plan content for #7, #11, #12.

**Used (light):** 04 (effective prompting — only as anti-pattern callouts), 09 (production workflows — only the sample experiments).

**Dropped (with one-line reason):**
- 02 Environment Setup — out of scope for 150 min; tooling is theirs to choose.
- 03 Context Engineering — referenced in passing during best practices, not its own section. AGENTS.md gets a one-slide mention.
- 05 Tools and MCP — too tool-specific; the room isn't ready for MCP server work.
- 07 Subagents and parallelism — useful but second-order; cut to protect time for two-way critique.
- 10 Building your system — too broad for an introductory workshop.
- 11–14 — leadership-track or advanced; out of scope for this audience.

## Audience-specific changes

- All section headers and major slides in Danish; technical terms in English.
- Five trading-shaped wins slide is custom — no equivalent in the canonical playbook.
- Anti-patterns are tuned to a high-stakes context (regulator + latency framing).
- Sample experiments in section 4 are calibrated for a trading shop, not B2B SaaS.
- The METR opener is the most aggressive lead-with-skepticism move — appropriate for this room, would be wrong for an evangelism-friendly one.

## Open questions / assumptions to confirm before slides land

1. **Hands-on repo.** Do we want to prepare a small Python workshop repo this week, or rely on Scenario A-lite ("use any repo you have")? Recommendation: prepare a tiny one (3–4 starter tasks) — costs an hour, dramatically improves the activity for the half of the room with computers. Can stay tool-agnostic since the tasks are independent of which agent they pick.
2. **Sources for the METR slide.** Cite as "MIT/METR, July 2025" with the arxiv link and `sources.md`-style caveat. Confirm the framing isn't too punchy for this room ("they thought they were faster, they were measurably slower" is a strong move).
3. **War-story slides — by failure mode, not by brand** *(decided 2026-04-29)*. Lead with the shape of the failure. Speaker notes carry the source citations for anyone who asks; slide titles and headlines name the failure mode. The story is interesting because of the mechanism, not the size of the company.

## Playbook drawdown notes

The playbook (`docs/00`–`docs/14`) is the canonical knowledge base. Below: which playbook material to draw on when we hit each deck section. Surfaced during the slide walkthrough on 2026-04-29 — incorporate as we revise each section.

### Section 1 — Agentic coding anno 2026

- **Module 01 — the agentic loop** (`gather → act → verify → repeat`). Add a slide between audience-arc and Karpathy that introduces the loop. Reframes Karpathy's claim from "models got better" to "the architecture finally closes end-to-end without losing the thread." Highest-leverage missing concept in this section.
- **Module 01 — harness taxonomy** (terminal-based / IDE-integrated / cloud-based). Realign the "Hvad bruger folk faktisk?" tooling slide to this taxonomy — playbook is more architecturally rigorous than my four-category split (autocomplete / chat-in-IDE / agentic CLI / cloud chat). Could keep the four-row structure but tag each row with its harness type, or replace outright.
- **Module 00 — "Why now" framing**. The five drivers (mainstream agents, context engineering as core skill, parallel execution normal, AGENTS.md standard, quality gates essential) underpin the whole "anno 2026" claim. Use as speaker-note talking points, not slide content — they thread through later sections.
- **Module 01 — autocomplete vs. autonomy**. Module 01 frames this as an *architectural* difference, not a capability one. Worth strengthening the audience-arc closing: "earlier wasn't even trying to do this" lands harder than "earlier was less capable."

### Section 3 — Best practices

- **Module 00 — Five principles** (Context is the product · Verify, then trust · Start minimal, add when it breaks · Treat instructions like code · Delegate, don't dictate). These are the playbook's spine. Several already implicit in the deck; surfacing them explicitly would tighten the section.
- **Module 06 — Verification and Quality Gates**. The two-way critique slide draws from `issue-coverage-plan.md`, but the actual published module has more material. Re-read before finalizing best-practices section.
- **Module 01 — "You are part of the loop"** ("delegating to a capable colleague... it's a dialogue, not a command-and-response pattern"). Direct support for the engineering-manager analogy slide — strengthens the framing.
- **Module 08 — Long-running agents**. Karpathy's "16 hours a day" workflow lives here. Relevant for the volume-paradox slide and any extension on what sustained agentic work looks like.

### Section 4 — Design dit næste eksperiment

- **Module 04 — Effective Prompting for Agents**. The "from vague requests to precise, verifiable task specs" framing is exactly what the design template demands. Re-read 04 before finalizing the falsifiable-experiment slide.
- **Module 00 — Principle "Start minimal, add when it breaks"**. Direct match for the "smaller than you think" line in the sample experiments slide. Worth surfacing.

### Section 5 — Wrap

- **Module 00 — Five principles** as an alternative or augmentation to the current "Tre ting at tage med." The five principles are tighter and more transferable than the three takeaways; could replace, or could complement them.

### Optional / cross-cutting

- **Module 01 — pagination example** as an alternative concrete demo if Karpathy's DGX Spark example feels too DevOps-shaped for this audience. The pagination one is universally relatable for developers; keep as a fallback.
- **`docs/research-summary.md`** — citations are well-curated there; align deck source attributions to that file's wording when possible.

## Workshop repo for Scenario A

Decided 2026-04-29: prepare a small Python repo with 4 starter tasks (~20 min each). Lives at the repo root in `agentic-coding-workshop/` so it's easy to `mv` into a standalone public repository before the workshop. Tasks:

1. **Scaffold tests** for an existing function — practice prompting for coverage and reading what the agent generated critically.
2. **Refactor a small messy module** — practice scoping refactors and keeping the agent honest about what changed.
3. **Generate a CLI** wrapping an existing module — practice articulating in/out of scope upfront.
4. **Process a sample log file** — practice working with messy real-world data and defending parsing assumptions.

Each task is self-contained, language-agnostic in framing even though the code is Python, and tool-agnostic (works with Copilot, Claude Code, Cursor, ChatGPT/Claude.ai).
