# Feedback Loops

A feedback loop is one command that goes red on this bug and green once it's fixed. Everything else in debugging consumes it.

## How tight is tight enough

The exit criterion is in SKILL.md step 1. A tight loop is a 2-second deterministic one; a slow loop gets run less, and each run tells you less per minute. A 30-second flaky loop is barely better than none: a pass tells you nothing, so every hypothesis test needs several runs.

## Ways to build one

Try these roughly in order:

1. **Failing test** at whatever seam reaches the bug: unit, integration or end-to-end.
2. **HTTP script** (curl or similar) against a running dev server.
3. **CLI invocation** with a fixture input, diffing output against a known-good snapshot.
4. **Headless browser script** (Playwright, Puppeteer or the harness's browser tool) that drives the UI and asserts on the DOM, console or network.
5. **Replay a captured trace.** Save a real request, payload or event log and run it through the code path in isolation.
6. **Throwaway harness.** A minimal subset of the system (one service, stubbed dependencies) that reaches the bug with a single call.
7. **Property or fuzz loop.** For "sometimes wrong output", run many random inputs and look for the failing shape.
8. **Bisection script** for a regression between two known states (see below).
9. **Differential loop.** Run the same input through the old and new version, or two configurations, and diff the outputs.

## Tighten it

- **Faster:** cache setup, skip unrelated initialisation, run only the relevant test.
- **Sharper:** assert on the exact symptom the user reported, so a different failure doesn't count as a repro.
- **More deterministic:** pin time, seed randomness, isolate the file system, stub the network.

## Minimise the repro

Once the loop is red, cut inputs, callers, config, data and steps one at a time, rerunning after each cut. Keep a cut if the loop stays red; undo it if the loop goes green. Stop when every remaining element is load-bearing. The result shrinks the hypothesis space and becomes the regression test.

## Intermittent bugs

Aim for a higher failure rate, not a perfect repro. Run the trigger many times, in parallel, under load, with narrowed timing windows or injected delays. A bug that shows up half the time is debuggable; one in a hundred is not yet. Measure the rate before and after any change. For flaky tests specifically, see [flaky-tests.md](flaky-tests.md).

## When only the user can trigger it

Beyond the steps in SKILL.md: if the code can't write to a file you can read, have it post each event to a local endpoint that writes one; log the values that distinguish your hypotheses; and read the file, not the user's description of what happened.

## Bisecting a regression

When it worked at a known commit, `git bisect` finds the commit that broke it. `git bisect run <script>` automates it, using the script's exit code:

- `0`: good (bug absent).
- `1`–`127` except `125`: bad (bug present).
- `125`: skip this commit (it doesn't build, or can't be tested).
- Anything above `127` aborts the bisect.

```bash
git bisect start <bad-commit> <good-commit>
git bisect run ./repro.sh
git bisect reset
```

Check the script first: run it on the known-good and known-bad commits and confirm it exits 0 and non-zero. A script that doesn't exercise the regression, or that fails for an unrelated reason such as a build error, gives a confident wrong answer. Have it exit 125 for setup failures so they're skipped rather than counted as bad.

The same idea works for data (halve a dataset), dependencies (bisect lockfile versions) and configuration.

## Finding a polluting test

If a test passes alone but fails in the full run, an earlier test is leaving state behind. Bisect the list of tests that run before it: run the first half followed by the failing test, then narrow to whichever half still makes it fail, until one test remains. Many test runners can run tests in a given order or from a list, which makes this scriptable. Then trace what that test leaves behind (files, globals, database rows, environment variables, mocks not restored).
