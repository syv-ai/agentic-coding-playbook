# Integration plan — fold N.C. Nielsen 1.1 insights into the playbook

> **Status: DRAFT for sign-off.** No `docs/` files edited yet. Source of the new material is the
> hardened workshop content (`ncnielsen/plan/06-session-1-1-hard-content.md`). Coverage recon
> confirmed the spine already covers 11 of 21 topics thoroughly — this plan only touches the **2
> absent** + **9 thin** topics.

## Constraints (house style)

- **Tool-agnostic.** Each addition states the transferable *principle*; Claude Code specifics
  (skills, `grill-me`, hooks, plan mode, worktrees) appear as *implementation illustration* only —
  the shanraisshan convention.
- **Match the module.** Mirror each module's existing voice, and extend its `## Exercises` /
  `## References` where a new section warrants it.
- **No new modules.** Everything lands in existing files.
- **Don't touch** the 11 THOROUGH topics (skills, MCP, hooks, CLAUDE.md, context rot, lifecycle,
  worktrees, comprehension debt, TDD, session hygiene, CI/CD) beyond a cross-reference where useful.
- **Delivery:** one branch `docs/workshop-1-1-integration` → one PR.

## The plan

| # | Topic | Target | Section | Type |
|---|---|---|---|---|
| A1 | Alignment interview (grill-me) | `04-effective-prompting.md` | new `## Align Before You Build` (after "Conversational Iteration") | NEW section |
| A2 | Disposable interactive artifacts | `11-from-business-context-to-agent-tasks.md` | new `### Disposable Interactive Mockups` (under "The Spec-as-Artifact Pattern") | NEW subsection |
| T1 | Permissions: blast radius + approval fatigue | `02-environment-setup.md` | "Permissions and Safety" | enrich |
| T2 | Plan mode as forcing function | `04-effective-prompting.md` | "3. Separate Research from Implementation" | enrich |
| T3 | Thinking is the leverage | `01-the-agentic-loop.md` | "You Are Part of the Loop" | enrich |
| T4 | SOLID/DRY/KISS/YAGNI + implosion curve | `12-enterprise-adoption.md` | "Code Health: The Prerequisite" | enrich |
| T5 | Systematic debugging methodology | `06-verification-and-quality.md` | new `## Debugging Methodically` (after "Testing Strategies") | NEW section |
| T6 | Agent-as-reviewer (fresh context) | `06-verification-and-quality.md` | "Layer 3: Human Review" → add `### Agent Code Review` | NEW subsection |
| T7 | Incident management | `09-production-workflows.md` | new `### Incident Response` (after "Scheduled Agent Tasks") | NEW subsection |
| T8 | Stale docs are dangerous + pruning | `03-context-engineering.md` | "Just-In-Time Context" | enrich |
| T9 | Build-then-rebuild = probe to learn | `12-enterprise-adoption.md` | "Build and Rebuild" | enrich (sharpen) |

## Detail on the new sections

**A1 — Align Before You Build (`04`).** Principle: resolving ambiguity in *questions* is far cheaper
than in regenerated code; have the agent interview you and walk the decision tree before it writes
anything — it forces *and* aids your thinking, and surfaces angles you hadn't considered. Hygiene:
conversation not interrogation; grill low-fidelity (names/rules), prototype the high-fidelity ("how
should it feel?"); don't discard the session — pipe it into the PRD. Implementation note: the
`grill-me` skill. Add one exercise. Cross-ref `11` (PRD).

**A2 — Disposable Interactive Mockups (`11`).** Principle: see-and-click collapses ambiguity faster
than prose, and not just for UI — a throwaway interactive artifact can explain a dataset, a flow, or
a concept. It's disposable: settle the decision, then delete it. Implementation: ask the agent for a
self-contained HTML artifact (a static-HTML `prototype`/`brainstorming` companion needs only a
browser). Sits beside Spec-as-Artifact as the *visual* alignment artifact.

**T5 — Debugging Methodically (`06`).** Principle: give the agent *evidence, not vibes* — "still
doesn't work" yields wrong fixes. Loop: reproduce reliably → instrument (logs, DevTools, terminal,
or agent-inserted `print`/`console.log`) → find the root cause, not the symptom → add a regression
test. Implementation note: `systematic-debugging`. Add one exercise.

**T6 — Agent Code Review (`06`).** Principle: a reviewer that didn't write the code (sees only the
diff) isn't anchored to defend it — run an agent review on *every* change. It raises the floor; it
doesn't replace human review, and human PR review was always imperfect — agents just fail
differently. Implementation: `/code-review`.

**T7 — Incident Response (`09`).** Principle: agents move into the pipeline — an agent can pull
logs/context, form ranked hypotheses, propose a mitigation, draft the write-up. Mandatory caveat:
high autonomy = high blast radius → scoped permissions, hooks/guardrails, human approval gates.
Frame as emerging-but-real.

## Enrichment notes (one-liners)

- **T1** add the autonomy spectrum (ask / auto / bypass), *match level to blast radius*, and
  *approval fatigue → rubber-stamping*.
- **T2** plan mode primes context and is a *forcing function for concrete requirements* (plan the
  whole task before acting, vs. figuring out the codebase as it goes).
- **T3** output quality is decided upstream; *AI amplifies your process* (clear in/clear out);
  delegate the typing, not the judgment.
- **T4** name SOLID/DRY/KISS/YAGNI + clear contracts; the *velocity curve inverts* (vibe fast then
  craters); bad code is the most expensive it's ever been. Add Ousterhout / Pragmatic Programmer refs.
- **T8** the agent *trusts* your docs, so stale docs are actively dangerous; keep *few* but living;
  treat docs like code; prune dead docs (reconcile head-on with slim-instruction-file guidance).
- **T9** sharpen "first build is a probe to learn" + "deliberate, not vibe-forever."

## Non-goals / open questions for sign-off

1. **A2 placement:** `11` (Spec-as-Artifact) vs `04` (a prompting pattern). Plan picks `11`. OK?
2. **T3 placement:** `01` vs `04` intro. Plan picks `01`. OK?
3. Keep it tool-agnostic (skills as illustration), or — since the workshop was explicitly Claude
   Code — allow slightly more concrete CC detail in these sections than the rest of the spine?
4. Should `docs/research-summary.md` / `further-reading.md` get any of the workshop's source anchors
   (Ousterhout, Pragmatic Programmer, Pocock) via `/knowledge`, or leave sources as-is?
