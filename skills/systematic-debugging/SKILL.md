---
name: systematic-debugging
description: Root-cause debugging for bugs, test failures, build failures, performance regressions and unexpected behaviour, built around a fast reproducible feedback loop. Use before proposing a fix whose cause isn't already clear, especially when a quick fix seems obvious or earlier fixes didn't hold.
---

# Systematic Debugging

Find the cause before changing code. A fix for a symptom tends to move the bug somewhere else, and guessing burns more time than building a way to see the bug.

The core of this skill is the feedback loop: a fast, deterministic signal you can run yourself that says "bug present" or "bug gone". With one, hypotheses and bisection are mechanical. Without one, you are reading code and hoping.

## Scale to the bug

If the cause is already clear (the error names the line, the fix fits in one sentence) and a test covers the area, skip the phases: write or extend a test that fails, fix, watch it pass. Use the full process when the cause is unclear, the bug is intermittent, or a first fix didn't work.

## 1. Build a feedback loop

Spend real effort here. Try, roughly in order: a failing test at whatever seam reaches the bug, a script against a running server, a CLI run diffed against known-good output, a headless browser script, a replayed captured payload, a minimal harness, a fuzz loop, a bisection script. Then make the loop faster, sharper (assert on the specific symptom) and more deterministic.

Details, including intermittent bugs and what to do when no loop is possible: [feedback-loops.md](feedback-loops.md).

If you genuinely cannot build a loop, stop and say so. List what you tried and ask the user for access to an environment that reproduces it, a captured artifact (logs, HAR file, recording), or permission to add temporary instrumentation.

## 2. Reproduce and investigate

Run the loop and watch the bug happen. Then:

- **Read the error completely.** Stack traces, codes and warnings often contain the answer.
- **Confirm it's the user's bug,** not a nearby failure. Capture the exact symptom so you can verify the fix against it.
- **Check what changed:** recent commits, dependencies, configuration, environment.
- **In multi-component systems,** log what enters and leaves each boundary once, to find *where* it breaks before asking why.
- **Trace bad values backward** to where they originate and fix there. See [root-cause-tracing.md](root-cause-tracing.md).

If the investigation needs a broad read of the codebase, delegate it to an exploration subagent if your harness has one, and keep the main conversation for the loop and the fix. Otherwise keep the exploration narrow.

## 3. Compare with what works

Find similar code in the project that works. List every difference from the broken path, however small, and what configuration or environment each path assumes. When following a reference implementation, read all of it before adapting it.

## 4. Hypothesise

Write 3–5 ranked hypotheses before testing any. Each makes a prediction: "if X is the cause, changing Y makes the bug disappear." A hypothesis without a prediction is a hunch; sharpen it or drop it.

Show the ranked list to the user if they're around. They often know which one to test first or which ones are already ruled out. If they're away, proceed with your ranking.

## 5. Instrument

Each probe tests one prediction, and you change one variable at a time. Prefer a debugger or REPL over logs. When you do log, tag every line with a unique prefix such as `[DEBUG-a4f2]` so cleanup is one search. For performance problems, measure a baseline first and bisect; logs rarely help.

## 6. Fix with a regression test

Write the regression test before the fix, at a seam that reproduces the real triggering pattern. A test at a seam too shallow to trigger the bug gives false confidence; if no such seam exists, record that as a finding. Use the **tdd** skill for the test.

Then apply one fix at the root cause, with no bundled refactoring. Watch the test pass, and rerun the original loop against the unminimised scenario.

**If the fix doesn't hold,** return to step 2 with what you learned. **After two failed fixes, stop.** Repeated failures usually mean the approach or the architecture is wrong, not the latest hypothesis. Talk it through with the user, and suggest continuing in a fresh session that starts from what you now know (the **handoff** skill writes that summary), because a context full of failed attempts steers the next attempt.

## 7. Clean up

- The original repro no longer reproduces.
- The regression test passes, or the missing seam is documented.
- Debug instrumentation is gone (search for the tag).
- Throwaway harnesses are deleted or clearly marked.
- The confirmed cause is recorded where the project records such things (commit message, PR, work item).

Then ask what would have prevented the bug. If the answer is structural (no good seam, hidden coupling), suggest the **improve-codebase-architecture** skill. For hardening after the fix, see [defense-in-depth.md](defense-in-depth.md); for flaky timing, [condition-based-waiting.md](condition-based-waiting.md).

## Signs you've drifted into guessing

"Let me just try X", several changes in one run, a fix you can't explain, or each fix revealing a new problem elsewhere. Go back to the loop.
