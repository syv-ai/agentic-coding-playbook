# Design — "Perspectives" section (the differentiated layer)

**Date:** 2026-06-21 · **Status:** approved in brainstorm, pending spec review · **Owner:** nicolai@syv.ai

Internal working note. Excluded from the built site (`docs/internal/`).

---

## Why this exists

The current 14 modules are bimodal: a few genuinely sharp insights wrapped in a
generic explainer layer — setup-then-restate openers, the most-written examples in
the genre (vague-vs-precise pagination, the CLAUDE.md tech-stack block), citations on
truisms, "this mirrors how humans work" filler. The reader can't tell the gold from
the padding, so the gold is wasted. That layer is what reads as AI-generated.

The fix is not to rewrite the 14 modules yet. It's to **build one new section that
proves the better approach** in greenfield, then mine the old modules' real gems into
it later. We compete on nobody else's terms: we share Syv's hard-won, proven practice
freely. A reader comes here for what only Syv can say — not for something Claude or any
blog could already tell them.

## What it is / what it's not

- **It is** a curated set of sharp **perspective-pieces** — the gold, made specific and
  practical. Not a course, not comprehensive coverage.
- **It is** an *agentic coding* playbook: how to build software **with** coding agents.
- **It is not** a handbook for building AI/LLM products or agent projects. The
  model-builder vantage (below) is *depth and credibility*, never the subject.
- The existing 14 modules stay **untouched** for now. We may demote/retire them later.

## The posture (the ground the section stands on)

> **Craft raises the ceiling; verification makes speed safe.**

