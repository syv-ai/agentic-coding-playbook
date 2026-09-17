---
name: setup-syv-skills
description: Interviews the user about how their team wants agents to work in this repo — tracker, specs and plans, planning depth, verification, which agents they use — and records the answers as a short section in the project's instructions file. Use when the collection has just been installed, when onboarding a repo to it, or when the user runs /setup-syv-skills.
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
- **Agents in use** — `.claude/`, `.github/copilot-instructions.md` or `.github/agents/`, `.cursor/`, `.codex/`, `.agents/skills/`.

## 2. Interview

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Batch questions that don't depend on each other, put your recommended option first, and skip anything detection already answered. Cover:

1. **Tracker** — where work items live: GitHub Issues, Azure DevOps, Jira, Linear, markdown files in the repo, or nowhere.
2. **What describes a piece of work** — PRD, spec, feature description, epic, user stories, or nothing formal. Whether items are broken down, and into what (issues, tasks, product backlog items).
3. **Specs and plans** — kept or throwaway? If kept, where: in the tracker, a repo folder, or a wiki. Committed or not.
4. **Planning depth** — the default before building. Recommend: plan only when a change spans several files or the approach is unclear; skip it when the change fits in one sentence.
5. **Verification** — which commands prove a change works, and whether UI changes should be checked visually.
6. **Agents** — which harnesses the team uses (Claude Code, Copilot, Codex, Cursor, others). This decides which instructions file and shims matter.

Stop when every point is answered or explicitly left open. Don't ask about things the team doesn't do.

## 3. Check what the chosen tracker needs

Only for the tracker the user picked, and report a short PASS/ACTION line for each:

- **GitHub** — `gh auth status`.
- **Azure DevOps** — `az account show` and `az extension show --name azure-devops`.
- **Jira, Linear, others** — whether a CLI or MCP server is available to the agent. If not, say work items will be drafted as text for the user to paste.

Interactive logins are the user's to run (in Claude Code they can type `! gh auth login`). A missing tool is an action item, not a blocker.

## 4. Record the answers

Write a short section into the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code):

- AGENTS.md if it exists; otherwise CLAUDE.md; if neither exists, ask which to create. AGENTS.md is read by most agents.
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

Personal preferences that the team doesn't share belong in the harness's local file (for example `CLAUDE.local.md` or `AGENTS.override.md`), and only if the user asks.

Updating the collection never touches this section. It belongs to the project.

## 5. Shims for the agents in use

- **Claude Code** reads CLAUDE.md, not AGENTS.md. If the team uses Claude Code and only AGENTS.md exists, offer a CLAUDE.md containing `@AGENTS.md`. Prefer the import to a symlink, which breaks on Windows without Developer Mode.
- Don't generate a long instructions file, and don't run an init command that writes one.

## 6. Orient

Close with two or three lines: which skills now follow the recorded section, that **setup** wires the dev environment and commit gate if that hasn't been done, and that **grill-me** or **brainstorming** is a good place to start the next piece of work.

## Done when

- [ ] Detection ran, and the user was asked only what it couldn't answer
- [ ] The tracker's tooling was checked, with clear next actions for anything missing
- [ ] A short, content-named section is in the instructions file, or the user declined
- [ ] Shims are in place for the agents the team uses, or the user declined
