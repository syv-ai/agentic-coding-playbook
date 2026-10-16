---
name: write-a-skill
description: Writes and revises agent skills (SKILL.md folders) — whether one is worth writing, a description that triggers, a body agents follow, bundled scripts and references, and how to test it. Use when the user wants to create, edit, review or test a skill, when a skill doesn't trigger or isn't followed, or when they ask how skills should be structured. Project conventions belong in the project's instructions file instead.
---

# Write a Skill

A skill is a folder with a `SKILL.md` that a future agent loads when a task matches its description. It holds a technique, workflow or body of knowledge the agent lacks, not the story of how one problem was solved once.

**Write one when** the task recurs, the knowledge isn't something the agent already has, and getting it wrong is costly. **Don't** when the agent already does the task well without it (watch a run first), for a one-off fix, for project conventions (those go in the project's instructions file — AGENTS.md or CLAUDE.md), or for a rule a script, linter or hook can enforce.

## Process

1. **Start from real material.** The user's expertise, a session where the work went well, runbooks, review comments, past failures. Ask what it must handle and where it stops. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split larger batches. Done when you can name two or three realistic tasks the skill must change.
2. **Watch a baseline.** Run one of those tasks with a fresh agent and no skill, and record what it does. If it already does the task well, stop: there is nothing to write. When revising, the baseline is the current version.
3. **Draft** the smallest skill that fixes what you saw: `SKILL.md` first, depth in references, scripts for deterministic steps.
4. **Evaluate** with the same tasks, plus one where the skill shouldn't apply and one small task it should scale down for. See [references/testing.md](references/testing.md).
5. **Review with the user**: cases covered, gaps, sections too thin or too heavy. Done when they agree it's ready.

## Structure and frontmatter

```
skill-name/
├── SKILL.md            # required
├── references/         # depth, read only when a step says so
├── scripts/            # deterministic operations
├── assets/             # templates, schemas, static files
└── agents/openai.yaml  # Codex metadata, only when needed
```

Use the [Agent Skills](https://agentskills.io/specification) fields so the skill loads in any harness:

```yaml
---
name: skill-name      # 1–64 chars: lowercase, digits, single hyphens; matches the folder
description: <capability>. Use when <triggers>.   # 1–1024 chars
---
```

Optional spec fields are `license`, `compatibility`, `metadata` and the experimental `allowed-tools`. Add harness fields (`disable-model-invocation`, `argument-hint`, `context`, …) only when the skill needs them. Read [references/frontmatter-and-harnesses.md](references/frontmatter-and-harnesses.md) before adding one, before making a skill manual-only, or when a skill loads in one harness but not another.

**Manual-only skills** (side effects, or timing the user should control) set `disable-model-invocation: true` and add `agents/openai.yaml` with `policy: { allow_implicit_invocation: false }` for Codex. Gemini CLI ignores the field, so the skill stays model-invocable there.

## The description decides whether the skill runs

The agent sees only names and descriptions when it picks a skill, and descriptions get cut when the listing is crowded, so put the key use case first.

- A capability clause, then "Use when …" framed by what the user is trying to do, including requests that don't name the domain. One trigger per distinct case; synonyms for the same case add length without reach.
- Lean towards triggering, and say where the skill stops when a neighbouring skill covers the next case.
- Don't summarise the workflow. An agent given the steps in the description tends to follow those and skip the body.
- A manual-only skill gets a one-line description for the person browsing the slash menu, since harnesses that honour manual-only keep it out of the model's listing. Gemini CLI still shows it to the model, so keep it accurate.

```yaml
# Summarises the workflow: agents follow this and skip the body
description: Use for TDD - write test first, watch it fail, write minimal code, refactor
# Capability, then triggers
description: Test-driven development with red-green-refactor. Use when implementing a feature or bugfix that has a testable seam.
```

## Writing the body

- **Only what the agent lacks.** Every line costs context on every turn after the skill loads. Cut what the model does by default and what it can look up (`package.json` scripts, `--help`). Keep the unwritten convention, the reason behind a choice, and the gotcha.
- **A gotchas section** for the specific mistakes you saw in the baseline.
- **Defaults, not menus.** Name the approach to use and when to switch; a list of five equal options leaves the agent to guess.
- **Instructions that hold for the whole task:** "run the tests after every edit", not "run the tests". The skill is read once and isn't re-read on later turns.
- **Most important first.** In Claude Code, only the first ~5,000 tokens of an invoked skill are re-attached after compaction.
- **Conditional pointers.** Each reference link says when to read it ("read X before Y"). Keep references one level deep.
- **Scripts for deterministic steps**, invoked through their interpreter (`bash scripts/check.sh`, `python3 scripts/build.py`) with paths relative to the skill folder, since packagers can drop the executable bit.

Read [references/writing-the-body.md](references/writing-the-body.md) when choosing how to phrase a rule, when a draft isn't changing behaviour, or when designing a bundled script.

## Conventions for this collection

- **Portable first.** Write for any harness. Say "the project's instructions file (AGENTS.md or CLAUDE.md)"; don't assume CLAUDE.md, `.claude/`, `docs/`, GitHub or git unless the project's instructions say so. For questions, use the question-tool sentence in step 1. For exploration: "delegate to an exploration subagent if your harness has one; otherwise keep the exploration narrow."
- **Harness features as notes.** `context: fork`, `${CLAUDE_SKILL_DIR}`, hooks and workflows appear only as short "In Claude Code, …" notes beside a portable default.
- **Reports: artifact if possible, local file otherwise.** A page for a person is published where the harness can (Claude Code's `Artifact` tool) and otherwise written as a self-contained HTML file. Share full absolute paths for anything written for a person to read.
- **Work with the harness.** For permissions, safety or automation, configure the harness's own features rather than custom hooks, wrappers or shims. If the harness can't do it, say so.
- **Project facts come from the project.** Trackers, plan locations and verification commands come from the instructions file; if it's silent, infer from the repo, then ask, then offer to record the answer.
- **Scale to the task.** If a change fits in one sentence, the skill lets the agent skip the ceremony, and says so.
- **Calm, direct tone.** Imperative instructions with the reason in a clause. No capitalised MUST/NEVER or lists of forbidden excuses; current models over-apply shouted rules.
- **No recap, benefits or social-proof sections.** They cost context and change nothing. A rationale inside a discipline skill is different: it can be what holds the rule under pressure, so test before cutting it.
- **Self-contained.** Depend only on other skills in this collection, named in bold (use the **tdd** skill), never with `@path` syntax, which force-loads the file.
- **English bodies**, consistent terms, nothing time-sensitive, one good example rather than several weak ones.

## Testing

Watch a baseline, write the smallest fix, re-run, and repeat each scenario several times because single runs mislead. Check triggering with realistic should- and shouldn't-trigger requests, and output quality with and without the skill. Read [references/testing.md](references/testing.md) before evaluating a new skill or a revision.

## Review checklist

- [ ] A baseline run showed the agent needs this skill
- [ ] `name` matches the folder and the spec rules; spec frontmatter unless a harness field is needed
- [ ] Passes `claude plugin validate` on the plugin root or the skills folder, where Claude Code is available
- [ ] Description: key use case first, "Use when …", no workflow summary, says where it stops
- [ ] Trigger evals pass on held-out requests, including near-misses
- [ ] Manual-only skills: `disable-model-invocation: true`, `agents/openai.yaml` for Codex, and a description that's safe for Gemini CLI to see
- [ ] `SKILL.md` around 100 lines, most important first; each reference has a "read when" pointer
- [ ] Scripts run through their interpreter and work non-interactively
- [ ] No hard-coded CLAUDE.md, `.claude/`, `docs/`, GitHub or single-harness tool names without a neutral default
- [ ] Scales down for small tasks; calm tone
