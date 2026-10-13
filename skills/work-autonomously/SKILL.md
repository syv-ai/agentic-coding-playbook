---
name: work-autonomously
description: Takes a plan, spec or PRD and carries it through to verified, working code without check-ins — planning, the design decisions that come up mid-implementation, and execution — logging every independent decision in design-decisions.md and spending the driver's context through subagents. Use when the user hands over a plan or spec and wants it done end to end while they're away.
disable-model-invocation: true
argument-hint: "[path or link to the plan, spec or PRD]"
---

# Work autonomously

You own this task end to end: planning, the design decisions that come up during implementation, and execution. The user is about to step away. Ask everything you need up front, then work without check-ins and leave a record of every decision you made on their behalf.

## 1. Kick-off: the only planned conversation

1. **Find the input.** Use the plan, spec or PRD the user passed. If there is none, ask for it. If what you get is a rough idea rather than a spec, suggest the **brainstorming** or **writing-plans** skill first, because autonomy on an undefined goal produces confident work on the wrong thing.
2. **Understand the ground.** Delegate exploration of the affected code to subagents (see §3) and get back a compact map: the modules involved, the existing patterns for this kind of change, the tests, and the verification commands. The **zoom-out** skill describes the shape of that map.
3. **Ask once, in one batch.** Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Ask only about things the code, a rational assumption or established best practice can't settle: product intent, scope edges, trade-offs only the user can weigh, and actions that would need their permission (see §5). If nothing qualifies, say so and start. Don't ask about anything you could work out yourself.
4. **Keep the machine awake** (macOS). See §6.

From here on, work without check-ins.

## 2. Decide, record, continue

When a design question comes up, decide it yourself and keep going. Resolve it in this order:

1. **Conform to the codebase.** Do it the way the code already does it. Reuse the existing helpers, patterns, libraries and naming, and don't build a second way of doing something the code already does.
2. **Code design doubts:** use the reference files of the **improve-code-design** skill: FAMILIES.md for the named anti-patterns and their remedies, and NEGATIVES.md for the patterns that look wrong but aren't.
3. **Architecture doubts:** use the **improve-codebase-architecture** skill's LANGUAGE.md and DEEPENING.md: prefer deep modules, put seams where behaviour actually varies, and don't add layers that only pass calls through.
4. **Otherwise,** use established best practice for the stack.

**Log every decision you make independently** in `design-decisions.md` as you make it, not at the end. Use the format in [DECISIONS.md](DECISIONS.md). Put the file next to the plan or spec if it lives in the repo; otherwise put it where the project's instructions file (AGENTS.md, or CLAUDE.md in Claude Code) says documents go, or at the repo root. Choices dictated by the plan or by an existing convention don't need an entry.

## 3. Your context is the budget

You drive. Subagents do the reading and the bulk of the work. Your context has to last the whole task, so spend it on decisions, not on file contents.

- **Delegate** exploration, self-contained implementation tasks, test-failure investigations and reviews. Keep for yourself the plan, the decisions, the integration between tasks and the final judgement.
- **Model:** run subagents on the strongest model available, and never a weaker one than the model you are running on. In Claude Code, that means Opus 5.5 or stronger: set `model: "opus"` on every Agent call.
- **Brief fully.** A subagent starts with no memory of this session. Give it the goal, the relevant files, the conventions to follow, the decisions already logged that affect its work, and how to verify it. Ask for a short result: what changed, the verification output, and anything that needs a decision. Don't ask for file dumps.
- **Parallelise** independent tasks. Run tasks that touch the same files one after another.
- Read a file yourself only when you are about to decide something that depends on its details.

## 4. Fix the foundation first

Don't build on code that makes the task harder than it should be. If you find accidental complexity in the way, such as duplicated logic you would have to change in several places, a tangled module, or a shallow abstraction the feature would have to work around, fix it first:

- Keep the fix scoped to what blocks this task. The rest of the codebase's cleanup is not part of this job.
- Behaviour must stay the same: tests pass before and after. If the area has no tests, add characterisation tests first.
- Keep the refactor as a separate step (and commit, if you're committing) before the feature work, and log it in `design-decisions.md`.

Essential complexity, meaning code that is hard because the problem is hard, stays.

## 5. Execute and verify

Follow the **executing-plans** skill for the task loop, verification, and the final review against the plan. Use **tdd** where a task has a testable seam and **systematic-debugging** when a failure isn't obvious. Two differences apply in autonomous mode:

- **Blockers and ambiguities don't stop you.** Choose the most reasonable option, log it, and carry on. Mark anything you're unsure of as *provisional* in the log so the user reviews it first.
- **Stop only for:** destructive, irreversible or outward-facing actions the user didn't authorise at kick-off (pushing, deploying, migrating shared data, deleting things you didn't create); a discovery that invalidates the plan's goal; or verification that still fails after two genuinely different approaches. In those cases, finish everything else you can first and then ask, so the user comes back to one question rather than a stalled session.

## 6. Keep the machine awake (macOS)

On macOS (`uname` prints `Darwin`), run `caffeinate` before starting long work so idle sleep doesn't pause the session:

```bash
caffeinate -ims -t 43200 >/dev/null 2>&1 &   # no idle/disk/system sleep, 12 h cap
echo $!                                       # note the PID to stop it at the end
```

The time cap stops it even if the session dies. `-s` only applies on AC power, and closing the lid still sleeps the Mac, so tell the user to keep it plugged in and open. On Linux, `systemd-inhibit` does the same job. On other systems, skip this step.

## 7. Finish

1. Stop `caffeinate` (`kill <pid>`).
2. Report: what was built, the verification evidence (the commands you ran and their output), what you refactored first and why, open or provisional decisions, and anything deferred. Give the full absolute path of `design-decisions.md` and point to its provisional entries first.
3. Offer the integration options (merge, open a pull request, or leave the branch) as **executing-plans** describes.

## Scale to the task

If the plan has only a few steps, skip the delegation and the caffeinate step and just do the work, but still log any decision you made on the user's behalf.

## Related skills

- **writing-plans** / **brainstorming**: to get from an idea to the plan this skill runs on.
- **executing-plans**: the interactive version, with check-ins.
- **handoff**: if the task outgrows one session despite delegating.
