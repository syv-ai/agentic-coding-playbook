---
name: systematic-debugging
description: Disciplined root-cause debugging for any bug, test failure, performance regression, or unexpected behavior. Build a feedback loop → reproduce → investigate → hypothesise → instrument → fix → regression-test. Use before proposing any fix, especially under time pressure or when a "quick fix" seems obvious.
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask the underlying issue and it comes back.

**Core principle:** ALWAYS find the root cause before attempting a fix. A symptom fix is a failure, even when it makes the symptom disappear.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT A REPRODUCIBLE FEEDBACK LOOP AND A ROOT-CAUSE INVESTIGATION FIRST
```

If you haven't built a loop (Phase 1) and found the root cause (Phases 2–4), you cannot propose a fix.

## When to Use

Use for ANY technical issue: test failures, production bugs, unexpected behavior, performance regressions, build failures, integration issues.

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- A previous fix didn't work
- You don't fully understand the issue

**Don't skip when** the issue "seems simple" (simple bugs have root causes too), you're in a hurry (rushing guarantees rework), or someone wants it fixed NOW (systematic is faster than thrashing).

---

## Phase 1 — Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause — bisection, hypothesis-testing, and instrumentation all just consume that signal. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one — try them in roughly this order

1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
5. **Replay a captured trace.** Save a real request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single call.
7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.

Build the right feedback loop, and the bug is 90% fixed.

### Iterate on the loop itself

Treat the loop as a product. Once you have *a* loop, ask:

- Can I make it **faster**? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal **sharper**? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more **deterministic**? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop. A 2-second deterministic loop is a debugging superpower.

### Non-deterministic bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not — keep raising the rate until it's debuggable. See [condition-based-waiting.md](condition-based-waiting.md) for replacing arbitrary timeouts with condition polling.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, timestamped screen recording), or (c) permission to add temporary instrumentation. Do **not** proceed to hypothesise without a loop.

---

## Phase 2 — Reproduce & investigate root cause

Run the loop. Watch the bug appear. Then investigate before touching anything:

1. **Read the error carefully.** Don't skip past errors or warnings — they often contain the exact answer. Read stack traces completely; note line numbers, file paths, error codes.
2. **Confirm you reproduced the *right* bug.** The loop must produce the failure mode the **user** described — not a different failure that happens to be nearby. Wrong bug = wrong fix. Capture the exact symptom so later phases can verify the fix.
3. **Check recent changes.** What changed that could cause this? `git diff`, recent commits, new dependencies, config changes, environment differences.
4. **Gather evidence in multi-component systems.** When the system has multiple components (CI → build → signing, API → service → database), add diagnostic instrumentation at each component boundary BEFORE proposing fixes — log what enters and exits each component, verify config/env propagation. Run once to find WHERE it breaks, then investigate that component.
5. **Trace the data flow.** When the error is deep in a call stack, trace backward: where does the bad value originate? What called this with it? Keep tracing up to the source — fix at the source, not the symptom. See [root-cause-tracing.md](root-cause-tracing.md).

Don't proceed until you understand WHAT is happening and roughly WHY.

## Phase 3 — Pattern analysis

- **Find working examples.** Locate similar working code in the same codebase. What works that's similar to what's broken?
- **Compare against references.** If you're implementing a known pattern, read the reference implementation COMPLETELY — every line, not a skim — before applying it.
- **Identify every difference** between working and broken, however small. Don't assume "that can't matter."
- **Understand dependencies** — what config, environment, and assumptions does this code path need?

## Phase 4 — Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors you on the first plausible idea.

Each hypothesis must be **falsifiable** — state the prediction it makes:

> "If \<X\> is the cause, then \<changing Y\> will make the bug disappear / \<changing Z\> will make it worse."

If you can't state the prediction, the hypothesis is a vibe — discard or sharpen it.

**Show the ranked list to the user before testing.** They often re-rank instantly with domain knowledge ("we just deployed a change to #3") or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it if the user is away — proceed with your ranking.

## Phase 5 — Instrument

Each probe must map to a specific prediction from Phase 4. **Change one variable at a time.**

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses. Never "log everything and grep".
3. **Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep — tagged logs die, untagged logs survive and rot.

**Performance branch.** For performance regressions, logs are usually wrong. Establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 6 — Fix + regression test

Write the regression test **before the fix** — but only if there is a **correct seam** for it.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (a single-caller test when the bug needs multiple callers, a unit test that can't replicate the triggering chain), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it — the architecture is preventing the bug from being locked down. Flag it for Phase 7.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam (use the **tdd** skill for writing a proper failing test).
2. Watch it fail.
3. Apply **one** fix that addresses the root cause. No "while I'm here" improvements, no bundled refactoring.
4. Watch it pass.
5. Re-run the Phase 1 loop against the original (un-minimised) scenario.

**If the fix doesn't work:** STOP. Count your attempts. If < 3, return to Phase 2 with the new information. **If ≥ 3 fixes have failed, stop fixing and question the architecture** — when each fix reveals new coupling elsewhere or requires "massive refactoring", that's a wrong-architecture signal, not a failed hypothesis. Discuss with the user before attempting fix #4.

## Phase 7 — Cleanup + post-mortem

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or the absence of a seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway harnesses deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit / PR message — so the next debugger learns

**Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling), hand off to the **improve-codebase-architecture** skill with the specifics. Make that recommendation *after* the fix is in — you have more information now than when you started. Consider [defense-in-depth.md](defense-in-depth.md) for adding validation at multiple layers once the root cause is known.

---

## Red Flags — STOP and return to Phase 1

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run the tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- "One more fix attempt" (when you've already tried 2+)
- Each fix reveals a new problem in a different place

**All of these mean: STOP. Build the loop, find the root cause.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need the process" | Simple issues have root causes too. The process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | The first fix sets the pattern. Do it right from the start. |
| "I'll write the test after confirming the fix works" | Untested fixes don't stick. Test-first proves it. |
| "Multiple fixes at once saves time" | You can't isolate what worked, and it causes new bugs. |
| "Reference is too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing the symptom ≠ understanding the root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern, don't fix again. |

## Supporting techniques (in this directory)

- **[root-cause-tracing.md](root-cause-tracing.md)** — trace a bug backward through the call stack to its original trigger.
- **[defense-in-depth.md](defense-in-depth.md)** — add validation at multiple layers after finding the root cause.
- **[condition-based-waiting.md](condition-based-waiting.md)** — replace arbitrary timeouts with condition polling to kill flakiness.

## Related skills

- **tdd** — for writing the failing regression test in Phase 6.
- **checklist** — verify the fix actually worked before claiming success.
- **improve-codebase-architecture** — when the post-mortem reveals a structural cause.
