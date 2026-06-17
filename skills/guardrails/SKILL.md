---
name: guardrails
description: Lock down a repo and the working session for safe agent work. Installs deterministic PreToolUse hooks that hard-block destructive commands (destructive git, plus project-specific dangers), and establishes a ruthlessly-conservative posture that flags and demands explicit user approval before touching remote databases, internal systems, production, secrets, or customer data. Use when starting risky work, onboarding an agent to a sensitive codebase, or when the user runs /guardrails.
disable-model-invocation: true
argument-hint: "[optional: the task/feature about to be worked on, so the risk assessment can be tailored]"
---

# Guardrails

Make this repo and this session **safe to run an agent in**. Two layers, because
prose alone doesn't hold:

1. **Deterministic hooks (the hard layer).** A `PreToolUse` hook blocks dangerous
   commands before they execute — it can't be rationalized away and it survives
   context compaction. This is the real enforcement.
2. **A ruthlessly-conservative posture (the judgment layer).** For risks a regex
   can't cleanly catch — exposing internal systems or data to a coding agent — a
   short contract makes the agent **stop, name the specific danger, and demand
   explicit user go-ahead** before acting. Recorded so it stays active.

When unsure whether something is risky, it IS risky. Default to asking. "The
agent did it" is never an acceptable outcome.

If the user passed `$ARGUMENTS`, treat it as the task about to be worked on and
tailor the assessment to it.

## Step 1 — Assess the risk surface

Inspect the project and the stated task. Don't assume — read:

- **Data & systems:** connection strings, `.env*`, `docker-compose.yml`, DB
  config — does this touch a **remote/production DB** or only local fixtures?
- **Infrastructure:** `terraform/`, `k8s`/`helm`, cloud CLIs, deploy scripts,
  CI/CD workflows — can work here mutate **production infrastructure**?
- **Internal systems:** internal hostnames/VPN endpoints, private APIs, service
  credentials — would a task **expose internal systems** to the agent or outward?
- **Secrets & PII:** secret stores, customer/PII data, anything that would be bad
  to send to an external service.
- **Destructive surface:** migrations that drop/truncate, bulk deletes, force ops.

Produce a short list: *what could go wrong here, and which actions reach it.*

## Step 2 — Install the deterministic hook (deny-list), JIT for this platform

**Don't assume bash.** What matters is the hook *contract*, not the language — set
the hook up for the platform the user is actually on, so it works natively (no
WSL/`jq` requirement forced onto a Windows box).

**Hook contract.** A `PreToolUse` hook on the `Bash` tool that:
- reads a JSON object on **stdin** containing `tool_input.command` (the command the
  agent wants to run),
- matches that string (case-insensitive) against the deny-list,
- on a match: writes a one-line reason to **stderr** and **exits 2** (this blocks
  the call and feeds the reason back to the agent),
- otherwise **exits 0**.

**Steps:**

1. **Ask scope** — this project (`.claude/settings.json` + `.claude/hooks/`) or all
   projects (`~/.claude/…`)?
2. **Detect the platform and how hooks run here**, then pick the implementation:
   - **macOS / Linux**, or **WSL / Git Bash** on Windows → the **bash** reference,
     [scripts/block-dangerous-commands.sh](scripts/block-dangerous-commands.sh)
     (needs `jq`).
   - **Native Windows** (PowerShell / cmd, no WSL) → the **PowerShell** reference,
     [scripts/block-dangerous-commands.ps1](scripts/block-dangerous-commands.ps1)
     (native JSON, no extra deps).
   - **Anything else / deps missing** → author a small hook to the contract above
     in whatever is reliably present (Python, Node, …). These two files are
     reference implementations to copy from, not artifacts assumed to run anywhere.
3. **Place the chosen hook** under the scoped `hooks/` dir and **tailor the
   deny-list** to the Step 1 assessment — destructive-git patterns are always on;
   add the project-specific ones (prod DB access, `terraform apply/destroy`,
   `kubectl delete`, destructive SQL, secret-printing). Confirm with the user.
4. **Register the `PreToolUse` hook** on the `Bash` matcher, invoked the
   platform-correct way (merge into existing settings — don't overwrite):
   - bash: `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/block-dangerous-commands.sh`
   - PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File "%CLAUDE_PROJECT_DIR%\.claude\hooks\block-dangerous-commands.ps1"` (use `pwsh` for PowerShell 7+)

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             { "type": "command", "command": "<platform-correct invocation from above>" }
           ]
         }
       ]
     }
   }
   ```
   Invoking through the interpreter (`bash`/`powershell`) means the executable bit
   never matters — which is good, because it doesn't survive every install path or
   exist on Windows at all.
5. **Verify it blocks** — pipe a fake tool call into the hook and confirm it exits
   2 and prints `BLOCKED…`:
   - bash: `echo '{"tool_input":{"command":"git push origin main"}}' | bash .claude/hooks/block-dangerous-commands.sh`
   - PowerShell: `'{"tool_input":{"command":"git push origin main"}}' | powershell -NoProfile -File .claude\hooks\block-dangerous-commands.ps1`

   Don't claim it works without seeing the block — run the check and read the exit
   code and message; never claim from memory or "should work".

## Step 3 — Establish the conservative posture (confirm-list)

Write a tight `## Guardrails` contract so the posture stays in context for the
whole session. **Default: append it to `CLAUDE.md`** — safety is the legitimate
exception to a slim CLAUDE.md (it's both globally relevant and undiscoverable).
Keep it minimal; the hooks carry the heavy enforcement. (If the user prefers, put
it in `docs/guardrails.md` and add a one-line CLAUDE.md pointer instead.)

```markdown
## Guardrails (active — installed by /guardrails)

Operate with ruthless conservatism. Destructive commands are hard-blocked by a
PreToolUse hook (`.claude/hooks/block-dangerous-commands.sh`).

BEFORE any action that could read, modify, expose, or connect to:
- a remote or production database, or an internal system/API,
- production infrastructure or a deploy,
- secrets, credentials, or customer/PII data,
- anything that sends project data to an external service,

STOP. State the specific risk of exposing it to a coding agent, and get the
user's explicit go-ahead. When unsure whether something qualifies, treat it as
risky and ask first.
```

Then **adopt the posture now** for the rest of this session, not just for the file.

For harnesses whose `PreToolUse` hooks support a confirmation decision (return a
"ask" permission decision rather than exit 2), the confirm-list items can be
wired as prompts too — but the recorded contract is the portable backstop.

## Step 4 — Report

Tell the user, concisely: what is now **hard-blocked**, what now **requires their
explicit approval**, where the contract lives, and the Windows/WSL caveat if it
applies.

## Done when

- [ ] Risk surface for this project/task is assessed and shown to the user
- [ ] The `PreToolUse` deny-list hook is installed, tailored, and verified to block
- [ ] A `## Guardrails` contract is recorded (CLAUDE.md or docs/) and adopted now
- [ ] The user knows what's blocked vs what needs their go-ahead

## Related skills

- **setup** — wires the project's dev-env and the format/lint/test commit gate (a
  different kind of hook); run alongside guardrails.
