---
name: retro
description: Reviews a session that was harder than it should have been and proposes changes to the agent's environment so the next run goes better.
disable-model-invocation: true
argument-hint: "[optional: which session, or what went wrong]"
---

# Retro

Look back at a coding session and propose changes to the agent's environment, not the code, so the next run goes better. The bug the agent shipped, the file it took twenty tool calls to find, the rule a reviewer missed: retro doesn't fix any of these. It asks what in the repo let them happen and proposes the check, pointer or rule that would prevent them. It only proposes. Nothing changes until the user picks a candidate.

If the user passed arguments, treat them as which session to review or what went wrong, and start there.

## 1. Read the session

Default to the current session: the struggles are still in context, which is the best case. If the user points at an earlier one, read its log where the harness keeps one: in Claude Code, `~/.claude/projects/<project>/<session>.jsonl`, where `<project>` is the working directory's path with `/` and other punctuation turned into `-`; in Codex, the transcripts under `CODEX_HOME` (default `~/.codex`). Elsewhere, ask where the harness's session log is. A long log is a good job for a subagent: ask it for the moments where the agent struggled, each with what happened and roughly when.

Also read what the next agent would read: the project's instructions file (AGENTS.md or CLAUDE.md) and any user-level one, wherever the project keeps review standards, the check commands (`package.json` scripts, `Makefile`, the build tool's lint/test tasks) and the CI config.

If the session went smoothly, say so and stop. A smooth session has little to teach, and filling the categories anyway produces generic advice nobody needed.

## 2. Find candidates

Every candidate cites a specific moment in the session: what happened, and roughly when or at which step. Drop any candidate you can't trace to one. The category decides where the fix goes.

| Category | Use when | Where the fix goes |
|---|---|---|
| **Navigation** | The agent took a long time to find a file or fact, or missed a hidden dependency between files. | A short pointer from a file the agent already reads (the instructions file, a README near the code, a comment at the entry point). |
| **Automated checks** | The agent made a mistake a tool could have caught. | A lint rule, type, test, pre-commit hook or CI job. Read the existing check commands and CI first: an existing check that isn't wired in, or is broken, is the finding, not a new one. A repo with no guardrail at all (no hook and no CI job running lint, typecheck or tests) is a finding of its own. |
| **Review standards** | A reviewer, human or agent, missed a mistake. | Classify it first. A mechanical violation (a banned API, an import shape, a file-location rule) gets a deterministic check; default to building the check. A judgement call (consistency across files, fit with surrounding style) becomes a rule where the project keeps review standards, which is read at review time. If it keeps none, propose a file and a pointer to it. |
| **Instructions file bloat** | The instructions file is large, or steered the agent badly. | Move steering that belongs in a check or in review standards out of the file, and delete lines that don't change what the agent does. |
| **Tool economy** | A tool call cost a lot for what it returned, or a CLI or MCP server is token-heavy. | A narrower command, a flag that trims output, a wrapper script, or a different tool. |
| **Information access** | The agent needed information it couldn't reach. | Tee the dev server's log to a file the agent can read, give read-only access to a service, document where the logs are. |

The instructions file loads into every session, so a repeated mistake rarely earns a new line there: each line competes with the rest and goes stale as the code changes. Prefer a check that fails, then a review standard read at review time. The instructions file is mainly for pointers.

## 3. Present and ask

Order candidates by severity: how much each would change future runs, not how loud the moment was. A quiet, expensive mistake can outrank a loud, cheap one. For each, give:

- **What happened**, with the cited moment.
- **Proposed change**, concrete enough to apply.
- **Where it goes**: file, config or tool.
- **Cost**: effort to build, plus what it adds to every future session (context, run time, false positives).

Then ask which to apply. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split a longer list.

## 4. Apply only what was chosen

Apply the chosen candidates and nothing else. A new check is code: run it against the whole repo before letting it block anything, and fix or narrow it if it fails on code that is fine. Report each change with its full path.

## Limits

State these to the user with the list. Retro sees one session, so it can give too much weight to whatever that session was about; treat the order as a first draft. It never prunes old checks: it can't tell that a rule now fires too often or that the bug behind it is gone. A check that keeps failing on good code is the sign to remove it, and that is the user's call.

## Related skills

- **improve-codebase-architecture** and **improve-code-design** look at the code; retro looks at how the session went.
- **setup** builds a project's checks and feedback loops from scratch.
- **guardrails** covers safety controls: what an agent could damage and the harness settings that prevent it.
