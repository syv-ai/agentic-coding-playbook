---
name: handoff
description: Compacts the current conversation into a handoff document so another agent can pick up the work. Use when you want to hand off to a fresh session, or when continuing in a clean context would work better than carrying this one forward.
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

Every handoff loses something: the next agent gets your summary, not the reasoning behind it. When the next phase needs that reasoning verbatim, continuing in the same session is usually better. Hand off when the work moves to another harness, machine or person, when this context has degraded (several failed attempts, a lot of noise), or to fork off a side task.

Some harnesses can fork the conversation itself, which keeps the full history instead of a summary: in Claude Code, `/fork` (or `/subtask` for a side task, in recent versions); in Codex, `codex fork`; in Pi, `/fork` or `/clone`. Use those when the next session runs in the same harness and needs everything said so far.

Save the document to the OS temp directory (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows), unless the project's instructions file (AGENTS.md or CLAUDE.md) says where such documents go. Give the user the file's full absolute path, resolved (for example with `realpath`) rather than `$TMPDIR/…`, `~` or a relative path, so they can open it and pass it to the next session. If the next session won't run on this machine (a cloud session, a teammate's laptop), put the document where it can reach it instead: on the working branch, or pasted into the task itself.

Before writing, ask the user the questions whose answers would make the next session clearer: decisions still open, priorities between remaining tasks, what is out of scope, constraints or context that never made it into the conversation. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Batch questions that don't depend on each other; most tools take three or four per call, so split larger batches. Ask only what the conversation and repo cannot answer, and skip this step when nothing is unclear. Fold the answers into the document.

Include a "suggested skills" section in the document, which suggests skills from this collection that the next agent should invoke. For example:

- **brainstorming** to explore an underspecified idea before building.
- **track-work** / **writing-plans** to record requirements and shape a plan.
- **executing-plans** to carry out an existing plan.
- **tdd** when implementing a feature or bugfix.
- **systematic-debugging** for a bug or unexpected behaviour.
- **zoom-out** to orient in an unfamiliar area of code.
- **receiving-code-review** when acting on review feedback.

Pick only the ones that fit where the work actually stands.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, work items, commits, diffs). Reference them by path or URL instead.

If this session was harder than it should have been, suggest that the user run the **retro** skill (`/retro` in Claude Code) before handing off, so the environment improves for the next session. Suggest it; don't run it.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