Agentic coding doesn't remove craft — it raises the ceiling for those who have it. And
verification is the discipline that lets you go fast without falling. Every piece earns
its place under one of those two halves. (From the deck: *"Loftet hæves når I lærer
fundamenterne"*, *"Du kan kun styre det du forstår"*, *"Aldrig stol uden tjek"*.)

## Authority, stated honestly

Syv's edge is dual and we say so plainly:

- **Production at scale** — agentic coding shipped daily on our own products and for the
  largest companies in Scandinavia (C25). The practical anchor. (No fabricated client
  specifics; treat as a credibility frame unless the user supplies named, shareable cases.)
- **Model-builder depth** — we train models (DanskGPT, Plapre) and build harnesses
  ([Dash](https://github.com/syv-ai/dash), a meta-harness for Claude Code). This is the
  vantage no blog has; it gives claims their teeth via analogy (verification ≈ a loss
  function), used sparingly.

We use Claude Code almost exclusively; we've tried Codex, Antigravity, Cursor, and
others; we built Dash on top of Claude Code. Examples are honestly Claude-Code-flavored.

## Tool-stance reconciliation (and a CLAUDE.md update)

The current `CLAUDE.md` mandates a flat "tool-agnostic stance." Our own `model-og-harness`
research complicates it: *"En model og dens harness er trænet sammen … Det, der er
styring på den ene, er støj på den anden"* (proven — transplanting Fable 5's method onto
Opus 4.8 lost 3/3 on complex tasks).

Resolution: **principles are agnostic *because tomorrow's harness is unknown*; the
specific harness methods are not portable.** "Fit your harness / don't transplant" is
itself the agnostic meta-principle that *justifies* teaching at the principle level.
Action: update `CLAUDE.md` to state this when we lock the design (not a flat agnosticism,
but "agnostic principles, honestly Claude-Code-sourced evidence").

## The mold (anatomy of a piece — flexes, never a rigid template)

1. **The perspective** — a sharp reframe stated plainly. The headline *is* the perspective.
2. **Why it holds** — grounded in real Syv work (an experiment, a number, a production
   scar), woven in — not a citation slot, not a truism with a footnote.
3. **What it changes** — concrete do's & don'ts for driving a coding agent. Copy-able.
4. **For the basics** — at most one honest "new to this? read X" pointer. We delegate the
   table-stakes instead of restating them ("gold-or-cut, with honest references").

## Voice

The deck register: plain, short, declarative, anti-hype, **no slogans**. Claim-style
headers that are the perspective itself. Reconcile tensions head-on (e.g. slim CLAUDE.md
*vs* keep docs alive — *"Modsætning? Nej:"*). Honest about the frontier (*"Ikke «på
mandag», men det er reelt"*). English, to match the playbook.

## The perspectives (approved set)

Each is a plain-stated reframe; the "evidence" column is the real Syv material it stands
on; the "coding takeaway" keeps it inside the playbook's scope.

### Verification makes speed safe

1. **Decide how you'll measure success before you build.** — *Evidence:* verifiable-loops
   ("write the check before the loop"; a loop without a checkable target is just an
   automated way to make errors you find too late); TDD as contract. *Coding takeaway:*
   write the failing test / acceptance check before you let the agent loose. **← flagship pilot**
2. **A model and its harness are trained together — don't transplant methods.** —
   *Evidence:* the Opus 4.8 vs Fable-method 9-task experiment (3/3 loss on complex tasks).
   *Coding takeaway:* don't paste another model's workflow onto yours; let your harness
   work the way it was trained; pick the right model for the task instead of over-prompting.
3. **A rule recommends; a hook enforces.** — *Evidence:* hooks vs prose rules; guardrails.
   *Coding takeaway:* match autonomy to blast radius; make the non-negotiables deterministic.
4. **Orchestration moves the plan out of the model's head and into a script.** —
   *Evidence:* claude-code-workflows (6M tokens / 95 agents, the semantic testing layer,
   adversarial verification, when *not* to); Dash. *Coding takeaway:* when coordination
   exceeds one context, script the plan — and know when a workflow is the wrong tool.
5. **Give the agent evidence, not feelings.** — *Evidence:* systematic-debugging
   (repro + error + what you ruled out); agent reviewers on fresh context.
   *Coding takeaway:* "still doesn't work" gives the agent nothing; a repro gives it everything.

### Craft raises the ceiling

6. **Bad code is more expensive than ever.** — *Evidence:* the implosion curve (vibe
   spikes and collapses); agents love shallow modules and break three things changing one.
   *Coding takeaway:* SOLID/DRY/KISS/YAGNI as the contracts agents work inside.
7. **You can only steer what you understand.** — *Coding takeaway:* understanding multiplies
   what you can safely ship and lets you catch the agent the moment it goes wrong; you own
   the result ("«AI'en gjorde det» er ikke en undskyldning"); Claude as tutor.
8. **Context is finite — quality drops before the window fills.** — *Evidence:* context rot,
   smart-zone/dum-zone (~40%, model-specific but the principle holds). *Coding takeaway:*
   one task, one session; clear often; GitHub (issues/PRs) as memory outside the window.
9. **Think before you code.** — *Evidence:* grill-me, plan mode, clickable mockup, PRD.
   *Coding takeaway:* close the alignment gap before any code exists; a gap is cheaper to
   catch in a plan than in a diff.
10. **Don't reach for intelligence when rules will do.** — *Evidence:* the determinism gate
    (*"Alt vi pålideligt kan løse uden AI, skal ikke bruge AI"*). *Coding takeaway:* prefer
    the cheapest reliable mechanism — script/hook over agent reasoning where it suffices.

## Pilot

Build **#1 (Decide how you'll measure success before you build)** first — it's the
operational spine and shows the model-builder depth most clearly — to lock the voice and
the mold before scaling to the rest.

## Section name & nav placement (open)

Working title: **"Perspectives."** Alternatives to consider: "Practice", "Doing It Well".
Sits as a new top-level nav section alongside the existing Modules. Final name is the
user's call — cheap to change.

## Parked

- The **Folketinget opportunity-finding recipe** (the 7-step "does this even need
  intelligence / feasibility vs value" process) is a *pre*-agentic-coding topic. Possibly
  its own page later; **not** part of this section.
- **Mining the 14 modules' gems** into this section (e.g. plan-mode priming, "a wrong
  comment a human skims past is a wrong instruction the agent follows", grill the
  low-fidelity / prototype the high-fidelity) — later, after the pilot lands.

## Open questions

1. Final section name and exact nav position.
2. How many of the 10 ship in the first cut vs a later batch.
3. Whether to add the `CLAUDE.md` edit in the same change as the pilot or separately.

## Next steps

1. Spec review (this doc).
2. Draft the flagship pilot piece (#1) in the agreed mold + voice.
3. Review the pilot together; lock voice/mold.
4. Scale to the remaining perspectives; update `CLAUDE.md`'s tool-stance line.
