---
name: writing-plans
description: Writes an implementation plan from a spec or agreed requirements — files to touch, ordered tasks, and how to verify each step. Use when a change spans several files or steps, when the approach needs to be pinned down before coding, or when another session or agent will do the implementation.
---

# Writing plans

Write a plan that someone with no context on this codebase could follow: which files to touch, in what order, what behaviour each task produces, and how to check it. Assume a skilled engineer who doesn't know the toolset, the domain or the project's test habits.

## Scale to the task

If the change can be described in one sentence, skip the written plan and just do it (or say the steps in a line or two). Write a full plan when the change spans several files, the order of work matters, the approach needs agreement, or another session will execute it. Match the detail to the risk: a three-task change needs a short list, not a document.

## Where the plan goes

Where plans are saved, and whether they are kept at all, comes from the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code). If it says nothing, look for an existing convention (a plans folder, plans attached to work items). If still unclear, ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot; plain text if it has none) and offer to record the answer as a short section in the instructions file. A plan can live only in the conversation when it won't be executed elsewhere.

## Scope check

If the spec covers several independent subsystems, suggest one plan per subsystem. Each plan should produce working, testable software on its own.

## Structure

**Map the files first.** Before the tasks, list the files to create or modify and what each is responsible for. This is where decomposition gets decided:

- One clear responsibility per file; files that change together live together.
- Split by responsibility, not by technical layer.
- In an existing codebase, follow its patterns. Only include a split if a file you are changing has become unwieldy.

**Then name one owner per rule.** A file map splits work by file, so a rule that several files need can end up written into each of them. List every rule the plan introduces or relies on that more than one file needs: a format (what counts as a link, an id, a valid name), a lookup (where a folder or record is found), an invariant (what must hold after every write), an ordering or a constant. Name the one function or module that owns each; every other file calls it. A rule both sides of a boundary need (client and server, two processes, two services) lives in code both sides import.

Two tasks that each write their own version of a rule mean two owners, and they will drift: an index parser in one process and a link renderer in another, each with its own regex for "a link to a note", disagree on the first odd link. Plan text like "keep in step with", "mirrors" or "same as in Task N" marks the same problem. So does "every caller must call X, and a test catches the ones that forget": find the one point every caller passes through and enforce the rule there.

**Say what the plan deletes.** When a task adds a new way to do something the codebase already does, list the old paths it replaces and delete them in a task. Any that stay are named, with the reason and a follow-up.

**Start with a short header:**

```markdown
# <Feature> implementation plan

**Goal:** <one sentence: what this builds>
**Approach:** <2–3 sentences>
**Stack:** <key technologies>
```

**Then the tasks.** Each task is a self-contained change that makes sense on its own:

````markdown
### Task N: <name>

**Files:** create `path/new.py` · modify `path/existing.py:120-145` · test `tests/path/test_x.py`

**Behaviour:** <what this task makes true, stated so it can be checked>

- [ ] Write a failing test for <behaviour>
- [ ] Implement until it passes
- [ ] Verify: `pytest tests/path/test_x.py -v` → passes

```python
# Only where code pins a decision: an interface, a tricky algorithm,
# or a test that defines the behaviour precisely.
def test_rejects_expired_token(): ...
```
````

Use checkboxes (`- [ ]`) so progress can be tracked. Add a commit step per task only if the project commits per task.

**End with end-to-end verification:** the commands or actions that prove the whole feature works as a user would use it, with the expected result.

## Be specific

Every task needs what the implementer needs to act without guessing:

- Exact file paths, and line ranges for modifications.
- The behaviour to produce, stated so it can be verified.
- A verification command with its expected result.
- Code where prose would be ambiguous. Elsewhere, behaviour and names are enough; don't write out code the implementer will obviously write the same way.

These are gaps, not plans: "TBD", "add error handling", "handle edge cases", "write tests for the above" without saying which, "similar to Task N" when the tasks may be read out of order, and names used in one task but never defined.

## Review

After writing the plan, check it against the spec:

1. **Coverage** — can you point to a task for every requirement? Add tasks for gaps.
2. **Gaps** — search for the patterns above and fix them.
3. **Consistency** — names, signatures and types match across tasks (`clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug).
4. **One owner per rule** — for every format, lookup, invariant and constant, point to the one task that defines it. Search the plan for a pattern, parser or constant defined twice, and for "keep in step", "mirrors" or "must also call". Consistent names don't catch this: two differently named functions can encode the same rule.
5. **Deletions** — every old path the plan replaces is deleted in a task, or kept with a stated reason.

For a larger plan, also get a fresh-context review with [plan-document-reviewer-prompt.md](plan-document-reviewer-prompt.md).

## Next step

Once the plan is saved, ask the user how to continue:

- **Continue in this session** (default) with the **executing-plans** skill.
- **Start fresh** — use the **handoff** skill, then run **executing-plans** in a new session with clean context.

For plans with real either/or decisions left open, the **visual-plan** skill can render the plan for review first.
