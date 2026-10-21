---
name: track-work
description: Records what is being built and breaks it into independently grabbable work items in the project's tracker.
disable-model-invocation: true
argument-hint: "[optional: 'describe', 'breakdown', or an existing item/plan to work from]"
---

# Track Work

Turn what has been decided into the project's own tracking artefacts. Two jobs, done separately or together:

- **Describe** — record what is being built and why, in the form the project uses. See [DESCRIBE.md](DESCRIBE.md).
- **Break down** — split it into thin, independently grabbable work items. See [BREAKDOWN.md](BREAKDOWN.md).

If the user passed arguments, use them to pick the job and the source material. Otherwise infer the job from the conversation, and ask if it is unclear.

## 1. Find the project's conventions

Don't assume GitHub, PRDs or a `docs/` folder. Establish the conventions in this order and stop as soon as they are clear:

1. **The project's instructions file** (AGENTS.md or CLAUDE.md). A section on work tracking settles it. If **setup-syv-skills** has been run, it is there.
2. **Best-effort inference** from the repo and tracker:
   - Issue references in commits and branch names: `#123` (GitHub), `AB#123` (Azure DevOps), `PROJ-123` (Jira or Linear).
   - Tracker config: `.github/ISSUE_TEMPLATE/`, `azure-pipelines.yml`, links in the README or CONTRIBUTING.md.
   - Existing artefacts: folders of specs, PRDs, ADRs or markdown issues, and their structure.
   - Available tools: `gh`, `az boards`, a Jira or Linear CLI or MCP server.
3. **Ask** only what is still unclear. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split larger batches. Put your best guess first:
   - Where do work items live?
   - What describes a piece of work here (PRD, spec, feature description, epic, user stories, nothing formal)?
   - What are items broken into, and which fields or item types matter (area path, labels, parent links, story points)?
   - Should the description be kept at all, and where?
4. **Offer to record** anything you had to ask as a short section in the instructions file, so the next run doesn't ask again. Show the lines before writing them.

If the project tracks nothing, say so and offer to keep the result in the conversation or write it to a file the user names.

## 2. Gather the source material

Work from what is already known: the conversation, a plan or spec, or an existing item the user points to (fetch it with the tracker's tool and read its body and comments). If you haven't explored the relevant code, do it now so the write-up matches reality. Delegate to an exploration subagent if your harness has one; otherwise keep the exploration narrow. Respect recorded decisions (ADRs), and use the project's domain glossary if it has one.

Don't interview the user about the feature itself; that is what **grill-me** and **brainstorming** are for. Ask only where the material has a gap that would change the write-up.

## 3. Describe

Follow [DESCRIBE.md](DESCRIBE.md). Draft in the project's format, show it to the user, then publish it to the agreed place.

## 4. Break down

Follow [BREAKDOWN.md](BREAKDOWN.md) for slicing, sizing, the review with the user and publishing order. Publish nothing until the user approves the breakdown.

## Rules for writing to a tracker

- Show what you will create before creating it. Creating items is visible to the whole team.
- Use the tracker's own tool (`gh issue create`, `az boards work-item create`, a Jira or Linear CLI or MCP server). If none is available, produce the text for the user to paste and say so.
- Use the tracker's native fields, item types and links (parent, blocked-by, related) rather than imitating them in the body.
- Don't close, edit or re-parent existing items without asking.
- When done, list what was created with identifiers or links.

## Scale to the task

A change that fits in one sentence doesn't need a description and a breakdown. Offer a single item, or none, and move on.
