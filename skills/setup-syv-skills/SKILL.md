---
name: setup-syv-skills
description: Interviews the team about how agents should work in this repo and records the answers in the project's instructions file.
disable-model-invocation: true
argument-hint: "[optional: anything you already know, e.g. 'ADO, no PRDs, Copilot + Claude Code']"
---

# Setup Syv Skills

Onboard this repo to the collection by finding out how the team wants to work, then writing that down where every agent will read it. Several skills (**track-work**, **brainstorming**, **writing-plans**, **executing-plans**, **tdd**) follow what the project's instructions say about tracking, planning and verification. This skill is how those facts get there.

Run it as an interview in the style of **grill-me**: detect what you can, ask only what is still unclear, and recommend an answer for each question. If the user passed arguments, treat them as answers already given.

## 1. Detect before asking

Look first, so the questions are about choices rather than facts you could have read:

- **Instructions file** — does the repo have AGENTS.md, CLAUDE.md, both, or neither? If CLAUDE.md contains `@AGENTS.md`, AGENTS.md is the source.
- **Existing process docs** — CONTRIBUTING.md, a README "Development" section, PR or issue templates, links to a wiki. Link to these later rather than copying them.
- **Tracker** — issue references in commits and branch names (`#123`, `AB#123`, `PROJ-123`), `.github/ISSUE_TEMPLATE/`, `azure-pipelines.yml`, Jira or Linear links, a folder of markdown specs or issues.
- **Specs and plans** — folders where earlier specs, PRDs, ADRs or plans already live, and whether they are committed.
- **Verification** — the real test, lint, type-check and build commands (package scripts, Makefile, CI workflows).
- **Agents in use** — `.claude/`; `.github/copilot-instructions.md`, `.github/agents/` or `.github/hooks/` (Copilot); `.cursor/`, including `.cursor/agents/`; `.codex/`, including `.codex/agents/`; `.gemini/` or GEMINI.md (Gemini CLI); `.pi/` (Pi); `.agents/skills/`.

## 2. Interview

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split larger batches. Batch questions that don't depend on each other, and put your recommended option first so the user can accept it in a word. Skip a question entirely when detection already settled it. Cover:

1. **Tracker** — where work items live: GitHub Issues, Azure DevOps, Jira, Linear, markdown files in the repo, or nowhere.
2. **What describes a piece of work** — PRD, spec, feature description, epic, user stories, or nothing formal. Whether items are broken down, and into what (issues, tasks, product backlog items).
3. **Specs and plans** — kept or throwaway? If kept, where: in the tracker, a repo folder, or a wiki. Committed or not.
4. **Planning depth** — the default before building. Recommend: plan only when a change spans several files or the approach is unclear; skip it when the change fits in one sentence.
5. **Verification** — which commands prove a change works, and whether UI changes should be checked visually.
6. **Agents** — which harnesses the team uses (Claude Code, Copilot, Codex, Cursor, Gemini CLI, Pi, others). This decides which instructions files matter.

Stop when every point is answered or explicitly left open. Don't ask about things the team doesn't do.

## 3. Check what the chosen tracker needs

Only for the tracker the user picked, and report a short PASS/ACTION line for each:

- **GitHub** — `gh auth status`.
- **Azure DevOps** — `az account show` and `az extension show --name azure-devops`.
- **Jira, Linear, others** — whether a CLI or MCP server is available to the agent. If not, say work items will be drafted as text for the user to paste.

Interactive logins are the user's to run (in Claude Code they can type `! gh auth login`). A missing tool is an action item, not a blocker.

## 4. Record the answers

Write a short section into the project's instructions file:

- AGENTS.md if it exists. If only CLAUDE.md exists and doesn't import AGENTS.md, write the section there and offer to move the content into AGENTS.md (step 5). If neither exists, recommend creating AGENTS.md: most agents, including Claude Code, read it.
- Name the heading after its content, not after this collection, since any agent or plugin can use these facts. Keep it to a handful of lines an agent could not work out on its own. Link to existing process docs instead of restating them.
- Show the section to the user before writing it. If a section like it already exists, update it rather than adding a second one.

For example:

```markdown
## Work tracking and planning
- Work items live in Azure DevOps (`az boards`). Features carry the description; no PRDs.
- Specs and plans are not committed. Keep them in the session unless asked.
- Plan only when a change spans several files or the approach is unclear.
- Verify with `npm test` and `npm run lint`. Check UI changes with a screenshot.
```

Personal preferences that the team doesn't share belong in the harness's local file, and only if the user asks. In Claude Code that is `CLAUDE.local.md`; note that its presence stops Claude Code from reading AGENTS.md directly, so it should start with `@AGENTS.md`.

Updating the collection never touches this section. It belongs to the project.

## 5. Make sure each agent reads it

Copilot, Codex, Cursor and Pi read AGENTS.md directly. For the others in use:

- **Claude Code** (v2.1.277 and later) reads AGENTS.md when there is no CLAUDE.md or CLAUDE.local.md in the working directory or above it. Don't create a CLAUDE.md only for Claude. If one exists, make sure it imports `@AGENTS.md`, since Claude otherwise reads CLAUDE.md instead. Prefer the import to a symlink, which breaks on Windows without Developer Mode.
- **Gemini CLI** reads GEMINI.md by default. Offer either `"context": { "fileName": ["AGENTS.md", "GEMINI.md"] }` in `.gemini/settings.json`, or a GEMINI.md containing `@AGENTS.md`.
- Don't generate a long instructions file, and don't run an init command that writes one.

## 6. Orient

Close with a few lines: which skills now follow the recorded section, that **setup** wires the dev environment and commit gate if that hasn't been done, and that **grill-me** or **brainstorming** is a good place to start the next piece of work.

Also recommend that each developer runs **guardrails** (it is manual-only, so they start it themselves). It reviews what an agent could damage in this repo, notes the safety controls already in place, and asks whether to add controls for anything uncovered.

## Done when

- [ ] Detection ran, and the user was asked only what it couldn't answer
- [ ] The tracker's tooling was checked, with clear next actions for anything missing
- [ ] A short, content-named section is in the instructions file, or the user declined
- [ ] Every agent the team uses reads the section, or the user declined
