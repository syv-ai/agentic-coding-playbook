---
name: visual-plan
description: Renders an implementation plan as a single self-contained HTML review page — diagrams, file map, annotated code and open questions — opened in the browser, with decisions captured back in the conversation. Use when a plan is multi-file, architecture-, data- or UI-heavy, or risky enough that going the wrong way would be expensive to undo.
---

# Visual plan

Turn a text plan into a page a person can review at a glance instead of reading linear prose. The output is one self-contained HTML file: no server, no build, no account. It is a presentation layer for review, not a planning method — the plan still comes from the **writing-plans** skill or an existing plan.

## When to use it

Use it when being wrong is expensive: multi-file changes where order matters, architecture or data-model work, UI work the user should react to visually, or plans with open decisions that would change the approach.

Skip it for routine fixes and small changes. If the plan fits in a few lines, write it in the conversation and move on.

## Related skills

- **writing-plans** produces the plan. The plan document remains the source of truth and what **executing-plans** works from.
- **prototype** builds something runnable. If the user needs to click something to decide, use that instead.
- **brainstorming**'s visual companion uses the same static-HTML pattern for design questions.

## Workflow

1. **Get the plan.** Use the plan from **writing-plans**, or read the existing one. Where plans live comes from the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code). If there is no plan yet, write one first — this skill renders a plan, it doesn't invent one.
2. **Map it onto blocks.** Pick the block that makes each part clearest, using [BLOCKS.md](BLOCKS.md). Most of the plan stays prose. Show only load-bearing code, with annotations.
3. **Collect open decisions.** Put every either/or choice that would change the plan into one open-questions block at the bottom, each with a recommended option. Settled decisions stay as prose or a `decision` callout.
4. **Render the page.** Fill [template.html](template.html). Never write it into the repo.
5. **Deliver it.** If your harness can publish artifacts (in Claude Code, the `Artifact` tool, after loading the `artifact-design` skill), publish it and give the user the link: drop the template's skeleton tags and its Mermaid import, since the publisher adds the skeleton and artifacts render Mermaid natively. Otherwise write it to the OS temp directory (e.g. `visual-plan-<slug>.html`), open it in the browser (`open` on macOS, `xdg-open` on Linux, `start ""` on Windows), and give the user the file's full absolute path, resolved rather than `$TMPDIR/…` or `~`.
6. **Capture decisions.** Ask each open question with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot; plain text if it has none), recommended option first. Questions that don't depend on each other can go together. Highlighting in the page is cosmetic.
7. **Fold the answers back** into the plan document so execution works from the settled version.

## Rules

- **No extra services.** No hosted plan apps, accounts, tokens or npm packages. The plan leaves the machine only as the page itself: a local file, or an artifact where the harness publishes one.
- **The plan document is the source of truth.** The HTML is a throwaway review aid; don't commit it.
- **Render, don't pad.** A visual block has to make something clearer than text would.
