# Break down the work

Split a description, plan or conversation into independently grabbable work items using vertical slices (tracer bullets).

## Vertical slices

Each item is a thin slice that cuts through every layer end to end, not a horizontal slice of one layer.

- Each slice delivers a narrow but complete path through every layer it touches (for example schema, API, UI and tests).
- A completed slice can be demonstrated or verified on its own.
- Prefer many thin slices over a few thick ones.

Mark each slice as one of:

- **AFK** — can be implemented and merged without a human decision. Prefer these.
- **HITL** — needs human input, such as an architectural decision or a design review.

## Propose, then iterate

Present the breakdown as a numbered list. For each slice show:

- **Title** — short and descriptive, in the project's vocabulary
- **Type** — AFK or HITL
- **Blocked by** — other slices that must land first
- **Covers** — which user stories or requirements it addresses, if the source has them

Ask whether the granularity is right, whether the dependencies are correct, whether any slices should be merged or split, and whether AFK and HITL are marked correctly. Iterate until the user approves.

## Default item template

Adapt to the tracker's own item type and fields. Use native parent and dependency links where the tracker has them, and fall back to these sections where it doesn't.

```markdown
## Parent
Link to the parent item, if there is one.

## What to build
The end-to-end behaviour of this slice, not a layer-by-layer implementation.

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Verification
How to confirm this slice works end to end: a command, test or user flow and its expected result.

## Blocked by
Links to blocking items, or "None — can start immediately".
```

Avoid file paths and code snippets; they go stale. The prototype exception from DESCRIBE.md applies here too.

## Publishing

- Publish in dependency order so "Blocked by" can reference real identifiers.
- Apply the fields the project uses (area path, iteration, labels, assignee) only when the conventions say so.
- Don't close or modify the parent item.
