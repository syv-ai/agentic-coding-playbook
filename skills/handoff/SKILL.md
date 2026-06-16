---
name: handoff
description: Compacts the current conversation into a handoff document so another agent can pick up the work. Use when you want to hand off to a fresh session.
argument-hint: "What will the next session be used for?"
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS — not the current workspace.

Include a "suggested skills" section in the document, which suggests skills from this collection that the next agent should invoke. For example:

- **brainstorming** to explore an underspecified idea before building.
- **to-prd** / **to-issues** / **writing-plans** to shape requirements and a plan.
- **executing-plans** to carry out an existing plan.
- **tdd** when implementing a feature or bugfix.
- **systematic-debugging** for a bug or unexpected behaviour.
- **zoom-out** to orient in an unfamiliar area of code.
- **receiving-code-review** when acting on review feedback.

Pick only the ones that fit where the work actually stands.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
