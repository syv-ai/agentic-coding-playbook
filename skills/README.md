# Syv.ai Skills Collection

The official Syv.ai agentic-coding skills — the practical companion to the
[Agentic Coding Playbook](../README.md). A curated, best-of-breed set of skills
for steering an agent through real work: planning, execution, quality, and
verification. The skills are plain `SKILL.md` folders that work in any agent
that supports [Agent Skills](https://agentskills.io): Claude Code, GitHub
Copilot, Codex, Cursor and others. Where a skill can use a Claude Code feature,
it says so as an optional note.

## Install

Install it as a plugin in your agent, or copy the skills into a project. Both
give you the same skills from the same `skills/` folder.

### As a plugin

| Agent | Install | Update |
|---|---|---|
| Claude Code | `/plugin marketplace add syv-ai/agentic-coding-playbook`<br>`/plugin install syv-skills@syv-skills` | `/plugin update syv-skills`, or turn on auto-update (below) |
| Codex | `codex plugin marketplace add syv-ai/agentic-coding-playbook`<br>`codex plugin add syv-skills@syv-skills` (or install from `/plugins`) | `codex plugin marketplace upgrade syv-skills` |
| GitHub Copilot CLI | `copilot plugin marketplace add syv-ai/agentic-coding-playbook`<br>`copilot plugin install syv-skills@syv-skills` | `copilot plugin update syv-skills` |
| VS Code (Copilot agent plugins) | Add `"chat.plugins.marketplaces": ["syv-ai/agentic-coding-playbook"]` to your settings, then install **syv-skills** from the Agent Plugins section of the Extensions view | **Extensions: Check for Extension Updates**, or daily with `extensions.autoUpdate` |
| Cursor | A team admin imports the repo under Dashboard → Plugins & MCPs → Add Marketplace → Import from Repo; developers install it from Customize | Imported marketplaces refresh on their own |
| Gemini CLI (0.26+) | `gemini extensions install https://github.com/syv-ai/agentic-coding-playbook --auto-update` | Automatic with `--auto-update`, otherwise `gemini extensions update syv-skills` |
| Pi | `pi install git:github.com/syv-ai/agentic-coding-playbook` | `pi update git:github.com/syv-ai/agentic-coding-playbook` |

New skills show up in the next session. Claude Code doesn't auto-update
third-party marketplaces by default. To turn it on, run `/plugin`, open
**Marketplaces**, select `syv-skills` and choose **Enable auto-update**.

### As project files, with `npx skills` or `gh skill`

These copy the skills into your project, so re-run the same command to update:

```bash
npx skills add syv-ai/agentic-coding-playbook
# or
gh skill install syv-ai/agentic-coding-playbook --all
```

- **`npx skills`** puts skills in `.agents/skills/` for Copilot, Codex, Cursor
  and most other agents, and in `.claude/skills/` for Claude Code. It needs
  Node.js 18+. On Windows, add `--copy`: Windows blocks symlinks without
  Developer Mode or admin rights.
- **`gh skill`** takes `--agent <name>` (for example `--agent github-copilot`)
  if you have several agents set up.

Either way, skills are then available as `/skill-name`, and agents pick them
up on their own when a task matches a skill's description.

### Notes for any install

- `improve-code-design` delegates to two subagents. Their prompts ship inside
  the skill, so any agent that can start a subagent can use them; nothing needs
  copying. The Claude Code and Cursor plugins also register them as named
  agents.
- Skills marked *(user-only command)* below run only when you call them.
  Claude Code, Codex, Cursor, VS Code and Pi respect this. Gemini CLI doesn't
  yet, so there the agent may also start them on its own.
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
- [`work-autonomously`](work-autonomously/) — hand over a plan or spec and walk away: one batch of questions up front, then the agent plans, decides and executes on its own, logging every decision in `design-decisions.md`, delegating to subagents to save context, and keeping a Mac awake with `caffeinate`. *(User-only command.)*
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
