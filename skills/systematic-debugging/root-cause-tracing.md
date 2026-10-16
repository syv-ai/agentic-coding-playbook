# Root Cause Tracing

Bugs often show up deep in the call stack: `git init` runs in the wrong directory, a file lands in the wrong place, a database opens with the wrong path. Fixing where the error appears treats the symptom. Trace backward through the call chain to where the bad value came from, and fix there.

Use this when the error happens deep in execution, the stack trace is long, or it's unclear where invalid data originated.

## The process

1. **Observe the symptom.** `Error: git init failed in ~/project/packages/core`
2. **Find the immediate cause.** The code that directly fails: `execFileAsync('git', ['init'], { cwd: projectDir })`.
3. **Ask what called it, and with what.** Walk up the chain and note the value at each step:
   ```
   WorktreeManager.createSessionWorktree(projectDir, sessionId)
     ← Session.initializeWorkspace()
     ← Session.create()
     ← test calling Project.create()
   ```
   Here `projectDir` was `''`, and an empty `cwd` resolves to `process.cwd()`, the source directory.
4. **Find the original trigger.** The test read `context.tempDir` at the top level, before `beforeEach` had set it, so it was still `''`.

## When you can't trace by reading

Log just before the failing operation, with the value, the context and a stack trace:

```typescript
console.error('[DEBUG-a4f2] git init', {
  directory, cwd: process.cwd(), stack: new Error().stack,
});
```

Write to stderr in tests, since the project's logger may be suppressed, then filter: `npm test 2>&1 | grep DEBUG-a4f2`. In the traces, look for the test file names, the line that triggers the call, and the pattern (same test, same parameter).

If the bad state appears during a test run but you don't know which test causes it, bisect the test list ([feedback-loops.md](feedback-loops.md#finding-a-polluting-test)).

## Fix at the origin

In the example, the fix was to make `tempDir` a getter that throws when read before `beforeEach`, not to validate `cwd` inside `git init`. If you can't trace any further up, fix at the deepest point you reached, add a guard, and say the origin is still unknown.

Add a guard elsewhere only at a dangerous operation, and only where it's cheap: refusing `git init` or `rm -rf` outside a temp directory during tests is worth one check. Don't add validation at every layer as a substitute for finding the origin.
