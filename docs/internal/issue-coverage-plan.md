# Issue Coverage Plan

A proposal for how to fold the 13 open GitHub issues into the existing 14-module playbook. Grouped by theme, with a recommendation for where each issue lands (new module, integrated section, or cross-cutting thread) and what the deliverable looks like.

The goal is to keep the existing module spine intact and weave most issues into it rather than spawning a parallel structure. Two issues (#2 tracks, #1 exercises) are structural and should be resolved first because they constrain how the others get written.

---

## Group A — Structural decisions (resolve first)

These change the shape of the workshop. Everything else depends on them.

### #2 — Split into tracks (developer vs. leadership)

**Recommendation:** Two tracks sharing a common foundation, not two parallel workshops.

- **Shared core (everyone reads):** 00 Introduction, 01 Agentic Loop, plus a new "perspectives" chapter that holds the distribution framing (#6) and the engineering-manager framing (#7). These are the load-bearing concepts a non-coder still needs to reason about agents.
- **Developer track:** 02–10 as they stand today. Adds a posture chapter on design principles (#10) and "use agents as little as possible" (#8).
- **Leadership track:** 11 (business → tasks), 12 (enterprise adoption), plus new chapters on culture (#4) and "who should code?" (#9). Lighter on tool mechanics, heavier on governance, distribution, ROI, and review process (#12).
- README gets a "pick your track" section near the top.

The second track is **Leadership** rather than "Business" — the content is closer to engineering management than to general business. We are not building a separate reviewer/QA track; everyone reviews, so review-as-discipline is folded into the developer track.

**Deliverable:** Restructured README + a one-page track map showing which modules each track reads in which order.

### #1 — Exercises

**Recommendation:** One exercise per developer-track module, sized 15–30 min, with a stated learning objective and a "done when…" criterion. Leadership track gets discussion prompts and case studies rather than coding exercises.

- Each exercise lives in an `exercises/` folder, named `NN-<module-slug>.md`, and is linked from the matching module.
- Format: **Goal · Setup · Task · Done when · Stretch.** Short, runnable in any agent harness.
- A handful of exercises should be paired (one developer-track, one leadership-track) so a mixed audience can do them side-by-side in a workshop setting — e.g. a PRD writing exercise (leadership) feeding into a spec-to-task exercise (dev).

Exercises are **tool-agnostic** — harder to write, but matches the playbook's stated stance. We are **not** auto-grading. Each exercise states a "done when…" criterion and learners decide for themselves when they've met it.

**Deliverable:** Exercise template + 14 exercises, drafted in priority order (03 Context Engineering, 04 Prompting, 06 Verification first — these are the highest-leverage skills).

### #3 — Visualizations

**Recommendation:** Pick one toolchain and one visual language now, before more diagrams accumulate inconsistently.

- **Toolchain:** All diagrams are custom **D3** (no Mermaid) — see the `/add-visual` skill (`.claude/skills/add-visual/`). Renderers and the shared theme live in `docs/javascripts/visuals/`. Inline SVG for one-offs. The draft fragments below are in the D3 `<template>` format (canonical source). Note: most use branching / decision nodes / edge labels / feedback loops, which the current `flow-diagram.js` (linear chains only) does not yet render — promoting these to a published module needs a graph-capable renderer.
- **Visual language:** The shared theme lives in `docs/javascripts/visuals/theme.js` (color palette, arrow gap, node shapes, fonts). Design rules are in the `/add-visual` skill.

**Light theme only.** No existing brand reference to match — we define the visual language ourselves in `docs/visual-style.md`.

**Deliverable:** `docs/visual-style.md` + a small library of reusable diagram fragments (the agentic loop, fan-out/fan-in, the three-checkpoint verification pipeline, the spec-as-artifact flow). Drafts of the fragments below — these are the canonical sources reused across modules and slides; finalize once `visual-style.md` fixes the conventions.

**Fragment: the agentic loop**

<div class="flow-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "spec", "label": "Spec / instruction" },
    { "id": "plan", "label": "Agent plans" },
    { "id": "act", "label": "Agent acts", "sub": "tool calls / edits" },
    { "id": "verify", "label": "Verify", "sub": "tests / linters / human" },
    { "id": "done", "label": "Done" }
  ],
  "links": [
    { "source": "spec", "target": "plan" },
    { "source": "plan", "target": "act" },
    { "source": "act", "target": "verify" },
    { "source": "verify", "target": "done", "label": "pass" },
    { "source": "verify", "target": "plan", "label": "fail" }
  ]
}
</template>
</div>

**Fragment: fan-out / fan-in (subagents, used in 07)**

<div class="flow-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "orch", "label": "Orchestrator agent" },
    { "id": "a", "label": "Subagent A" },
    { "id": "b", "label": "Subagent B" },
    { "id": "c", "label": "Subagent C" },
    { "id": "agg", "label": "Aggregate results" }
  ],
  "links": [
    { "source": "orch", "target": "a" },
    { "source": "orch", "target": "b" },
    { "source": "orch", "target": "c" },
    { "source": "a", "target": "agg" },
    { "source": "b", "target": "agg" },
    { "source": "c", "target": "agg" },
    { "source": "agg", "target": "orch" }
  ]
}
</template>
</div>

