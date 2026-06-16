---
name: setup
description: Set up a project's stack and dev-environment feedback loops — the agent's senses. For a new/empty repo, interview the user on the desired stack and scaffold it; for an existing project, detect the stack and wire up the dev env. Either way, install a format/lint/type/test gate that runs on every commit. Use when starting a project, onboarding to a repo, or when there's no automated quality gate yet.
disable-model-invocation: true
argument-hint: "[optional: desired stack, e.g. 'python cli' or 'node web service']"
---

# Setup

Get a repo ready for agentic work.

If the user passed arguments (`$ARGUMENTS`), treat them as a hint about the
desired stack or project type and skip the corresponding interview questions —
e.g. `/setup python cli` means don't ask about language or project shape, just
confirm the remaining choices. The goal is a working dev environment plus the **feedback loops** that let an agent verify its own work and retry without you — a formatter, a linter/type-check, a test runner, and a pre-commit gate that runs them on every commit. Friction here is desirable: a failing check blocks the commit, the agent reads the error and fixes it. Agents don't tire of repetition, so deterministic gates are disproportionately powerful.

## Step 0 — Detect the situation

Look before you act:

- `git status` / `git rev-parse` — is this a git repo at all?
- Project manifests — `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `*.csproj`/`*.sln`, `pom.xml`, `Gemfile`, etc.
- Existing tooling — a lockfile, a `.pre-commit-config.yaml` / Husky `.husky/`, CI config under `.github/workflows/`, a configured formatter/linter.

Branch on what you find:
- **No manifest / empty repo →** *New project* path.
- **Manifest present →** *Existing project* path.

## New project — interview, then scaffold

Don't guess the stack. Briefly interview the user (this is the **grill-me** technique, focused on environment choices). Keep questions low-fidelity and offer a sensible default for each:

- **Language & runtime** (and version)?
- **Package manager** (the non-obvious one — e.g. `uv`/`poetry`/`pip`, `pnpm`/`npm`, etc.)?
- **What kind of thing** is it — CLI, library, web service, script/automation? (Shapes the layout.)
- **Test runner** (default to the ecosystem standard)?
- **Formatter & linter** (default to the ecosystem standard)?

Then scaffold:

1. `git init` if needed; add a language-appropriate `.gitignore`.
2. Create the minimal project layout and manifest for the chosen stack.
3. Install dependencies with the chosen package manager.
4. Add a formatter, a linter/type-checker, and a test runner — with one trivial passing test so the suite is green from commit one.
5. Wire the **commit gate** (below).
6. Make an initial commit.

## Existing project — detect, then wire

1. **Identify the stack** from the manifests and lockfiles. Don't assume — read them.
2. **Set up the dev env:** install dependencies with the project's package manager; note any required runtime versions, env vars, or services (`.env.example`, a README "Getting started", a `docker-compose.yml`).
3. **Find the real commands** the project already uses for format / lint / type-check / test / build — check `package.json` scripts, a `Makefile`/`Taskfile`, `pyproject.toml`/`tox.ini`, CI workflows. Confirm each one actually runs.
4. **Fill the gaps:** if there's no formatter, linter, or test gate, propose adding them — but match the project's existing conventions, don't impose a new stack.
5. **Wire the commit gate** if one isn't already present.

## The commit gate (every stack)

The mechanism differs per ecosystem; the principle is identical — run the fast, deterministic checks on every commit, block the commit on failure, and auto-format so all output meets the project's style.

- **Pick the project's native pre-commit mechanism:** the cross-language [`pre-commit`](https://pre-commit.com) framework (a `.pre-commit-config.yaml`), Husky + lint-staged for JS/TS, a Git `pre-commit` hook script, or the equivalent.
- **Run, in order, cheapest first:** auto-format → lint / type-check → the fast test subset. Keep it fast; push slow/e2e tests to CI.
- **Mirror the same checks in CI** so the gate can't be skipped with `--no-verify`.

Confirm the gate works by making a commit that violates a rule and watching it get blocked, then a clean one that passes. (Use the **checklist** skill — don't claim it works without seeing the block.)

## Done when

- [ ] Dependencies install cleanly from a fresh clone
- [ ] `format`, `lint`/type-check, and `test` commands exist and run green
- [ ] A pre-commit gate runs them and blocks a failing commit
- [ ] The same checks run in CI (if the project has CI)
- [ ] A short note in the README (or CLAUDE.md) records the non-standard commands

## Related skills

- **grill-me** — the interview technique used on the new-project path.
- **tdd** — once the test runner is wired, build features test-first.
- **checklist** — verify the gate actually blocks before claiming setup is done.
