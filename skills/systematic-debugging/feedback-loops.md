# Feedback Loops

A good loop is fast, deterministic and runnable by the agent, and it asserts on the specific symptom rather than "didn't crash".

## Ways to build one

Try these roughly in order:

1. **Failing test** at whatever seam reaches the bug: unit, integration or end-to-end.
2. **HTTP script** (curl or similar) against a running dev server.
3. **CLI invocation** with a fixture input, diffing output against a known-good snapshot.
4. **Headless browser script** (Playwright, Puppeteer or the harness's browser tool) that drives the UI and asserts on the DOM, console or network.
5. **Replay a captured trace.** Save a real request, payload or event log and run it through the code path in isolation.
6. **Throwaway harness.** A minimal subset of the system (one service, stubbed dependencies) that reaches the bug with a single call.
7. **Property or fuzz loop.** For "sometimes wrong output", run many random inputs and look for the failing shape.
8. **Bisection harness.** If the bug appeared between two known states (commits, datasets, versions), automate "set up state, check" so `git bisect run` or an equivalent can drive it.
9. **Differential loop.** Run the same input through the old and new version, or two configurations, and diff the outputs.

## Improve the loop

Once you have one:

- **Faster:** cache setup, skip unrelated initialisation, narrow the test scope.
- **Sharper:** assert on the exact symptom the user reported.
- **More deterministic:** pin time, seed randomness, isolate the file system, stub the network.

A 30-second flaky loop is barely better than none; a 2-second deterministic one makes the rest of the process routine.

## Intermittent bugs

Aim for a higher reproduction rate, not a perfect repro. Run the trigger many times, in parallel, under load, with narrowed timing windows or injected delays. A bug that shows up half the time is debuggable; one in a hundred is not yet. Replace arbitrary sleeps with condition polling ([condition-based-waiting.md](condition-based-waiting.md)).

## When no loop is possible

Say so plainly and list what you tried. Ask the user for one of:

- access to the environment that reproduces it,
- a captured artifact (log dump, HAR file, core dump, timestamped recording),
- permission to add temporary instrumentation where it happens.

Don't move on to hypotheses without some signal to test them against.

## Instrumentation tips

- One breakpoint often beats ten log lines.
- Log at the boundaries that distinguish your hypotheses, not everywhere.
- Tag debug lines with a unique prefix (`[DEBUG-a4f2]`) so they can be found and removed in one search.
- For performance, establish a baseline measurement (timer, profiler, query plan) before changing anything.
