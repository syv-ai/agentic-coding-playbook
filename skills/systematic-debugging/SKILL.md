---
name: systematic-debugging
description: Root-cause debugging for bugs, test failures, flaky tests, build failures, performance regressions and unexpected behaviour, built around a fast reproducible feedback loop and runtime evidence. Use before proposing a fix whose cause isn't already clear, when something passes locally but fails in CI, when a quick fix seems obvious, or when earlier fixes didn't hold.
---

# Systematic Debugging

Find the cause before changing code. A fix for a symptom tends to move the bug somewhere else, and guessing burns more time than building a way to see the bug.

The core of this skill is the feedback loop: one command you can run yourself that says "bug present" or "bug gone". With it, hypotheses and bisection are mechanical. Draw conclusions only from output you have observed, never from how you expect the code to behave.

## Scale to the bug

If the cause is already clear (the error names the line, the fix fits in one sentence) and a test covers the area, skip the steps: write or extend a test that fails, fix, watch it pass. Use the full process when the cause is unclear, the bug is intermittent, or a first fix didn't work.

## Keep a debug log

For anything beyond a quick fix, keep a short notes file (or use the work item): the loop command and the exact symptom, each hypothesis with its status (open, ruled out, confirmed) and the evidence, and each fix tried. Re-read it after compaction or when resuming. At cleanup, delete it or fold the useful part into the commit or PR.

## Redact secrets first

You will show commands, output and captured artifacts. Write `<REDACTED>` in place of every secret. Build loops against environment variables so credentials stay out of what you show. From HAR files, logs and request dumps, quote only the lines that carry the signal; they usually also carry auth headers. When instrumenting near credentials, log whether a value is set, never the value.

## 1. Build a feedback loop

Spend real effort here: a failing test at the seam that reaches the bug, a script against a running server, a CLI run diffed against known-good output, a headless browser script, a replayed payload, a bisection script. Then make it faster, sharper and more deterministic. Options, flaky bugs and bisection: [feedback-loops.md](feedback-loops.md).

The step is done when you can name one command, have run it at least once, and can show the invocation and its redacted output. The command is:

- **Red-capable:** it drives the actual bug path and asserts the user's exact symptom, so it goes red on this bug and green once fixed. "Runs without erroring" doesn't count.
- **Deterministic:** same verdict every run, or a pinned, high failure rate for a flaky bug.
- **Fast:** seconds, not minutes.
- **Agent-runnable:** you can run it without a person.

If you catch yourself reading code to build a theory before this command exists, stop and go back to building it.

**When only the user can trigger the bug** (a UI flow, a device, production): give them exact repro steps, add tagged instrumentation that writes JSON lines to a file you can read, and have them run the steps while you read the file. Keep the instrumentation in until the user confirms the fix.

**If no loop is possible at all,** say so and list what you tried. Ask for access to an environment that reproduces it, a redacted captured artifact (logs, HAR file, core dump, recording), or permission to add temporary instrumentation where it happens.

## 2. Reproduce and minimise

Run the loop and watch it go red. Then:

- **Read the error completely.** Stack traces, codes and warnings often contain the answer.
- **Confirm it's the user's bug,** not a different failure nearby. Record the exact symptom in the debug log.
- **Check what changed:** recent commits, dependencies, configuration, environment. If it worked before, bisect ([feedback-loops.md](feedback-loops.md)).
- **Minimise.** Cut inputs, callers, config, data and steps one at a time, rerunning the loop after each cut, until removing any remaining element makes it go green. A minimal repro leaves fewer suspects and becomes the regression test.
- **Trace bad values backward** to where they originate: [root-cause-tracing.md](root-cause-tracing.md). For a flaky test: [flaky-tests.md](flaky-tests.md).

If this needs a broad read of the codebase, delegate it to an exploration subagent if your harness has one, and keep the main conversation for the loop and the fix.

## 3. Compare with what works

Find similar code in the project that works. List every difference from the broken path, however small, including the configuration and environment each assumes. Read a reference implementation in full before adapting it.

## 4. Hypothesise

Write 3–5 ranked hypotheses before testing any. Each makes a prediction: "if X is the cause, changing Y makes the bug disappear." A hypothesis without a prediction can't be tested; sharpen it or drop it. Show the list to the user if they're around; they often know which to test first or which are already ruled out. If they're away, proceed with your ranking.

