---
name: guardrails
description: Lock down a repo and the working session for safe agent work. Installs a deterministic pre-tool hook that blocks destructive commands where the agent harness supports one, and records a conservative posture that asks for explicit approval before touching remote databases, internal systems, production, secrets, or customer data. Use when starting risky work, onboarding an agent to a sensitive codebase, or when the user runs /guardrails.
disable-model-invocation: true
argument-hint: "[optional: the task about to be worked on, to tailor the risk assessment]"
---

# Guardrails

Make this repo and session safe to run an agent in. Two layers, because written rules alone don't hold:

1. **A deterministic hook** blocks dangerous commands before they run. It can't be argued away and it survives context compaction, so it carries the real enforcement — where the harness supports it.
2. **A conservative posture** covers what a pattern can't catch cleanly, such as exposing internal systems or data to the agent. A short contract in the project's instructions file makes the agent stop, name the risk, and get explicit approval.

When unsure whether something is risky, treat it as risky and ask.

If the user passed arguments (`$ARGUMENTS` in Claude Code), treat them as the task about to be worked on and tailor the assessment to it.

## 1. Assess the risk surface

Read the project rather than assuming:

- **Data and systems** — connection strings, `.env*`, `docker-compose.yml`, database config. Remote or production databases, or only local fixtures?
- **Infrastructure** — `terraform/`, Kubernetes or Helm, cloud CLIs, deploy scripts, CI/CD. Can work here change production infrastructure?
- **Internal systems** — internal hostnames, VPN endpoints, private APIs, service credentials.
- **Secrets and PII** — secret stores, customer data, anything that shouldn't reach an external service.
- **Destructive operations** — migrations that drop or truncate, bulk deletes, force operations.

Show the user a short list: what could go wrong here, and which actions reach it.

## 2. Install the hook for this harness

The contract matters, not the language:

- The hook runs before a shell command executes and receives the command.
- It matches the command, case-insensitively, against a deny-list.
- On a match it reports a one-line reason and signals "block"; otherwise it allows the call.

Two reference implementations follow Claude Code's contract (JSON on stdin with `tool_input.command`; exit 2 with the reason on stderr to block): [scripts/block-dangerous-commands.sh](scripts/block-dangerous-commands.sh) for macOS, Linux, WSL or Git Bash (needs `jq`), and [scripts/block-dangerous-commands.ps1](scripts/block-dangerous-commands.ps1) for native Windows. Copy from them; where neither fits, write a small hook in whatever is reliably present.

Steps:

1. **Ask the scope** — this project only, or every project for this user.
2. **Pick the harness mechanism:**
   - **Claude Code:** a `PreToolUse` hook on the `Bash` matcher. Place the script in `.claude/hooks/` (or `~/.claude/hooks/`) and merge the registration into `.claude/settings.json` (or `~/.claude/settings.json`) without overwriting existing settings:
     ```json
     { "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
       { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-commands.sh" }
     ] } ] } }
     ```
     On native Windows use `powershell -NoProfile -ExecutionPolicy Bypass -File "%CLAUDE_PROJECT_DIR%\.claude\hooks\block-dangerous-commands.ps1"` (`pwsh` for PowerShell 7+). Invoking through the interpreter means the executable bit never matters.
   - **Other harnesses:** check the harness's current documentation for a hook that runs before shell commands and can deny them. Several agents have one, but event names, input shape and the deny signal differ. If it exists, adapt the reference script's input parsing and block signal to that contract. If it doesn't, tell the user plainly that nothing is hard-blocked in this harness and that the written contract in step 3 is the only layer.
3. **Tailor the deny-list** to the step 1 assessment. Destructive git patterns are always on; add the project-specific ones (production database access, `terraform apply|destroy`, `kubectl delete`, destructive SQL, printing secrets). Confirm the list with the user.
4. **Verify the block.** Feed the hook a fake call in the harness's input format and confirm it blocks. For the Claude Code reference script:
   - `echo '{"tool_input":{"command":"git push origin main"}}' | bash .claude/hooks/block-dangerous-commands.sh` — expect exit code 2 and a `BLOCKED` message.
   - PowerShell: `'{"tool_input":{"command":"git push origin main"}}' | powershell -NoProfile -File .claude\hooks\block-dangerous-commands.ps1`

   Report what you ran and what it returned. Don't claim a block you haven't seen.

## 3. Record the conservative posture

Append a short contract to the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code) so it's in context for every session and every agent. Safety is a legitimate exception to keeping that file slim: it applies everywhere and can't be discovered from the code. If the user prefers a separate file, put the contract there and add a one-line pointer to the instructions file.

```markdown
## Guardrails

Work conservatively. Destructive commands are blocked by a pre-tool hook where this agent supports one (<hook path, or "no hook in this harness">).

Before any action that could read, modify, expose or connect to:
- a remote or production database, or an internal system or API,
- production infrastructure or a deploy,
- secrets, credentials, or customer/PII data,
- anything that sends project data to an external service,

stop, state the specific risk, and get the user's explicit go-ahead. If unsure whether something qualifies, ask first.
```

Then follow the posture for the rest of this session, not just in the file.

Some harnesses let a pre-tool hook return an "ask" decision instead of blocking. Where that exists, confirm-list items can prompt too; the written contract remains the portable backstop.

## 4. Report

Tell the user briefly: what is hard-blocked (and in which harness), what now needs their approval, where the contract lives, and any platform caveat (Windows, missing `jq`, a harness without hooks).

## Done when

- [ ] The risk surface is assessed and shown to the user
- [ ] A hook is installed, tailored and seen to block — or the user knows this harness has none
- [ ] The contract is in the project's instructions file (or linked from it) and followed now
- [ ] The user knows what's blocked and what needs their go-ahead

## Related skills

- **setup** — wires the project's dev environment and the format/lint/test commit gate; run alongside guardrails.
