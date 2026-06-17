# Syv.ai Skills Collection

The official Syv.ai agentic-coding skills — the practical companion to the
[Agentic Coding Playbook](../README.md). A curated, best-of-breed set of skills
for steering an agent through real work: planning, execution, quality, and
verification. Tool-agnostic in spirit; written for Claude Code.

## Install

```bash
npx skills add syv-ai/agentic-coding-playbook   # puts the collection on disk
```

Then, inside Claude Code in your project:

```
/setup-syv-skills                                # readies this repo to use the collection
```

## The catalog

**Alignment & planning**
- [`grill-me`](grill-me/) — the agent interviews you relentlessly until the plan is unambiguous.
- [`brainstorming`](brainstorming/) — full idea→design→spec flow, with an optional browser visual companion for mockups and diagrams.
- [`to-prd`](to-prd/) — turn the current conversation into a PRD.
- [`to-issues`](to-issues/) — break a plan/PRD into independently-shippable vertical-slice issues.
- [`writing-plans`](writing-plans/) — turn a spec into a detailed implementation plan.
- [`prototype`](prototype/) — build a throwaway prototype to settle a design decision before committing.

**Execution**
- [`executing-plans`](executing-plans/) — execute a written plan with review checkpoints.
- [`zoom-out`](zoom-out/) — get a higher-level map of an unfamiliar area of the codebase.

**Quality & verification**
- [`tdd`](tdd/) — disciplined red-green-refactor with behavior-first, tracer-bullet tests.
- [`systematic-debugging`](systematic-debugging/) — reproduce → minimise → hypothesise → instrument → fix → regression-test.
- [`receiving-code-review`](receiving-code-review/) — process review feedback with rigor, not performative agreement.

**Safety**
- [`guardrails`](guardrails/) — lock down a repo/session: install deterministic hooks that hard-block destructive commands, plus a ruthlessly-conservative posture that demands explicit approval before touching remote DBs, internal systems, production, secrets, or PII. *(User-only command.)*

**Architecture, lifecycle & meta**
- [`improve-codebase-architecture`](improve-codebase-architecture/) — find shallow modules, propose deeper ones.
- [`handoff`](handoff/) — compact the conversation into a handoff doc for a fresh session.
- [`write-a-skill`](write-a-skill/) — author new skills for this collection, with progressive disclosure.

**Setup**
- [`setup`](setup/) — set up a project's stack and dev-env feedback loops (new or existing repo).
- [`setup-syv-skills`](setup-syv-skills/) — one-command onboarding for this collection.

## Design principles

- **Self-contained.** Every skill stands on its own or depends only on *other
  skills in this collection* — never on an external plugin that may come or go.
- **English bodies.** Skill instructions are in English for model performance;
  workshop slide-facing copy is localized separately.
- **Progressive disclosure.** Keep `SKILL.md` tight; push depth into referenced
  files that load only when needed.

See [ATTRIBUTION.md](ATTRIBUTION.md) for provenance and licensing.