For a hard bug, you can run parallel investigators, one per hypothesis, each trying to disprove the others. This is expensive and optional, and each one that edits code needs its own worktree.

## 5. Gather runtime evidence

Each probe tests one prediction and changes one variable. Pick the cheapest probe that tells the hypotheses apart:

- **Logs** at the boundaries that distinguish them, written to a file you read back.
- **A debugger or logpoint** for state at one moment or a deep call chain. Evidence on debuggers for agents is mixed (they help some models and not others), so use whichever answers fastest. A long debugger session can go to a subagent.
- **Browser devtools** for the console, network and DOM; **traces** for timing and cross-service flows.
- **For performance,** measure a baseline first and bisect; logs rarely help.

Tag every line you add (for example `[DEBUG-a4f2]`) so cleanup is one search. Tools, CLIs and production sources: [evidence-sources.md](evidence-sources.md). Update the debug log after each probe.

## 6. Fix with a regression test

Turn the minimised repro into a test at a seam that reproduces the real triggering pattern; use the **tdd** skill. A test too shallow to trigger the bug gives false confidence, and if no such seam exists, record that as a finding. Watch the test fail first. If you forced the red by changing code or a fixture, diff against a pristine copy to prove the change landed. Then apply one fix at the root cause, with no bundled refactoring.

Leave existing tests alone: don't weaken, skip, delete or edit a test to make it pass, and don't special-case test inputs in the code. If a test looks wrong, stop and ask the user. Agents do take these shortcuts under pressure ([METR](https://metr.org/blog/2025-06-05-recent-reward-hacking)), and in [ImpossibleBench](https://arxiv.org/abs/2510.20270) giving models an explicit "flag for a human" exit cut cheating sharply for some of them. Anthropic's [guidance on long-running harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) treats removing or editing tests as unacceptable for the same reason. The **guardrails** skill can add a harness rule that blocks edits to test files.

**If the fix doesn't hold,** return to step 2 with what you learned. **After two failed fixes, stop.** Repeated failures usually mean the approach or the architecture is wrong, not the latest hypothesis. Talk it through with the user, and suggest continuing in a fresh session that starts from the debug log (the **handoff** skill writes that summary), because a context full of failed attempts steers the next attempt.

## 7. Verify and clean up

Show the evidence rather than claiming the fix:

- Rerun the original loop against the unminimised scenario and show it green.
- Run the wider suite, not only the new test.
- Compare old and new behaviour on a few nearby inputs. Passing tests don't prove a fix is correct: studies of SWE-bench found many "solved" patches behave differently from the real fix ([SWE-ABS](https://arxiv.org/abs/2603.00520), [PatchDiff](https://arxiv.org/abs/2503.15223)).
- Optionally, have a reviewer with fresh context check the diff against the symptom.
- If the user did the repro, they confirm the fix.

Then remove the instrumentation (search for the tag), delete throwaway harnesses, record the confirmed cause where the project records such things (commit, PR, work item), and delete the debug log. Ask what would have prevented the bug; if the answer is structural (no good seam, hidden coupling), suggest the **improve-codebase-architecture** skill.

## When there's no root cause

If the evidence runs out, write down what you investigated and ruled out, add handling or monitoring at the symptom so the next occurrence leaves better evidence, and tell the user plainly that the cause is still unknown.

## Signs you've drifted into guessing

"Let me just try X", several changes in one run, a fix you can't explain, each fix revealing a new problem elsewhere, stacking a second fix on one that didn't work, editing a test to make it pass, or saying "fixed" without rerunning the loop. Go back to the loop.

## Harness notes

- **Cursor:** Debug Mode runs the user-reproduction pattern above: hypotheses, instrumentation that reports to a local debug server, a repro by the user, then a fix and cleanup.
- **Claude Code:** investigators and long debugger sessions can run as subagents (with worktree isolation for ones that edit code). `/goal` or a Stop hook can act as a verification gate, for example "the repro command exits 0 and the full suite passes, with no test file modified".
- **Browser bugs:** Chrome DevTools MCP gives the agent console, network, DOM and performance traces; Playwright scripts and traces work without MCP.
- **Without MCP,** use CLIs: `npx playwright trace` to read a trace, `gdb -batch` or `lldb --batch` for stack and state, `rr` to record and replay, `git bisect run` for regressions.
