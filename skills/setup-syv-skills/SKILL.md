---
name: setup-syv-skills
description: Interviews the team about how agents should work in this repo, records the answers in the project's instructions file, and offers to add a commit gate.
disable-model-invocation: true
argument-hint: "[optional: anything you already know, e.g. 'ADO, no PRDs, Copilot + Claude Code']"
---

# Setup Syv Skills

Record the decisions an agent can't read from the code (where work is tracked, what's kept, how much to plan, how a change is verified) in the file every agent reads. **track-work**, **brainstorming**, **writing-plans**, **executing-plans** and **tdd** follow that section. Without it they ask as they go, one question at a time; this skill asks up front.

Run it as an interview in the style of **grill-me**: look first, ask only what is still open, and recommend an answer for each question. If the user passed arguments, treat them as answers already given.

## 1. Look before asking

Read the instructions files (AGENTS.md, CLAUDE.md, GEMINI.md), any process docs (CONTRIBUTING.md, PR and issue templates), the tracker signs in commits and branch names, the agent config folders in the repo, and the check commands in package scripts, Makefiles and CI. Note whether a commit gate already runs them. Link to existing docs later rather than copying them.

## 2. Interview

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split larger batches. Put your recommended option first so the user can accept it in a word, and skip anything step 1 settled. Cover:

1. **Tracker**: GitHub Issues, Azure DevOps, Jira, Linear, markdown files in the repo, or none. If the agent lacks the CLI or MCP server it needs, that's an action item for the user; logins are theirs to run.
2. **What describes a piece of work**: PRD, spec, feature description, epic, user stories, or nothing formal; whether it's broken into items, and what kind.
3. **Specs and plans**: kept or throwaway; if kept, where, and whether they're committed.
4. **Planning depth**: recommend planning only when a change spans several files or the approach is unclear.
5. **Verification**: which commands prove a change works, whether UI changes get checked visually, and, if there's no commit gate, whether to add one (step 3).
6. **Agents**: which harnesses the team uses (Claude Code, Copilot, Codex, Cursor, Gemini CLI, Pi, others). This decides step 5.

Stop when every point is answered or explicitly left open.

## 3. Add a commit gate, if wanted

A gate runs the fast, deterministic checks on every commit and blocks on failure, so an agent reads the error and fixes it without you reviewing each attempt.

- Use the project's native mechanism (the `pre-commit` framework, Husky with lint-staged, a plain git hook) and its existing tools. Propose a formatter, linter or test runner only where one is missing, in the ecosystem's standard form.
- Order the checks cheapest first: format, then lint or type-check, then the fast test subset. Leave slow and end-to-end tests to CI, and mirror the gate in CI if the project has one.
- Prove it works: make a commit that breaks a rule and watch it get blocked, then a clean one that passes. Report the output you saw.

## 4. Record the answers

Write a short section into the instructions file. Use AGENTS.md if it exists; if only CLAUDE.md exists and doesn't import AGENTS.md, write there and offer to move the content (step 5); if neither exists, recommend creating AGENTS.md, which most agents read.

Name the heading after its content, not after this collection. Keep to what an agent couldn't work out itself, link rather than restate, and show the section before writing it. If a similar section exists, update it instead of adding a second one.

```markdown
## Work tracking and planning
- Work items live in Azure DevOps (`az boards`). Features carry the description; no PRDs.
- Specs and plans are not committed. Keep them in the session unless asked.
- Plan only when a change spans several files or the approach is unclear.
- Verify with `npm test` and `npm run lint`; the pre-commit hook runs both. Check UI changes with a screenshot.
```

Personal preferences belong in the harness's local file, and only if the user asks. In Claude Code that's `CLAUDE.local.md`, whose presence stops Claude Code reading AGENTS.md directly, so it should start with `@AGENTS.md`. Updating the collection never touches this section; it belongs to the project.

## 5. Make sure each agent reads it

Copilot, Codex, Cursor and Pi read AGENTS.md directly. For the others in use:

- **Claude Code** (v2.1.277 and later) reads AGENTS.md when there is no CLAUDE.md or CLAUDE.local.md in the working directory or above. Don't create a CLAUDE.md only for Claude. If one exists, make sure it imports `@AGENTS.md`; prefer the import to a symlink, which breaks on Windows without Developer Mode.
- **Gemini CLI** reads GEMINI.md by default. Offer `"context": { "fileName": ["AGENTS.md", "GEMINI.md"] }` in `.gemini/settings.json`, or a GEMINI.md containing `@AGENTS.md`.

Don't generate a long instructions file, and don't run an init command that writes one.

## 6. Orient

Close with a few lines: which skills now follow the section, and that **grill-me** or **brainstorming** is a good place to start the next piece of work. Recommend that each developer runs **guardrails** (it's manual-only, so they start it themselves) to review what an agent could damage here and which controls already cover it.

## Done when

- [ ] The user was asked only what step 1 couldn't answer
- [ ] A short, content-named section is in the instructions file, or the user declined
- [ ] A commit gate runs the checks and was seen to block a failing commit, or the user declined
- [ ] Every agent the team uses reads the section, or the user declined
