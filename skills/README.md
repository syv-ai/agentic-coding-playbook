# Syv.ai Skills Collection

The official Syv.ai agentic-coding skills — the practical companion to the
[Agentic Coding Playbook](../README.md). A curated, best-of-breed set of skills
for steering an agent through real work: planning, execution, quality, and
verification. The skills are plain `SKILL.md` folders that work in any agent
that supports [Agent Skills](https://agentskills.io): Claude Code, GitHub
Copilot, Codex, Cursor and others. Where a skill can use a Claude Code feature,
it says so as an optional note.

## Install

Three ways — pick one.

### A. As a Claude Code plugin

Installs through Claude Code's plugin system:

```
/plugin marketplace add syv-ai/agentic-coding-playbook
/plugin install syv-skills@syv-skills
```

Third-party marketplaces don't auto-update by default. To receive new versions
automatically, run `/plugin`, open **Marketplaces**, select `syv-skills` and
choose **Enable auto-update**. Otherwise update by hand with `/plugin update`.

### B. With `npx skills` (any agent)

Copies the collection into your project:

```bash
npx skills add syv-ai/agentic-coding-playbook
```

Skills land in `.agents/skills/` for Copilot, Codex, Cursor and most other
agents, and in `.claude/skills/` for Claude Code. Requires Node.js 18+.

**On Windows**, copy instead of symlinking — Windows blocks symlink creation
without Developer Mode or admin rights:

```bash
npx skills add syv-ai/agentic-coding-playbook --copy
```

### C. With the GitHub CLI (any agent `gh skill` supports)

```bash
gh skill install syv-ai/agentic-coding-playbook --all
```

Add `--agent <name>` (for example `--agent github-copilot`) if you have several
agents set up. Skills are then available as `/skill-name`, and agents pick them
up on their own when a task matches a skill's description.

### Notes for any install

- `improve-code-design` delegates to two subagents. Their prompts ship inside
  the skill, so any agent that can start a subagent can use them; nothing needs
  copying. The Claude Code plugin also registers them as named agents.
- Skills that interview you ask through the agent's question tool:
  `AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot (turn on
  `chat.askQuestions.enabled` if the question carousel doesn't appear), and plain
  text elsewhere.

### Then, in your project

```
/setup-syv-skills
```

It asks how your team works — tracker, specs and plans, planning depth,
verification, which agents you use — and records the answers as a short
section in your project's instructions file (AGENTS.md, or CLAUDE.md for
Claude Code). The other skills follow that section. Updating the collection
never touches it.

## The catalog

**Alignment & planning**
- [`grill-me`](grill-me/) — the agent interviews you relentlessly until the plan is unambiguous.
- [`brainstorming`](brainstorming/) — idea → design → spec, with an optional browser visual companion for mockups and diagrams.
- [`track-work`](track-work/) — record what's being built (PRD, spec, feature description) and break it into work items, in whatever tracker the project uses. *(User-only command.)*
- [`writing-plans`](writing-plans/) — turn a spec into a detailed implementation plan.
- [`visual-plan`](visual-plan/) — render a high-stakes plan as a self-contained HTML review surface (diagrams, file maps, annotated code, open questions); decisions captured in the conversation.
- [`prototype`](prototype/) — build a throwaway prototype to settle a design decision before committing.

**Execution**
- [`executing-plans`](executing-plans/) — execute a written plan with review checkpoints.
- [`zoom-out`](zoom-out/) — get a higher-level map of an unfamiliar area of the codebase.

**Quality & verification**
- [`tdd`](tdd/) — red-green-refactor with behaviour-first, tracer-bullet tests.
- [`systematic-debugging`](systematic-debugging/) — build a feedback loop → reproduce → hypothesise → instrument → fix → regression-test.
- [`receiving-code-review`](receiving-code-review/) — process review feedback with rigour, not performative agreement.

**Safety**
- [`guardrails`](guardrails/) — review what an agent could damage in this repo, note the safety controls already in place, and ask whether to cover each remaining risk with the agent's own settings (permission rules, sandbox). *(User-only command.)*

**Architecture, lifecycle & meta**
- [`improve-codebase-architecture`](improve-codebase-architecture/) — find shallow modules, propose deeper ones.
- [`improve-code-design`](improve-code-design/) — name the anti-pattern a piece of code is an instance of, the principle it violates, and the pattern that fixes it. Its sibling above asks "is this module deep?"; this one asks "does this violate a named principle, and is there a named remedy?" Enumeration is delegated to a `design-inventory` subagent and the suppression gate to `design-auditor`; both prompts ship inside the skill.
- [`handoff`](handoff/) — compact the conversation into a handoff doc for a fresh session.
- [`write-a-skill`](write-a-skill/) — author new skills for this collection, with progressive disclosure.

**Setup**
- [`setup`](setup/) — set up a project's stack and dev-env feedback loops (new or existing repo). *(User-only command.)*
- [`setup-syv-skills`](setup-syv-skills/) — interview the team about how agents should work here and record it in the instructions file. *(User-only command.)*

## Design principles

- **Multi-agent.** AGENTS.md and plain `SKILL.md` folders first. Claude Code
  features (subagent types, workflows, `/goal`, hooks) are optional notes with a
  portable default. Reports are published as artifacts where the harness can,
  and written as local HTML files otherwise, always with their full path shared.
- **The project decides.** Skills don't assume GitHub, PRDs, a `docs/` folder or
  committed plans. They follow the project's instructions file, infer from the
  repo, and ask when still unsure.
- **Scale to the task.** A change that fits in one sentence skips the ceremony.
- **Self-contained.** Every skill stands on its own or depends only on *other
  skills in this collection* — never on an external plugin that may come or go.
- **English bodies.** Skill instructions are in English for model performance;
  workshop slide-facing copy is localized separately.
- **Progressive disclosure.** Keep `SKILL.md` tight; push depth into referenced
  files that load only when needed.

See [ATTRIBUTION.md](ATTRIBUTION.md) for provenance and licensing.
