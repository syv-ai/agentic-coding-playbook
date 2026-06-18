# Blocks & Quality Bar

A visual plan is built from blocks. Each part of the plan maps onto the block that makes it clearest — prose where prose is right, a diagram where a picture beats a paragraph. Don't force everything into one shape, and don't add a visual block that carries no more meaning than a sentence would.

## Block taxonomy

| Block | Use it for | Notes |
|---|---|---|
| **prose** | The narrative spine — objective, approach, rationale, risks. | Plain formatted text. The default. Don't dress it up. |
| **annotated-code** | A load-bearing file change, walked through with margin notes anchored to specific lines. | The standout block. Show only the lines that matter; annotate the decisions, not the syntax. |
| **code** | A short throwaway snippet with no callouts. | When you just need to show a shape, not walk through it. |
| **diagram** | Architecture, data flow, dependency, or state relationships. | Mermaid for graph-shaped flows; hand-built divs + inline SVG for editorial visuals. Mix them — see the architecture skill's `HTML-REPORT.md`. |
| **file-map** | Which files are created/modified/tested, and what each is responsible for. | Monospaced. Mark `create` / `modify` / `test`. This is the multi-file plan's anchor. |
| **columns** | Before/after or current/target comparisons read in parallel. | Two labelled columns, side by side. |
| **tabs** | Several files, states, or directions that would clutter if stacked. | Group related code under tabs instead of inline stacking. |
| **table** | Structured data — config matrices, contract fields, decision grids. | Standard table. |
| **callout** | A scannable assumption, risk, or settled decision. | Tone: `note`, `warning`, `risk`, or `decision`. Use `decision` for choices already made — they are not open questions. |
| **checklist** | The closing verification steps — the end-to-end smoke test. | What proves the work is done. Real workflows, on-disk assertions, actual commands. |
| **open-questions** | Resolvable either/or decisions that would change the plan. | **Bottom of the document only.** Each has a recommended option. Resolved in the terminal via `AskUserQuestion`, not in the browser. |

## Quality bar

A strong visual plan answers, in order:

1. **Objective** — what this builds, and what "done" means.
2. **Scope and non-goals** — explicitly what is *not* being done.
3. **Approach** — the key decisions and the rationale behind them.
4. **Ordered steps** — naming real files, symbols, actions, and data shapes. No "make it work."
5. **Risks** — what could go wrong and where.
6. **Verification** — a closing end-to-end check that exercises a real workflow.

### Rules

- **Standalone.** No changelog, no "as discussed earlier," no reference to prior plan versions. The reader has only this document.
- **Lead concrete.** For broad or abstract work, open with a concrete snapshot of the end state before the dense architecture.
- **Annotated code over file dumps.** Highlight only load-bearing changes. Group multiple files in `tabs`, don't stack them inline.
- **Visuals and prose carry distinct weight.** Never restate a diagram in the paragraph beside it. If a diagram needs a paragraph to be understood, redraw the diagram.
- **Settled vs. open.** Decisions already made are prose or a `decision` callout. Only genuine either/or choices go in `open-questions`.
- **Verification is real.** Fresh-repo runs, actual manifests, browser interactions, on-disk assertions — not "tests should pass."

### Forbidden

Marketing language, vague steps ("make it robust"), hero art, gradients, logos, slogans, or landing-page framing. This is a review surface for an engineer, not a pitch. Plain, dense, scannable.
