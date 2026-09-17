---
name: handoff
description: Compacts the current conversation into a handoff document so another agent can pick up the work. Use when you want to hand off to a fresh session, or when continuing in a clean context would work better than carrying this one forward.
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. This is how to continue in a fresh session when the user chooses one, for example between planning and implementation, or after several failed attempts have cluttered the context.

Save it to the OS temp directory unless the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code) says where such documents go. Give the user the file's full absolute path, resolved (for example with `realpath`) rather than `$TMPDIR/…`, `~` or a relative path, so they can open it and pass it to the next session.

Before writing, ask the user the questions whose answers would make the next session clearer: decisions still open, priorities between remaining tasks, what is out of scope, constraints or context that never made it into the conversation. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Batch questions that don't depend on each other. Ask only what the conversation and repo cannot answer, and skip this step when nothing is unclear. Fold the answers into the document.

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

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
