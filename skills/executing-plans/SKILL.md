---
name: executing-plans
description: Executes a written implementation plan task by task, verifying each step and reviewing the result against the plan before calling it done. Use when there is an existing plan to implement, in this session or one started fresh from a handoff.
---

# Executing plans

Load the plan, check it, work through it task by task with verification, and review the result against the plan before reporting it done.

## 1. Load and review the plan

1. Read the plan, and the spec it references if there is one. The spec is the authority: where the plan contradicts it, the spec wins. Note the plan's global constraints; they apply to every task.
2. Review it critically. Scan for conflicts between what tasks produce and what later tasks consume (the Interfaces lines, if the plan has them), and for anything unclear, contradictory or missing. Raise them all as one batched question before Task 1 — a question now is cheaper than rework. Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Most take three or four questions per call, so split larger batches.
3. Track progress somewhere that survives compaction: the plan's checkboxes, or a progress file the project's conventions allow, plus your harness's todo tool if it has one. If you are resuming, or your context was compacted, trust that record and `git log` over your memory of what you did.
4. Don't implement on the default branch without the user's consent. Beyond that, follow the project's branching conventions.

## 2. Execute the tasks

For each task:

1. Mark it in progress and re-read the task's text, even if you remember it: what you remember is a summary, the task has the exact names and values. Read the task, not the whole plan.
2. Follow the steps. Where a step says to use a skill (for example **tdd**), use it.
3. Run the verification the task specifies and read the output. Redirect long test output to a file and read its tail, so it doesn't fill your context.
4. Mark it complete only when all of this is true, with evidence from this session: every test the task names exists, ran, and you read its output; the final run passed; each expected result in the task was compared against the real output; any deviation is recorded. Tick the progress record in the same step as the work (the same command as the commit, say), not in a batch later.

**Small plan errors** (a misnamed function, a wrong path, a step that contradicts the spec in a minor way): choose the smallest change that satisfies the spec, record it in the progress record as `deviation: <what> — <why> — <cost if wrong>`, and continue.

**Stop and ask** instead of guessing when you hit a real blocker (a missing dependency, an instruction you don't understand, a plan gap that prevents progress, a choice only the user can make) or when verification keeps failing. Return to step 1 if the user updates the plan or the approach needs rethinking.

**After two failed attempts at the same fix**, stop. The context is now full of approaches that didn't work. Tell the user what you learned and suggest continuing in a fresh session with a sharper starting point — the **handoff** skill writes that down.

## 3. Verify the whole change

- Run the plan's end-to-end verification and the project's full test suite (and lint/build if the project has them).
- **UI changes:** verify visually. You haven't verified a UI change until you've looked at the real running result; don't mock or stage the proof. Take a screenshot of the result — with browser automation if your harness has it — and compare it with the design, mockup or the plan's description. List the differences and fix them.
- **Show evidence, don't assert.** Report the commands you ran and what they returned, or the screenshot. "Should pass" is not verification.

## 4. Review against the plan

Before reporting the work as done, get a review of the diff in a fresh context:

- **With subagents:** give a reviewer subagent the diff, the plan, the spec and your recorded deviations, on the most capable model available (name it explicitly where the harness lets you, since an omitted model usually inherits the session's). Ask it to:
  - check that every requirement is implemented, the planned tests exist, and nothing outside the task's scope changed;
  - check each line of the plan's review focus deliberately (pass them verbatim);
  - judge behaviour the spec is silent on by what a reasonable user would expect;
  - list under "Declined to judge" every behaviour it set aside as out of scope, one line each with the reason;
  - label each finding Critical (wrong or broken for users), Important (a requirement or likely input not handled) or Minor (everything else);
  - do the review itself rather than spawning further subagents;
  - report **only gaps that affect correctness or the requirements**.
- **Without subagents:** do a deliberate self-review with the same checklist, reading the diff as if someone else wrote it, and say in your report that the review was a self-review.

**Grade the findings yourself.** The reviewer's severity is advice; re-grade each finding by what a user gets if it ships. Decide each "Declined to judge" line the same way: it becomes a finding, or a recorded deviation saying why it stands. Fix the Critical and Important findings in one pass, each with a test that fails first, then run the full suite. List Minor findings as Deferred instead of fixing them. A reviewer asked to find gaps will usually report some even when the work is sound, so don't chase style suggestions and speculative edge cases into extra abstraction and defensive code.

## 5. Finish

Summarise what was built, the verification evidence, every deviation and decision you recorded (with its cost if wrong), and the deferred findings. Then offer the integration options — merge, open a pull request, or leave the branch as it is — and do what the user chooses.

## Harness notes

- **Keep going until verification passes:** a goal command (`/goal <condition>` in Claude Code and Codex; in Copilot CLI `/goal` starts autopilot with an objective) or, in Claude Code, a Stop hook as a deterministic gate.
- **Workflows:** in Claude Code, a large plan with independent tasks can run as a workflow, but only when the user opts in, by typing `ultracode` in a prompt or asking for a workflow.
- **Looking at a UI:** Claude in Chrome (`claude --chrome`) or a Playwright MCP server in Claude Code, the integrated browser's tools in VS Code, the built-in browser in Cursor, and the in-app browser in the Codex app.

## Related skills

- **writing-plans** — creates the plan this skill executes.
- **tdd** — the test-first loop for individual tasks.
- **systematic-debugging** — when a verification failure isn't obvious.
- **work-autonomously** — to run a plan end to end without check-ins.
- **handoff** — to continue in a fresh session.
