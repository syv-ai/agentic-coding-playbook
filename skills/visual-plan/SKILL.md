---
name: visual-plan
description: Use when a plan is multi-file, architecture-heavy, data-heavy, UI-heavy, ambiguous, or risky enough that the wrong direction would be expensive to undo. Renders the plan as a single self-contained HTML review surface — diagrams, file maps, annotated code, open questions — opened in the browser, with decisions captured in the terminal.
---

# Visual Plan

Turn a text implementation plan into a **scannable visual review surface** a human can approve at a glance, instead of reading linear prose in the terminal. The output is one self-contained HTML file — no server, no build, no dependencies, no account. Open it in a browser; capture decisions back in the terminal.

This is a **presentation layer for review**, not a planning method. The plan itself still comes from the writing-plans skill (or an existing plan doc). visual-plan renders it for human eyes when the stakes justify the extra effort.

**Announce at start:** "I'm using the visual-plan skill to render this plan for review."

## When to use it

Use it when the cost of going the wrong way is high:

- **Multi-file** changes where the file map and ordering matter.
- **Architecture-heavy** work — the relationships are easier to see than to read.
- **Data-heavy** work — schemas, migrations, contracts.
- **UI-heavy** work — wireframes and layouts the user should react to visually.
- **Ambiguous or risky** work with open decisions that would change the plan.

**Skip it** for routine fixes, single-file edits, or one-line changes. A visual surface for a trivial plan is wasted effort — write the plan in the terminal and move on.

## Relationship to other skills

- **writing-plans** produces the markdown plan (`docs/plans/YYYY-MM-DD-<feature>.md`). visual-plan renders that plan; it does not replace it. The markdown remains the source of truth and the executing-plans input.
- **prototype** builds a throwaway *running* artifact to settle a design question. visual-plan shows a *static* picture of the proposed work. If the user needs to click something to decide, reach for prototype instead.
- **brainstorming**'s visual companion uses the same static-HTML + `AskUserQuestion` pattern for design questions; visual-plan applies it to a finished plan.

## Workflow

You MUST create a task for each step and complete them in order.

1. **Get the plan.** Use the plan the writing-plans skill produced, or read the existing plan doc. If there is no plan yet, stop and write one first — visual-plan renders a plan, it does not invent one.
2. **Decompose into blocks.** Map the plan onto the block taxonomy in [BLOCKS.md](BLOCKS.md). Pick the block that fits each part; do not force everything into prose. Highlight only load-bearing code with `annotated-code` — never dump whole files.
3. **Collect open decisions.** Pull every either/or choice that would change the plan into a single open-questions block at the bottom. Each gets a recommended option. Everything already settled stays as prose or a `decision` callout — not a question.
4. **Render the HTML.** Fill the [template.html](template.html) scaffold. Write it to the OS temp directory (e.g. `$TMPDIR/visual-plan-<slug>.html`), not into the repo. The only external resources are the Tailwind and Mermaid CDNs; the file is otherwise static.
5. **Open it.** Open the file in the user's browser (`open` on macOS, `xdg-open` on Linux, `start` on Windows).
6. **Capture decisions in the terminal.** For each open question, ask via `AskUserQuestion` with the recommended option first, labelled "(Recommended)". The HTML highlighting is cosmetic only — the decision is recorded in the terminal, not the browser.
7. **Fold answers back into the plan.** Update the markdown plan doc with the resolved decisions so executing-plans works from the settled version. The HTML is a disposable review aid; the markdown is what ships.

## Hard rules

- **No shelling out to external services. No npm packages. No accounts, tokens, or hosted plan apps.** The plan never leaves the machine except as the CDN-loaded HTML the user opens locally.
- **The markdown plan is the source of truth.** The HTML is a throwaway review surface; do not treat it as the deliverable and do not commit it.
- **Render, don't pad.** If a section is genuinely just prose, render it as prose. Visual blocks earn their place by making something clearer than text would.

See [BLOCKS.md](BLOCKS.md) for the block taxonomy and the quality bar a strong visual plan must meet.
