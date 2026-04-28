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

- **Toolchain:** Mermaid for flow/architecture diagrams (renders natively on GitHub and in the Next.js slides). For anything Mermaid can't do, hand-built SVG checked in as source.
- **Visual language:** A short `docs/visual-style.md` that fixes color palette, arrow conventions (control flow vs. data flow), node shapes (agent / tool / human / artifact), and font.
- The slide deck and docs reuse the same Mermaid blocks so updates flow to both.

**Light theme only.** No existing brand reference to match — we define the visual language ourselves in `docs/visual-style.md`.

**Deliverable:** `docs/visual-style.md` + a small library of reusable diagram fragments (the agentic loop, fan-out/fan-in, the three-checkpoint verification pipeline, the spec-as-artifact flow).

---

## Group B — Cross-cutting perspectives (thread through existing modules)

These are framings, not standalone topics. Each one wants a short dedicated section *somewhere* it naturally fits, plus callbacks where relevant. Resist the urge to make each one its own module — they'll dilute.

### #6 — Situate as distributions

**Where it lands:** New section in 00 Introduction, "What agents are good at (and what they're not)." Becomes a recurring frame the rest of the playbook calls back to.

**Treatment:** Frame agent capability as a distribution: design choices and well-specified work sit in the fat middle where agents excel; novel algorithms, deep domain modeling, and ambiguous product calls sit in the tails where humans lead. The point isn't a hard line — it's giving the reader a mental model for *deciding* per task.

**Concrete asset:** An actual normal/Gaussian curve with real distribution language — first standard deviation, second standard deviation, tails — labeled "agent-led" in the body and "human-led" in the tails. Using genuine stats vocabulary anchors the visualization to something readers already understand instead of being a hand-wavy bell shape. Bonus points if we can credibly anchor the curve to a real signal (task complexity, novelty, specification clarity) rather than treating it as decorative. Plus a 5-row "in the middle / in the tails" comparison table.

### #7 — Every developer is now an engineering manager

**Where it lands:** Sidebar in 01 Agentic Loop, then explicit reinforcement in 07 (Subagents) and 09 (Production Workflows).

**Treatment:** The skills that matter are now scoping, delegation, review, and feedback — not typing speed. Connect this to existing engineering-management literature (one-on-ones become agent retros; performance reviews become evals).

### #11 — Humans are not always right & #12 — Review was already broken

**Where it lands:** Together, as a new section in 06 Verification and Quality, "Two-way critique."

**Treatment:** Pair these because they're the same coin. Humans rubber-stamp ("LGTM"), agents over-defer. The fix is the same on both sides: the agent should be instructed to push back on weak premises, and the human should review the *reasoning*, not just the diff. Concrete: example instruction-file snippets that license the agent to challenge, plus a review checklist that goes beyond "does it compile."

### #9 — Who should code?

**Where it lands:** Leadership track, as a chapter after 12 Enterprise Adoption. Title something like "Allocating coding work in an agent-augmented team."

**Treatment:** Frame as resource allocation, not gatekeeping. Junior + agent vs. senior + agent produce different artifacts at different costs and different review burdens. The chapter should give leaders a decision framework, not an answer.

---

## Group C — Practitioner posture (developer track)

Discipline content. These are the habits that separate people who get value from agents from people who get expensive randomness.

### #8 — Use coding agents as little as possible

**Where it lands:** New short chapter between 06 and 07 — it's a posture, not a verification technique, so it deserves its own slot rather than a section inside 06.

**Treatment:** The infrastructure that makes agents *less necessary* is also what makes them *more reliable* when you do use them: linters, pre-commit hooks, type checkers, generated clients, generated docs, centralized theming, strong CI. Reframe "automation" as "things you build once so the agent (and you) don't have to think about them again." The infrastructure label on this issue is correct — this slots near production workflows.

### #10 — Lean heavily on design principles

**Where it lands:** New section in 04 Effective Prompting, "Speak in principles." Reinforced in 03 Context Engineering (instruction file should encode them).

**Treatment:** SOLID, KISS, DRY, YAGNI, WYSIWYG aren't optional decoration — they're the shared vocabulary the agent uses to make the thousand small decisions you didn't specify. A developer who can't say "this violates SRP" can't course-correct an agent that just wrote a 600-line god-class.

### #13 — Users NEED to be familiar with coding

**Where it lands:** Stated up front in 00 Introduction as a prerequisite, then elaborated in the new "who should code?" chapter (#9) for the leadership track.

**Treatment:** "Fix this" is not a prompt. The playbook should be honest that agentic coding raises the floor of *what gets produced* but does not lower the floor of *what the operator needs to understand*. Tie this to #7 (developers as managers) — a manager who can't read the work product can't manage.

---

## Group D — Concrete material

### #5 — Concrete examples of full-lifecycle agentic workflows

**Where it lands:** New appendix `docs/examples/` with 2–3 worked examples, linked from 09 Production Workflows and 10 Building Your System.

**Treatment:** Each example walks one realistic feature from PRD → spec → task prompts → agent session(s) → review → merge → follow-up. Show the actual artifacts (instruction file, prompts, agent transcripts trimmed for length, the resulting PR). Resist sanitizing — the messy decisions are where the learning is.

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
| 3 | Visualizations | `docs/visual-style.md` + Mermaid library | new asset |
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
