# Flaky Tests

A flaky test passes and fails on the same code. Treat it as a bug with a low reproduction rate: first make it fail often enough to debug, then find the cause.

## Measure the failure rate

Run the test N times (50 or 100 for a fast test) and count failures, alone and as part of the full suite. Record the rate in the debug log; it's how you'll know whether a change helped. Raise the rate if it's too low to work with: run in parallel, under CPU load, with the same random seed or test order that failed in CI.

"Passes locally, fails in CI" is the same problem. List what differs: CPU count and speed, parallelism, test order, time zone and locale, environment variables, file system, network access, service versions.

## Sort by cause

Narrow it down to one of these before changing anything:

- **Order dependence:** passes alone, fails after other tests. Bisect for the polluting test ([feedback-loops.md](feedback-loops.md#finding-a-polluting-test)).
- **Timing:** the test assumes an async operation has finished. Often a `sleep` or a fixed timeout.
- **Shared state:** globals, singletons, caches, files, database rows or ports shared between tests or parallel workers.
- **Network:** a real external call, DNS, rate limits.
- **Resource limits:** memory, file handles, connection pools, timeouts that only bite on a slower or busier machine.
- **Real nondeterminism:** unseeded randomness, the current time, hash or map ordering.

## Wait for the condition, not for time

A sleep guesses how long something takes; it fails on a slow machine and wastes time on a fast one. Wait for the condition you actually care about, with a timeout and a clear error:

```typescript
async function waitFor<T>(check: () => T | undefined | null | false, what: string, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  while (true) {
    const result = check();          // read fresh state on every attempt
    if (result) return result;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${what}`);
    await new Promise(r => setTimeout(r, 10));
  }
}

// Instead of: await sleep(50); expect(getResult()).toBeDefined();
const result = await waitFor(() => getResult(), 'result to be set');
```

Most frameworks already have this: Testing Library's `waitFor`, Playwright's auto-waiting locators and `expect.poll`, and similar helpers elsewhere. Use the project's before writing your own.

A fixed delay is right only when the test is about timing itself (a debounce, a polling interval). Then wait for the triggering condition first, base the delay on the known interval, and comment why.

## Don't hide it

Retries, longer timeouts, `skip` and `fixme` make the test green without fixing anything, and a real intermittent bug in the product stays hidden. Fix the cause. If it can't be fixed now, quarantining the test is the user's decision: ask, and record the measured failure rate and what you found so whoever picks it up starts from there.

## Verify

Rerun the test the same N times, alone and in the full suite, and show the new failure rate next to the old one.