**Fragment: three-checkpoint verification pipeline (used in 06)**

<div class="flow-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "change", "label": "Code change" },
    { "id": "rt", "label": "Real-time", "sub": "linter · type checker · LSP" },
    { "id": "pc", "label": "Pre-commit", "sub": "hooks · formatters · fast tests" },
    { "id": "pr", "label": "PR review", "sub": "two-way critique · CI suite" },
    { "id": "merge", "label": "Merge" }
  ],
  "links": [
    { "source": "change", "target": "rt" },
    { "source": "rt", "target": "pc" },
    { "source": "pc", "target": "pr" },
    { "source": "pr", "target": "merge" }
  ]
}
</template>
</div>

**Fragment: spec-as-artifact flow (used in 09 / 11)**

<div class="flow-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "prd", "label": "PRD" },
    { "id": "spec", "label": "Spec / design doc" },
    { "id": "issues", "label": "Issues / task prompts" },
    { "id": "agent", "label": "Agent session" },
    { "id": "pr", "label": "Pull request" },
    { "id": "review", "label": "Two-way review" },
    { "id": "followup", "label": "Follow-up issues" }
  ],
  "links": [
    { "source": "prd", "target": "spec" },
    { "source": "spec", "target": "issues" },
    { "source": "issues", "target": "agent" },
    { "source": "agent", "target": "pr" },
    { "source": "pr", "target": "review" },
    { "source": "review", "target": "followup", "label": "merged" },
    { "source": "review", "target": "issues", "label": "rework" }
  ]
}
</template>
</div>

---

## Group B — Cross-cutting perspectives (thread through existing modules)

These are framings, not standalone topics. Each one wants a short dedicated section *somewhere* it naturally fits, plus callbacks where relevant. Resist the urge to make each one its own module — they'll dilute.

### #6 — Situate as distributions

**Where it lands:** New section in 00 Introduction, "What agents are good at (and what they're not)." Becomes a recurring frame the rest of the playbook calls back to.

**Treatment:** Frame agent capability as a distribution: design choices and well-specified work sit in the fat middle where agents excel; novel algorithms, deep domain modeling, and ambiguous product calls sit in the tails where humans lead. The point isn't a hard line — it's giving the reader a mental model for *deciding* per task.

**Concrete asset:** An actual normal/Gaussian curve with real distribution language — first standard deviation, second standard deviation, tails — labeled "agent-led" in the body and "human-led" in the tails. Using genuine stats vocabulary anchors the visualization to something readers already understand instead of being a hand-wavy bell shape. Bonus points if we can credibly anchor the curve to a real signal (task complexity, novelty, specification clarity) rather than treating it as decorative. Plus a 5-row "in the middle / in the tails" comparison table.

### #7 — Every developer is now an engineering manager

**Where it lands:** Sidebar in 01 Agentic Loop, then explicit reinforcement in 07 (Subagents) and 09 (Production Workflows).

