# Syv.ai Skills Collection

The official Syv.ai agentic-coding skills — the practical companion to the
[Agentic Coding Playbook](../README.md). A curated, best-of-breed set of skills
for steering an agent through real work: planning, execution, quality, and
verification. Tool-agnostic in spirit; written for Claude Code, and usable from
GitHub Copilot and other agents that read `SKILL.md` folders.

## Install

Three ways — pick one.

### A. As a Claude Code plugin (recommended)

Installs through Claude Code's native plugin system, so `/plugin update` keeps
it current:

```
/plugin marketplace add syv-ai/agentic-coding-playbook
/plugin install syv-skills@syv-skills
```

### B. As on-disk skill files

Copies the collection into your project (no plugin system involved):

```bash
npx skills add syv-ai/agentic-coding-playbook   # puts the collection on disk
```

**On Windows**, pin the agent and copy instead of symlinking — Windows blocks
symlink creation without Developer Mode / admin rights:

```bash
npx skills add syv-ai/agentic-coding-playbook --agent claude-code --copy
```

Requires Node.js 18+. (`--agent claude-code` also ensures the skills land in
`.claude/skills/` rather than a generic agent directory.)

### C. With GitHub Copilot (or any other agent `gh skill` supports)

The GitHub CLI installs the skills into the directory your agent reads
(`.github/skills/` for Copilot):

```bash
gh skill install syv-ai/agentic-coding-playbook --all
```

Add `--agent github-copilot` if you have several agents set up. Skills are then
available in Copilot chat as `/skill-name`, and Copilot picks them up on its own
when a task matches a skill's description.

Two skills need a little more than the skill folder:

- `improve-code-design` delegates to two subagents. `gh skill install` copies
  only skill folders, so copy the Copilot versions out of the installed skill
  once: `cp .github/skills/improve-code-design/agents/*.agent.md .github/agents/`.
- `grill-me` and the visual companions ask through a question tool:
  `AskUserQuestion` in Claude Code, `askQuestions` in VS Code. If the question
  carousel does not appear in VS Code, turn on `chat.askQuestions.enabled`.

### Then, in your project

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
- [`visual-plan`](visual-plan/) — render a high-stakes plan as a self-contained HTML review surface (diagrams, file maps, annotated code, open questions); decisions captured in the terminal.
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
- [`improve-code-design`](improve-code-design/) — name the anti-pattern a piece of code is an instance of, the principle it violates, and the pattern that fixes it. Its sibling above asks "is this module deep?"; this one asks "does this violate a named principle, and is there a named remedy?" Enumeration is delegated to the `design-inventory` agent and the suppression gate to `design-auditor`, both in [`agents/`](../agents/) (Copilot copies ship inside the skill under `agents/`).
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
