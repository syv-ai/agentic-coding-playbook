---
name: write-a-skill
description: Create or edit agent skills with proper structure, a discoverable description, progressive disclosure, and bundled resources. Use when the user wants to write, create, build, or revise a skill, or asks how skills should be structured.
---

# Write a Skill

A skill is a reusable reference for a technique, pattern or workflow that a future agent can find and apply. It isn't a narrative about how one problem was solved once.

**Create one when** the technique isn't obvious, applies across projects, and involves judgement. **Don't** for one-off solutions, things documented well elsewhere, project conventions (those belong in the project's instructions file — AGENTS.md, or CLAUDE.md in Claude Code), or mechanical rules a script or hook can enforce.

## Process

1. **Gather requirements** — what task or domain, which cases it must handle, whether it needs scripts, what reference material to include. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text.
2. **Draft** — `SKILL.md` first; split heavy or distinct content into reference files; add scripts for deterministic operations.
3. **Test** — see [testing-skills-with-subagents.md](testing-skills-with-subagents.md).
4. **Review with the user** — cases covered, gaps, sections too thin or too heavy.

## Structure

```
skill-name/
├── SKILL.md            # instructions (required)
├── REFERENCE.md        # depth, loaded only when needed
├── scripts/            # deterministic operations
└── agents/openai.yaml  # only for manual-only skills (Codex)
```

Every skill lives at `skills/<skill-name>/` in one flat namespace. Keep `SKILL.md` to roughly 100 lines: principles and short patterns inline, depth in files referenced one level deep. A loaded skill stays in context for the rest of the session, so every line is a recurring cost.

## Frontmatter

Use the [Agent Skills](https://agentskills.io) spec fields by default, so the skill loads in any harness:

```yaml
---
name: skill-name          # letters, numbers, hyphens; matches the folder
description: <capability>. Use when <triggers>.
---
```

Add tool-specific fields only when the skill needs them:

- **Manual-only skills** (side effects, or timing the user should control): add `disable-model-invocation: true` and, if useful, `argument-hint`. Also add `agents/openai.yaml` so Codex respects it:
  ```yaml
  policy:
    allow_implicit_invocation: false
  ```
- Other Claude Code fields (`context`, `agent`, `allowed-tools`, `when_to_use`, `paths`) are fine when they earn their place. Most harnesses ignore unknown fields, but uploads to claude.ai and the Skills API reject them.

## The description is the most important line

The description is all an agent sees when deciding whether to load the skill.

- Third person; a short capability clause, then "Use when …" with concrete triggers: symptoms, situations, keywords, error strings. Aim for under 500 characters.
- Don't summarise the workflow. When the description spells out the steps, agents follow the description and skip the body.
- Name skills by what they do, verb-first where natural (`condition-based-waiting` over `async-test-helpers`).

```yaml
# Summarises the workflow — agents follow this and skip the skill
description: Use for TDD - write test first, watch it fail, write minimal code, refactor
# Capability + triggers
description: Test-driven development with red-green-refactor. Use when implementing a feature or bugfix, before writing implementation code.
```

## Conventions for this collection

- **Multi-agent first.** Write for any harness. Say "the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code)"; don't assume CLAUDE.md, `.claude/`, `docs/`, GitHub or git commits unless the project's instructions say so. For questions: "Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text." For exploration: "delegate to an exploration subagent if your harness has one; otherwise keep the exploration narrow."
- **Harness-specific features as notes.** Workflows, `/goal`, Stop hooks, Artifacts, `context: fork` and `${CLAUDE_SKILL_DIR}` appear only as short "In Claude Code, …" notes next to a portable default.
- **Project facts come from the project.** Trackers, where specs and plans go, planning depth and verification commands come from the instructions file. If it's silent: infer from the repo, then ask, then offer to record the answer there. Don't invent settings files.
- **Scale to the task.** If a change fits in one sentence, the skill should let the agent skip the ceremony, and say so.
- **Calm, direct tone.** Imperative instructions with the reason in a clause. No capitalised MUST/NEVER, iron laws or lists of forbidden excuses; current models over-apply shouted rules.
- **Self-contained.** Depend only on other skills in this collection, referenced by name in bold (e.g. use the **tdd** skill), never with `@path` syntax, which force-loads the file.
- **English bodies**, consistent terminology, no time-sensitive information, one good example rather than several weak ones.

## Testing

Watch an agent handle a realistic scenario without the skill, write the smallest skill that fixes what you saw, then re-run with it — including a small-task scenario to check it scales down. Details in [testing-skills-with-subagents.md](testing-skills-with-subagents.md); Anthropic's authoring guidance is in [anthropic-best-practices.md](anthropic-best-practices.md).

In Claude Code, `claude plugin eval` measures how often a plugin skill triggers across realistic prompts, against a no-plugin baseline.

## Review checklist

- [ ] `name` matches the folder; spec frontmatter unless a tool field is needed
- [ ] Manual-only skills have `disable-model-invocation: true` and `agents/openai.yaml`
- [ ] Description is third person, "Use when …", and doesn't summarise the workflow
- [ ] `SKILL.md` is roughly 100 lines; depth moved to referenced files
- [ ] No hard-coded CLAUDE.md, `.claude/`, `docs/`, GitHub or single-harness tool names without a neutral default
- [ ] Scales down for small tasks; calm tone
- [ ] Tested against a baseline scenario, not just read