**Treatment:** The skills that matter are now scoping, delegation, review, and feedback — not typing speed. Connect this to existing engineering-management literature so the analogy does work for the reader.

**Parallels table** (renders as the sidebar's central asset):

| Engineering management practice | Agent-coding equivalent |
| --- | --- |
| Onboarding a new hire | Writing the AGENTS.md / CLAUDE.md / instruction file |
| Delegating to a junior | Scoping a task prompt with verification criteria |
| One-on-ones | Retros on what the agent did and how to adjust the instructions |
| Performance review | Eval suites — measured behavior over a fixed task set |
| Peer review | Two-way critique (#11/#12) — both the agent's work and your spec |
| Coaching | Feeding corrections back into instructions, not just the current session |

This frame also reinforces #13 (operators must be familiar with coding) — a manager who can't read the work product can't manage.

### #11 — Humans are not always right & #12 — Review was already broken

**Where it lands:** Together, as a new section in 06 Verification and Quality, "Two-way critique."

**Treatment:** Pair these because they're the same coin. Humans rubber-stamp ("LGTM"), agents over-defer. The fix is the same on both sides: the agent should be instructed to push back on weak premises, and the human should review the *reasoning*, not just the diff. Concrete: example instruction-file snippets that license the agent to challenge, plus a review checklist that goes beyond "does it compile."

**Narrative voice:** Use punchy, claim-style section headers (e.g. "The slop problem is real, but it's not new") rather than neutral descriptive ones. The section is a posture argument — the headers should carry the argument too.

**Stats deployment** (sources catalogued in [`sources.md`](sources.md)):

- **Open the section with** Cisco/SmartBear's "61% of code reviews find zero defects" + the 60–90 minute fatigue cliff. Establishes the broken pre-agent baseline in one sentence.
- **Justify the "review reasoning, not diff" bullet with** Bacchelli & Bird (Microsoft, ICSE 2013) — managers expect bug-finding; reality is dominated by maintainability comments. The discipline change is recovering an unmet expectation, not adding a new one.
- **Argue reviewer variance as a named gap.** SE doesn't have a strong empirical study quantifying intra-reviewer inconsistency (same person, same code, different day). Cite peer-review IRR + decision-fatigue research as the closest analogues and say so explicitly — the absence of SE numbers is itself a defensible reason to take a position.
- **Pivot to "agents amplify" with** DX Q4 2025 (22% of merged code is AI-authored) + Jellyfish (median PR size +33%, incidents per PR +23.5%). Three numbers, one story: more code, bigger diffs, more breakage into the same broken process.
- **Operational sidebar** (separate callout): 60–90 min cliff, <300 LOC/hour pace, 200–400 LOC sweet spot. Concrete things readers can change tomorrow.
- **Avoid:** Sadowski/Google numbers in the broken-review framing (describes a working system; reads as cherry-picking next to rubber-stamp data — save for a "what good looks like" reference if added later). Don't lean on the headline CodeRabbit "1.7×" stat — use the sharper breakdown (75% more logic errors, 2.74× more security issues) when the amplification claim needs to bite, and only as a supporting citation since it's vendor-published.

**Practitioner quotes** (from the [PyAI OSS panel](https://pydantic.dev/articles/pyai-oss-panel)):

- **Bridge from "broken" to "what discipline looks like":** Guido van Rossum on large PRs — *"If someone confronts you with 10,000 lines of code, I find it real hard to believe that those are the right 10,000 lines of code."* Human counterpart to the 200–400 LOC sweet spot, supports the incrementalism bullet.
- **Defuse the "AI just means bigger PRs" objection:** Jeremiah Lowin — *"I think it's about creating an environment where explaining the code is of paramount importance."* Reasoning is what the author owes the reviewer, regardless of who typed the code.
- **Concrete recommendation for the #11 crossover:** Sebastián Ramirez attaches model, prompts, and full conversation history to AI-assisted PRs he sends to other people's projects. Disclosure as a default behavior, not a footnote.

**Mitigations to cover** (the prescriptive half of the section):

- **Pre-review as fatigue mitigation.** A first-pass agent (or a structured self-review against the checklist) catches the obvious problems before the human review starts, so the human attention budget doesn't get burned on syntax and rubber-stamp candidates. Frame as a way to protect the 60–90 minute attention window, not a replacement for review.
- **Review checklist that goes beyond "does it compile"** — checks for unjustified abstractions, hidden assumptions, divergence from intent, what the change is *not* doing.
- **Instruction-file snippets that license the agent to challenge** — "if my premise is wrong, say so before writing code."

**TODO:** Internal team chat (incl. the algotrader) on how each of us actually mitigates review-related issues — the section's prescriptions should reflect a real discussion, not just the literature.

**Visualization (deliverable):** D3 diagram of the two-way critique loop. Lives in the section and is reused on the matching slide. Source fragment goes in the diagram library defined under #3. Draft:

<div class="flow-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "spec", "label": "Human writes spec" },
    { "id": "premise", "label": "Agent: premise check", "kind": "decision" },
    { "id": "flag", "label": "Agent flags assumption", "sub": "asks before writing code" },
    { "id": "impl", "label": "Agent implements", "sub": "+ articulates reasoning" },
    { "id": "review", "label": "Human reviews", "sub": "reasoning, not diff", "kind": "decision" },
    { "id": "merge", "label": "Merge" },
    { "id": "pushback", "label": "Human pushes back", "sub": "names the divergence" }
  ],
  "links": [
    { "source": "spec", "target": "premise" },
    { "source": "premise", "target": "flag", "label": "weak / missing constraint" },
    { "source": "flag", "target": "spec" },
    { "source": "premise", "target": "impl", "label": "sound" },
    { "source": "impl", "target": "review" },
    { "source": "review", "target": "merge", "label": "reasoning sound" },
    { "source": "review", "target": "pushback", "label": "divergence from intent" },
    { "source": "pushback", "target": "impl" }
  ]
}
</template>
</div>

The diagram makes both halves of the section visible in one frame: the agent half (premise-check + flag) on the left, the human half (review reasoning + push back on divergence) on the right. Same loop, two failure modes, one fix.

### #9 — Who should code?

**Where it lands:** Leadership track, as a chapter after 12 Enterprise Adoption. Title something like "Allocating coding work in an agent-augmented team."

**Treatment:** Frame as resource allocation, not gatekeeping. Junior + agent vs. senior + agent vs. non-coder + agent produce different artifacts at different costs and different review burdens. The chapter should give leaders a decision framework, not an answer.

**Second axis — what "coding" means at senior level.** Allocation isn't just about *who* codes; it's about whether senior engineers and architects should be writing specs and distilling problem space into issues *more than* they're instructing coding agents directly. Senior engineers have always done architecture and implementation planning, but in an agent-augmented team this shifts from "the upstream half of the job" to "the load-bearing half." The chapter should make this explicit and put weight on it — the leverage point for a senior is now spec quality, not keystrokes. Connects directly to #10 (syntax → architecture perspective shift) and #11/#12 (agents and humans both review the *reasoning*, which only exists if someone wrote a real spec).

---

## Group C — Practitioner posture (developer track)

Discipline content. These are the habits that separate people who get value from agents from people who get expensive randomness.

### #8 — Use coding agents as little as possible

**Where it lands:** New short chapter between 06 and 07 — it's a posture, not a verification technique, so it deserves its own slot rather than a section inside 06.

**Treatment:** The infrastructure that makes agents *less necessary* is also what makes them *more reliable* when you do use them: linters, pre-commit hooks, type checkers, generated clients, generated docs, centralized theming, strong CI. Reframe "automation" as "things you build once so the agent (and you) don't have to think about them again." The infrastructure label on this issue is correct — this slots near production workflows.

**Why infrastructure, specifically — the load-bearing argument.** The chapter shouldn't present infrastructure as ergonomics. It should present it as the deterministic counterweight to a probabilistic collaborator. Agents are stochastic — they produce plausible-looking output, not guaranteed-correct output. Linters, type checkers, generated clients, and CI are deterministic — same input, same verdict, every time. Every check we push from agent-judgment into deterministic infrastructure replaces a probabilistic verdict with a guaranteed one. Stronger still: well-defined interfaces and consistent codebase patterns *narrow the space of plausible-but-wrong outputs* the agent can produce. That's the only honest way to make a stochastic system reliable — by ruling out bad outputs structurally rather than hoping the model guesses right. (This is the "stochastic parrots, yada yada" point — cite the paper if useful, but the chapter should make the consequence explicit even without naming it.)

**Visualization — what gets pushed where:**

<div class="flow-diagram" data-orientation="TD">
<template>
{
  "nodes": [
    { "id": "need", "label": "A correctness check is needed" },
    { "id": "q", "label": "Can it be made deterministic?", "kind": "decision" },
    { "id": "det", "label": "Linter · type checker · generated client · CI test", "sub": "same answer every time" },
    { "id": "prob", "label": "Agent + human review", "sub": "probabilistic; reliable only when reviewed" },
    { "id": "scale", "label": "Scales freely", "sub": "no review tax per change" },
    { "id": "tax", "label": "Pays the review tax", "sub": "every change" }
  ],
  "links": [
    { "source": "need", "target": "q" },
    { "source": "q", "target": "det", "label": "yes" },
    { "source": "q", "target": "prob", "label": "no — needs judgment" },
    { "source": "det", "target": "scale" },
    { "source": "prob", "target": "tax" }
  ]
}
</template>
</div>

The visualization makes the chapter's working question concrete: for any new correctness check the team is tempted to "just have the agent handle," ask first whether it can be turned into infrastructure. If yes, build it once. If no, accept the review tax and design the review discipline (#11/#12) to handle it.

### #10 — Lean heavily on design principles

**Where it lands:** New section in 04 Effective Prompting. Reinforced in 03 Context Engineering (instruction file should encode the principles the team actually holds, so the agent applies them without being reminded each turn).

**Treatment — reframed.** Lead with the perspective shift, not the principles themselves. The developer's job is moving from syntax to architecture: writing and maintaining a healthy codebase is now the load-bearing skill, and that's intrinsically tied to understanding design principles. Design principles aren't the headline (SOLID/KISS/DRY/YAGNI have been around for decades — readers will tune out if we present them as the new thing); the *shift in where the developer's attention goes* is the headline.

**The auto-regressive point — the strongest argument for codebase health.** Coding agents build on what's there. They're auto-regressive: if your codebase is slop, they will, by virtue of their core logic, write code that matches. Slop in → slop out, at higher throughput. This is the load-bearing reason to lean on principles — not because they're virtuous, but because the agent's output is bounded by the patterns it sees in your repo. Pairs naturally with #8's deterministic-infrastructure argument: infrastructure narrows the space of plausible outputs; codebase health raises the floor of what "plausible" looks like.

**Subordinate point — speak in principles.** Once the perspective shift is established, the prompting application follows: principles are the shared vocabulary the agent uses to make the thousand small decisions you didn't specify. A developer who can't say *"this violates SRP"* can't course-correct an agent that just wrote a 600-line god-class. The 03 callback shows what these principles look like *encoded in an instruction file* — not "follow SOLID" (useless) but specific applications ("functions over 50 lines need a comment justifying the size", "no inheritance for sharing — use composition").

**Concrete asset:** Short worked example contrasting (a) a vague prompt against a slop codebase, (b) the same prompt against a healthy codebase, (c) the same prompt with principles encoded in the instruction file. The diff between the three outputs makes both points — auto-regressive amplification *and* the leverage of speaking in principles — without having to argue them.

### #13 — Users NEED to be familiar with coding

**Where it lands:** Stated up front in 00 Introduction as a prerequisite, then elaborated in the new "who should code?" chapter (#9) for the leadership track.

**Treatment:** "Fix this" is not a prompt. The playbook should be honest that agentic coding raises the floor of *what gets produced* but does not lower the floor of *what the operator needs to understand*. Tie this to #7 (developers as managers) — a manager who can't read the work product can't manage.

---

## Group D — Concrete material

### #5 — Concrete examples of full-lifecycle agentic workflows

**Where it lands:** New appendix `docs/examples/` with 2–3 worked examples, linked from 09 Production Workflows and 10 Building Your System.

**Treatment:** Each example walks one realistic feature from PRD → spec → task prompts → agent session(s) → review → merge → follow-up. Show the actual artifacts (instruction file, prompts, agent transcripts trimmed for length, the resulting PR). Resist sanitizing — the messy decisions are where the learning is.

**Visualization:** Reuse the *spec-as-artifact flow* fragment from #3 as the canonical lifecycle diagram. Each worked example annotates the same fragment with the example-specific artifacts at each node, so readers see the same shape three times with different content — reinforces the lifecycle rather than introducing three competing visualizations.

Examples use **synthetic repos** (easier to maintain, lets us shape the example to hit the teaching points) and are recorded in **Claude Code** as the canonical harness, with notes on how patterns transfer to other tools.

**Three examples:**

1. **Greenfield small:** Adding a feature to a fresh repo (illustrates 02–06).
2. **Brownfield enterprise:** Modifying an existing codebase with conventions (illustrates 11–12).
3. **Multi-session / long-running:** A refactor that spans days (illustrates 07–08).

### #4 — Material on culture (leadership track)

**Where it lands:** New chapter in the leadership track, between 11 and 12.

**Treatment:** Two halves.

1. **What changes culturally once a team adopts agentic coding** — review norms, ownership, blame, pairing, on-call, hiring criteria, IC career ladders. Pairs naturally with #9 (who codes) and #7 (everyone's a manager).
2. **How cultural disposition controls adoption itself.** Some organizations have engineers and employees who are at the forefront — curious about new tooling, willing to retool. Others are more conservative: they build deep expertise around stable tooling and rely on what they're good at. That disposition determines adoption rate, the friction you'll meet, and the change strategy that actually works. The chapter should give leaders a way to read their own organization's archetype and act accordingly — not push a single playbook on every culture.

We don't have first-hand case studies to draw on, so this is synthesized from the existing research-summary sources plus the framing above. If we collect concrete stories during workshop runs, those should land here.

---

## Suggested sequence of work

1. **Decide the structural questions** in Group A — tracks, exercise format, visual language. These constrain everything downstream.
2. **Write the new short pieces in Group B** — distribution framing, two-way critique, every-developer-is-a-manager. These are 1–2 page additions to existing modules and unblock cross-references in later writing.
3. **Add Group C posture sections** — infrastructure-first, design principles, coding literacy prerequisite. Each is contained to one module.
4. **Build out Group D examples and culture chapter** — the heaviest writing, easier once the rest of the spine is settled.
5. **Backfill exercises** in priority order across the developer track.

---

## Issue → destination summary

| # | Title | Destination | Type |
| --- | --- | --- | --- |
| 1 | Exercises | `exercises/NN-*.md` per module | new asset |
| 2 | Split into tracks | README + track map | structural |
| 3 | Visualizations | D3 renderers + theme in `docs/javascripts/visuals/` (`/add-visual` skill) | new asset |
| 4 | Culture material | New chapter, leadership track | new chapter |
| 5 | Full-lifecycle examples | `docs/examples/` appendix | new asset |
| 6 | Situate as distributions | 00 Introduction, new section | integrated |
| 7 | Developer as engineering manager | 01, sidebar; reinforced in 07, 09 | integrated |
| 8 | Use agents as little as possible | New short chapter after 06 | new chapter |
| 9 | Who should code? | New chapter, leadership track | new chapter |
| 10 | Lean on design principles | 04 Effective Prompting, new section | integrated |
| 11 | Humans not always right | 06 Verification, paired with #12 | integrated |
| 12 | Review was already broken | 06 Verification, paired with #11 | integrated |
| 13 | Users must know coding | 00 Introduction (prereq) + leadership track | integrated |
