---
name: setup-syv-skills
description: One-command onboarding for the Syv.ai skills collection. Checks the environment (git, GitHub CLI auth), seeds a slim CLAUDE.md pointer if absent, confirms which skills resolved, and gives a short orientation. Use when a user has just installed the collection and runs /setup-syv-skills, or asks how to get set up to use the Syv skills.
disable-model-invocation: true
---

# Setup Syv Skills

The onboarding command for the Syv.ai skills collection. After a user installs
the collection (`npx skills add syv-ai/agentic-coding-playbook`), this readies
**the current repo and environment** to use it. This is the workshop "pre-flight"
collapsed into one command — run explicitly, never auto-invoked.

This is a prompt-driven skill, not a script. Explore the current state, report
what you found, fix what's missing with the user's go-ahead, and orient them.

## Process

### 1. Check the environment

Run these and report a short PASS/ACTION line for each — don't fix silently:

- **Git** — `git rev-parse --is-inside-work-tree`. If this isn't a repo, offer to `git init` (ask first).
- **GitHub CLI** — `gh --version`, then `gh auth status`. The `to-prd` / `to-issues` skills default to publishing via `gh`. If `gh` is missing or unauthenticated, tell the user to run `gh auth login` themselves (it's interactive — they should run it, e.g. by typing `! gh auth login`). Note that these skills fall back to writing markdown under `docs/` if `gh` stays unavailable, so this is a recommendation, not a blocker.
- **Platform note (Windows):** on native Windows, prefer a skill's PowerShell variant where one exists (e.g. `guardrails` ships both). Any bash-based script a skill installs needs **WSL or Git Bash**. The `brainstorming` visual companion is static HTML (no Node, no server) — it just needs a browser and an `open`/`start` command.

### 2. Confirm the skills resolved

List the skills the harness has picked up from this collection so the user can see they're available, grouped the way the [collection README](../README.md) groups them. If none resolved, the install didn't register — point them back to the install step and check the plugin is enabled.

### 3. Seed a slim CLAUDE.md pointer (offer, don't force)

If the repo has **no** `CLAUDE.md`, offer to create a slim one. Keep it tiny — only what is both undiscoverable and globally relevant. A good starting point:

```markdown
# <project name>

<one-line description of what this project is>

<non-standard commands the agent couldn't infer — build/test/run>
```

Do **not** run `/init` or generate a fat CLAUDE.md. Standards belong in a
referenced `docs/` file or a skill, not in CLAUDE.md. If a `CLAUDE.md` already
exists, leave it alone — just mention they can keep it slim.

### 4. Orient

Close with a two-line orientation: the core loop the collection is built around —
**`/grill-me` → `/to-prd` → `/to-issues` → build → review** — and that
`/setup` will wire up the project's dev environment and commit gate if that hasn't
been done yet.

## Done when

- [ ] Git + `gh` auth status reported, with clear next actions for anything missing
- [ ] The available Syv skills are listed for the user
- [ ] A slim `CLAUDE.md` exists or the user declined
- [ ] The user knows the core workflow and where to go next (`/setup`, `/grill-me`)

## Related skills

- **setup** — wire up the project's stack, dev env, and commit gate.
- **grill-me** — the first step of the core workflow.
