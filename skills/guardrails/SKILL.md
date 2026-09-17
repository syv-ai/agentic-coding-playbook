---
name: guardrails
description: Reviews what a coding agent could damage in this repo (production data, infrastructure, secrets, destructive operations), notes the safety controls already in place, and asks the developer whether to cover each remaining risk with their agent's own controls. Use when onboarding an agent to a codebase, before risky work, or when the user runs /guardrails.
disable-model-invocation: true
argument-hint: "[optional: the task about to be worked on, to focus the review]"
---

# Guardrails

Find what an agent could damage here, check what already protects it, and let the developer decide what to do about the rest. This skill reports and asks. It doesn't decide that a risk must be fixed, and it doesn't push a particular setup.

If the user passed arguments, treat them as the task about to be worked on and focus the review on what that task could reach.

## 1. Establish the harnesses and scope

Find out which agents run in this repo: the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code) may say, and config folders such as `.claude/`, `.dash`, `.codex/`, `.cursor/` and `.vscode/` hint at it. Include the harness you are running in. Ask only if it is still unclear.

## 2. Inventory the existing guardrails

Before looking for risks, read what is already configured for each harness, at every level that applies: organisation-managed, user, project and local. [CONTROLS.md](CONTROLS.md) lists where each harness keeps its settings and what each control does. Also note protections outside the agent: a dev container or VM, credentials that only exist in CI, read-only database users, branch protection.

## 3. Assess the risk surface

Read the project rather than assuming. Delegate the sweep to an exploration subagent if your harness has one; otherwise keep it targeted. Look for:

- **Data** — connection strings and database config (`.env*`, `docker-compose.yml`, app config). Do they point at remote or production systems, or only local fixtures?
- **Infrastructure** — Terraform, Kubernetes or Helm, cloud CLIs, deploy scripts, CI/CD that can change production.
- **Internal systems** — internal hostnames, private APIs, service credentials, MCP servers with write access.
- **Secrets and personal data** — secret files, credential stores, customer data that shouldn't reach a model or an external service.
- **Destructive operations** — migrations that drop or truncate, bulk deletes, force pushes, cleanup scripts.

Each finding needs evidence (a file and line, a command, a config key). Don't list hypothetical risks the repo shows no sign of.

## 4. Present the findings

Show one table, and judge coverage against step 2:

| Finding | Evidence | What could reach it | Coverage |
|---|---|---|---|
| `DATABASE_URL` in `.env.production` points at the production cluster | `.env.production:3` | shell commands, file reads | Covered: `Read(./.env.production)` deny in `.claude/settings.json` |

- **Covered** — an existing control already handles it, in every harness the team uses. Say which control, and don't ask about it.
- **Partial** — covered in some harnesses or for some routes but not others (for example, a command deny rule while file reads stay open).
- **Not covered** — nothing handles it.

If everything is covered, say so, summarise the controls in place, and stop. Asking questions about a setup that already works wastes the developer's time.

## 5. Ask about each open finding

For each partial or uncovered finding, ask whether and how to address it. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Batch findings that don't depend on each other.

Stay neutral: don't label an option as recommended. Offer only options the team's harnesses actually support, and state each one's trade-off in a clause:

- **Block** — deny the action outright. It also blocks legitimate uses; blocking `git push` stops an agent from opening a pull request.
- **Require approval** — the agent must ask each time. Safe, but adds prompts.
- **Isolate** — sandbox the shell's filesystem or network access, or deny reads of specific files. It holds even when commands are phrased differently, but may need a setup step and can break tools that need the access.
- **Record a fact** — add a line to the instructions file ("the database in `.env.production` is production; don't connect to it"). The agent reads it, but nothing enforces it.
- **Leave as is** — accept the risk.

Also ask the scope for anything that will be configured: shared with the team (committed project settings), personal (user or local settings), or organisation-wide (managed settings, which the developer may need an admin for).

## 6. Apply the decisions

Configure each chosen remedy with the harness's own controls, as described in [CONTROLS.md](CONTROLS.md). Merge into existing settings files instead of overwriting them, and show the change before writing it.

Use only what the harness provides: its permission rules, sandbox, approval modes and managed settings. Don't write custom hook scripts or wrappers; they break silently when the harness, the platform or a dependency changes. If no native control can express a decision, say so, and offer to record a fact in the instructions file instead or leave it as is.

## 7. Verify

Confirm every new control is active. Don't claim protection you haven't seen work:

- Check the harness's own view of its settings (for example `/permissions` or `/sandbox` in Claude Code).
- Where it's safe, trigger the rule with a harmless action it matches, such as `git push --help` for a push rule. Never test a rule by doing the dangerous thing or reading the real secret.

Report what you ran and what came back.

## 8. Report

End with the table from step 4, updated with the decision for each finding, the control now in place and whether it was verified. Then say plainly what remains unenforced: harnesses in the team that have no equivalent control, routes a rule doesn't cover (text-matched command rules can be reworded; shell sandboxes don't cover other tools) and anything the developer chose to leave.

## Related skills

- **setup** and **setup-syv-skills** recommend running this skill once the repo is ready for agents.
