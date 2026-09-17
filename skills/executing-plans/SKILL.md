---
name: executing-plans
description: Executes a written implementation plan task by task, verifying each step and reviewing the result against the plan before calling it done. Use when there is an existing plan to implement, in this session or one started fresh from a handoff.
---

# Executing plans

Load the plan, check it, work through it task by task with verification, and review the result against the plan before reporting it done.

## 1. Load and review the plan

1. Read the plan, and the spec it references if there is one.
2. Review it critically. If something is unclear, contradictory or missing, raise it with the user before starting — a question now is cheaper than rework.
3. Track the tasks with your harness's todo or task tool if it has one.
4. Don't implement on the default branch without the user's consent. Beyond that, follow the project's branching conventions.

## 2. Execute the tasks

For each task:

1. Mark it in progress.
2. Follow the steps. Where a step says to use a skill (for example **tdd**), use it.
3. Run the verification the task specifies and read the output.
4. Mark it complete only when the verification passes.

**Stop and ask** instead of guessing when you hit a blocker (a missing dependency, an instruction you don't understand, a plan gap that prevents progress) or when verification keeps failing. Return to step 1 if the user updates the plan or the approach needs rethinking.

**After two failed attempts at the same fix**, stop. The context is now full of approaches that didn't work. Tell the user what you learned and suggest continuing in a fresh session with a sharper starting point — the **handoff** skill writes that down.

## 3. Verify the whole change

- Run the plan's end-to-end verification and the project's full test suite (and lint/build if the project has them).
- **UI changes:** verify visually. Take a screenshot of the result — with browser automation if your harness has it — and compare it with the design, mockup or the plan's description. List the differences and fix them.
- **Show evidence, don't assert.** Report the commands you ran and what they returned, or the screenshot. "Should pass" is not verification.

## 4. Review against the plan

Before reporting the work as done, get a review of the diff in a fresh context:

- **With subagents:** give a reviewer subagent the diff, the plan and the spec. Ask it to check that every requirement is implemented, the planned tests exist, and nothing outside the task's scope changed. Ask it to report **only gaps that affect correctness or the stated requirements**.
- **Without subagents:** do a deliberate self-review with the same checklist, reading the diff as if someone else wrote it.

A reviewer asked to find gaps will usually report some even when the work is sound. Fix what affects correctness or the requirements; treat style suggestions and speculative edge cases as optional rather than chasing every finding into extra abstraction and defensive code.

## 5. Finish

Summarise what was built, the verification evidence, and anything deferred. Then offer the integration options — merge, open a pull request, or leave the branch as it is — and do what the user chooses.

## In Claude Code

- `/goal` (for a session) or a Stop hook (as a deterministic gate) can keep the work going until the plan's verification command passes.
- If dynamic workflows are available and the user has opted in, a large plan with independent tasks can run as a workflow.

## Related skills

- **writing-plans** — creates the plan this skill executes.
- **tdd** — the test-first loop for individual tasks.
- **systematic-debugging** — when a verification failure isn't obvious.
- **handoff** — to continue in a fresh session.
