---
name: brainstorming
description: Turns an idea into an agreed design through collaborative dialogue — purpose, constraints, approaches and trade-offs — before any code is written. Use when a feature, component or behaviour change is underspecified, when several approaches are plausible, or when the user wants to think a design through before building.
---

# Brainstorming

Turn an idea into a design the user has agreed to, then hand over to planning. The point is to catch wrong assumptions while they are cheap to change.

## Scale to the task

Match the ceremony to the change. If the change can be described in one sentence and there is one obvious way to do it, confirm your understanding in a line or two and move on — no approaches, no design doc. Spend the full process on work that spans several parts of the system, has real alternatives, or where you are unsure what the user wants.

Until the user has agreed to the design, don't write code or scaffold anything. Building on an unagreed design is the expensive mistake this skill exists to prevent.

## Process

1. **Explore the context.** Look at the relevant files, docs and recent commits. Delegate to an exploration subagent if your harness has one; otherwise keep the exploration narrow and targeted.
2. **Check the scope.** If the request is really several independent subsystems ("a platform with chat, billing and analytics"), say so first and help split it into sub-projects. Brainstorm the first one; each gets its own design → plan → build cycle.
3. **Offer the visual companion** if upcoming questions will be visual (see below). Make the offer on its own, not bundled with a question.
4. **Ask clarifying questions.** Focus on purpose, constraints and success criteria.
5. **Propose 2–3 approaches** with trade-offs, leading with your recommendation and why.
6. **Present the design** in sections scaled to their complexity — a few sentences where it's straightforward, a few hundred words where it's nuanced. Check each section with the user before moving on. Cover what applies: architecture, components, data flow, error handling, testing.
7. **Record the spec**, if the work warrants one (see below).
8. **Choose the next step** with the user.

## Asking questions

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Prefer multiple choice with your recommended option first. Questions that don't depend on each other can go together; ask dependent questions in sequence, since each answer changes the next question. If the codebase can answer a question, look instead of asking.

## Designing

- **Isolation and clarity.** Break the system into units that each have one purpose, a clear interface, and can be understood and tested on their own. For each unit you should be able to say what it does, how it is used and what it depends on.
- **Focused files.** Smaller, well-bounded files are easier to reason about and edit reliably; a file that keeps growing is usually doing too much.
- **Existing codebases.** Follow the established patterns. Include targeted improvements where existing problems get in the way of the work, but don't propose unrelated refactoring.
- **YAGNI.** Remove features nobody asked for.

If a design question can only be settled by running something — does this state model hold up, which of these layouts feels right — use the **prototype** skill to answer it, then return here with the result.

## The spec

Where the spec goes, and whether it is kept at all, comes from the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code). If it says nothing, look for an existing convention in the repo (a specs folder, design docs attached to issues). If that is still unclear, ask — and offer to record the answer as a short section in the instructions file so the next session doesn't have to ask. A spec can live only in the conversation when nothing needs to persist; only commit it if the project commits specs.

A useful spec is self-contained: it names the modules and interfaces involved, states what is out of scope, and ends with how to verify the feature end to end.

After writing it, reread it once for placeholders ("TBD"), contradictions, requirements that could be read two ways, and scope that should be split. Fix what you find inline. For a larger spec, you can also hand it to a fresh-context reviewer using [spec-document-reviewer-prompt.md](spec-document-reviewer-prompt.md) — a reviewer that didn't write the spec catches what you read past.

Then ask the user to review the spec before planning starts.

## Next step

Once the design is agreed, ask the user how to continue:

- **Continue in this session** (default) with the **writing-plans** skill.
- **Start fresh** — use the **handoff** skill so a new session picks up with clean context.

For small, agreed changes, going straight to implementation is fine if the user prefers.

## Visual companion

For questions the user would understand better by seeing than by reading — mockups, layouts, diagrams, side-by-side designs — you can show static HTML pages (published as artifacts where your harness can, otherwise local files in their browser) and capture the answer with the question tool. Offer it once, when you expect visual questions, and mention that it uses more tokens. If they accept, decide per question: conceptual choices, requirements and trade-offs stay in text. See [visual-companion.md](visual-companion.md) for the loop and the template's classes.
