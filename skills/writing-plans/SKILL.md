---
name: writing-plans
description: Writes an implementation plan from a spec or agreed requirements — files to touch, ordered tasks, and how to verify each step. Use when a change spans several files or steps, when the approach needs to be pinned down before coding, or when another session or agent will do the implementation.
---

# Writing plans

Write a plan that someone with no context on this codebase could follow: which files to touch, in what order, what behaviour each task produces, and how to check it. Assume a skilled engineer who doesn't know the toolset, the domain or the project's test habits.

## Scale to the task

If the change can be described in one sentence, skip the written plan and just do it (or say the steps in a line or two). Write a full plan when the change spans several files, the order of work matters, the approach needs agreement, or another session will execute it. Match the detail to the risk: a three-task change needs a short list, not a document.

Don't build or scratch-implement while planning. Read the code you need to decide files, names and tests, and write those decisions down.

## Where the plan goes

Where plans are saved, and whether they are kept at all, comes from the project's instructions file (AGENTS.md or CLAUDE.md). If it says nothing, look for an existing convention (a plans folder, plans attached to work items). If still unclear, ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode; plain text if it has none) and offer to record the answer as a short section in the instructions file. A plan can live only in the conversation when it won't be executed elsewhere.

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
**Spec:** <where it lives, or "none">

## Global constraints

<The spec's project-wide requirements (version floors, dependency limits, naming
or copy rules, platform requirements), one line each, exact values copied from
the spec. Every task implicitly includes this section.>

## Review focus

<Up to five input classes or failure modes the spec implies but no task's tests
exercise, most likely to bite a user first, each with the behaviour a user would
expect.>
```

The executor reads the spec alongside the plan, and conflicts inside the plan resolve against the spec. Global constraints copy what the spec says; don't invent process rules there.

Write the review focus with the spec in front of you: its silence on an input (empty, a duplicate, a very large file, a second run) is not permission for that input to break the program, and each line gets a test in the task that owns the code.

**Then the tasks.** A task is the smallest unit that carries its own test cycle. Fold setup, configuration and documentation into the task whose result needs them, and split only where a reviewer could reject one task while approving its neighbour.

````markdown
### Task N: <name>

**Files:** create `path/new.py` · modify `path/existing.py:120-145` · test `tests/path/test_x.py`

**Interfaces:** consumes `parse_token(raw: str) -> Token` (Task 2) · produces `check_expiry(token: Token, now: datetime) -> bool`

**Behaviour:** <what this task makes true, stated so it can be checked>

- [ ] Write a failing test for <behaviour>
- [ ] Implement until it passes
- [ ] Verify: `pytest tests/path/test_x.py -v` → passes

```python
def test_rejects_expired_token():
    assert check_expiry(token(expires="2026-01-01T00:00Z"), now=dt("2026-01-01T00:01Z")) is False
```
````

The Interfaces line gives the exact signatures this task uses from earlier tasks and the exact names and types later tasks rely on. An implementer often sees only their own task; this is how they learn what the neighbours call things.

Use checkboxes (`- [ ]`) so progress can be tracked. Add a commit step per task only if the project commits per task.

**End with end-to-end verification:** the commands or actions that prove the whole feature works as a user would use it, with the expected result.

## What a step contains

A step is done when the implementer can write exactly one reasonable thing from it. Unambiguous, not complete:

- **Test step:** the test's name and its assertions, with the spec's exact values.
- **Code step:** the signature, the file it lives in, and the values the spec pins. Write a body only for an algorithm the signature and tests don't determine, or for exact text the spec fixes.
- **Verification step:** the command and the output that means it passed.

Give exact file paths and line ranges for modifications, and point to another task's Interfaces line rather than repeating its code. A plan longer than the code it describes has written the code.

These are gaps, not plans: "TBD", "add error handling", "handle edge cases", "write tests for the above" without saying which, "similar to Task N" when the tasks may be read out of order, and names used in one task but never defined.

## Review

After writing the plan, check it against the spec with the checklist in [plan-document-reviewer-prompt.md](plan-document-reviewer-prompt.md), reading it as if someone else wrote it, and fix what you find. For a larger plan, also hand that prompt to a reviewer with fresh context.

## Next step

Once the plan is saved, give its location and ask the user to read the plan itself before execution starts. Agreeing on the idea or the scope is not approving a plan they haven't read. Then ask how to continue:

- **Continue in this session** (default) with the **executing-plans** skill.
- **Start fresh** — use the **handoff** skill, then run **executing-plans** in a new session with clean context.

For plans with real either/or decisions left open, the **visual-plan** skill can render the plan for review first.
