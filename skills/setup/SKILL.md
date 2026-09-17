---
name: setup
description: Set up a project's stack and dev-environment feedback loops — the agent's senses. For a new or empty repo, interview the user on the desired stack and scaffold it; for an existing project, detect the stack and wire up the dev environment. Either way, install a format/lint/type/test gate that runs on every commit. Use when starting a project, onboarding to a repo, or when there's no automated quality gate yet.
disable-model-invocation: true
argument-hint: "[optional: desired stack, e.g. 'python cli' or 'node web service']"
---

# Setup

Get a repo ready for agentic work: a working dev environment plus the feedback loops that let an agent verify its own work and retry without you — a formatter, a linter or type-check, a test runner, and a gate that runs them on every commit. A failing check blocks the commit, the agent reads the error and fixes it. Agents don't tire of repetition, so deterministic gates pay off disproportionately.

If the user passed arguments (`$ARGUMENTS` in Claude Code), treat them as a hint about the stack and skip the matching interview questions — `setup python cli` means don't ask about language or project shape, just confirm the rest.

## 0. Detect the situation

- Is this a version-controlled repo at all (`git rev-parse`, or the project's VCS)?
- Project manifests: `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `*.csproj`/`*.sln`, `pom.xml`, `Gemfile`, …
- Existing tooling: lockfiles, `.pre-commit-config.yaml`, `.husky/`, CI config, a configured formatter or linter.
- The project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code): does it already name the commands?

No manifest → **new project**. Manifest present → **existing project**.

## New project: interview, then scaffold

Don't guess the stack. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Batch the questions and offer a sensible default for each:

- Language and runtime version
- Package manager (`uv`/`poetry`/`pip`, `pnpm`/`npm`, …)
- What it is: CLI, library, web service, script
- Test runner, formatter and linter (default to the ecosystem standard)

Then scaffold:

1. Initialise version control if needed, with a language-appropriate ignore file.
2. Create the minimal layout and manifest for the stack.
3. Install dependencies with the chosen package manager.
4. Add the formatter, linter or type-checker, and test runner, with one trivial passing test so the suite is green from the start.
5. Wire the commit gate (below).
6. Make an initial commit if the user wants one.

## Existing project: detect, then wire

1. **Identify the stack** from manifests and lockfiles.
2. **Set up the environment:** install dependencies with the project's package manager; note required runtime versions, env vars or services (`.env.example`, README, `docker-compose.yml`).
3. **Find the real commands** for format, lint, type-check, test and build — package scripts, `Makefile`/`Taskfile`, `pyproject.toml`/`tox.ini`, CI workflows. Run each one to confirm it works.
4. **Fill gaps** by proposing a formatter, linter or test gate where missing, matching the project's conventions rather than imposing a new stack.
5. **Wire the commit gate** if there isn't one.

## The commit gate

The mechanism differs per ecosystem; the principle doesn't. Run the fast, deterministic checks on every commit, block on failure, and auto-format.

- Use the project's native mechanism: the [`pre-commit`](https://pre-commit.com) framework, Husky + lint-staged for JS/TS, a plain git hook, or the equivalent.
- Order cheapest first: format → lint/type-check → the fast test subset. Push slow and end-to-end tests to CI.
- Mirror the same checks in CI if the project has CI, so skipping the local hook doesn't skip the checks.

Confirm it works: make a commit that breaks a rule and watch it get blocked, then a clean one that passes. Report the output you saw.

## Record the commands

Add a short section to the project's instructions file so every agent and skill can find the checks without rediscovering them. Only include what an agent couldn't infer; if the file already covers it, leave it alone. If the project has no instructions file, ask before creating one.

```markdown
## Verification
- Format: `<command>`
- Lint / type-check: `<command>`
- Test: `<command>` (fast subset: `<command>`)
- The commit gate runs these; CI mirrors them.
```

## Done when

- [ ] Dependencies install cleanly from a fresh clone
- [ ] Format, lint/type-check and test commands exist and run green
- [ ] A commit gate runs them and blocks a failing commit
- [ ] CI runs the same checks (if the project has CI)
- [ ] The commands are recorded in the project's instructions file

## Related skills

- **grill-me** — the interview technique for the new-project path.
- **tdd** — once the test runner is wired, build features test-first.
- **guardrails** — block destructive commands and set a conservative posture.
