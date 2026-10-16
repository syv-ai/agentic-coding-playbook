# Break down the work

Split a description, plan or conversation into independently grabbable work items using vertical slices (tracer bullets).

## Vertical slices

Each item is a thin slice that cuts through every layer end to end, not a horizontal slice of one layer.

- Each slice delivers a narrow but complete path through every layer it touches (for example schema, API, UI and tests).
- A completed slice can be demonstrated or verified on its own.
- Each slice is sized to fit in one fresh context window, so an agent can pick it up cold and finish it.
- Prefer many thin slices over a few thick ones.
- Any prefactoring comes first. If reshaping existing code would make the later slices simpler, make that its own item at the front: make the change easy, then make the easy change.

Mark each slice as one of:

- **AFK** — can be implemented and merged without a human decision. Prefer these.
- **HITL** — needs human input, such as an architectural decision or a design review.

## Wide refactors

A wide refactor is the exception to vertical slicing. It is one mechanical change (renaming a column, retyping a shared symbol) that touches call sites across the whole codebase, so no single slice can land with everything still passing. Sequence it as expand, migrate, contract:

1. **Expand** — add the new form beside the old one, so nothing breaks.
2. **Migrate** — move call sites to the new form in batches sized by how much each batch could break (per package, per directory). Each batch is its own item, blocked by the expand. The build stays green from batch to batch because the old form still exists.
3. **Contract** — delete the old form once no caller uses it, in an item blocked by every migrate batch.

If even the batches can't stay green on their own, keep the sequence but have them share an integration branch, with a final integrate-and-verify item blocked by all of them. Only that last item has to pass.

## Propose, then iterate

Present the breakdown as a numbered list. For each slice show:

- **Title** — short and descriptive, in the project's vocabulary
- **Type** — AFK or HITL
- **Blocked by** — other slices that must land first
- **Covers** — which user stories or requirements it addresses, if the source has them

Ask whether the granularity is right, whether each slice depends only on slices that genuinely gate it, whether any slices should be merged or split, and whether AFK and HITL are marked correctly. Iterate until the user approves.

Unneeded dependencies serialise work that could run in parallel. Whoever picks up items works the frontier: any item whose blockers are all done. For a purely linear chain that means top to bottom.

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

## Out of scope
What this slice deliberately leaves to other items.

## Verification
How to confirm this slice works end to end: a command, test or user flow and its expected result.

## Blocked by
Links to blocking items, or "None — can start immediately".
```

Describe the behaviour the slice should produce, not the steps to produce it. Make each acceptance criterion something that can be checked on its own. Prefer durable references over precise ones: name modules and interfaces rather than file paths, line numbers or code snippets, which go stale. The prototype exception from DESCRIBE.md applies here too.

## Publishing

- Publish in dependency order so "Blocked by" can reference real identifiers.
- If the work came from an existing item, attach the new items to it as children or sub-issues where the tracker supports that. On GitHub: `gh issue create --parent <n>` when creating, or `gh issue edit <n> --add-sub-issue <child>` afterwards. Where the tracker has no such link, put "Part of #<n>" (or the tracker's equivalent) at the top of each body.
- Omit the Parent and Blocked by sections when you set those as native links.
- Apply the fields the project uses (area path, iteration, labels, assignee) only when the conventions say so.
- Don't close or modify the parent item, beyond attaching children to it.

### Markdown files

If the project tracks work in markdown files and has no convention for them, write one file per item, named `NN-slug.md` and numbered from `01` in dependency order, so blockers come first. Never put all items in one combined file: separate files can be claimed, linked and closed one at a time. Where the files go comes from the project; ask if it isn't clear. Each file lists its blockers by number in a "Blocked by" line.
