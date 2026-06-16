---
name: tdd
description: Test-driven development with a disciplined red-green-refactor loop and tracer-bullet vertical slices. Tests verify behavior through public interfaces, not implementation. Use when implementing any feature or bugfix, when the user mentions TDD / red-green-refactor / test-first, or wants integration-style tests.
---

# Test-Driven Development

## Overview

Write the test first. Watch it fail. Write the minimal code to pass. Refactor. Repeat — one behavior at a time.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Tests verify behavior through public interfaces, not implementation details.** Code can change entirely; good tests shouldn't. A good test reads like a specification — "user can checkout with a valid cart" tells you exactly what capability exists, and it survives refactors because it doesn't care about internal structure.

**Violating the letter of the rules is violating the spirit of the rules.**

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it. Start over. Implement fresh from the test.

**No exceptions:** don't keep it "as reference", don't "adapt" it while writing the test, don't even look at it. Delete means delete.

## The second law: vertical slices, not horizontal

```
ONE TEST → ONE IMPLEMENTATION → REPEAT.
NEVER all-tests-first-then-all-implementation.
```

Writing all the tests up front, then all the code, is **horizontal slicing** — treating RED as "write every test" and GREEN as "write every implementation." It produces crap tests:

- Tests written in bulk verify *imagined* behavior, not *actual* behavior.
- You end up testing the *shape* of things (signatures, data structures) instead of user-facing behavior.
- They go insensitive to real changes — they pass when behavior breaks and fail when it's fine.
- You outrun your headlights, committing to a test structure before you understand the implementation.

```
WRONG (horizontal):              RIGHT (vertical, tracer bullets):
  RED:   test1..test5              RED→GREEN: test1 → impl1
  GREEN: impl1..impl5              RED→GREEN: test2 → impl2
                                   RED→GREEN: test3 → impl3 ...
```

Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

## When to Use

**Always:** new features, bug fixes, refactoring, behavior changes.

**Exceptions (ask the user first):** throwaway prototypes, generated code, configuration files.

Thinking "skip TDD just this once"? Stop. That's rationalization.

---

## Phase 0 — Plan (before any code)

When exploring the codebase, use the project's domain glossary (if it has one) so test names and interface vocabulary match the project's language; respect any ADRs in the area you're touching.

- [ ] Confirm with the user what interface changes are needed
- [ ] Confirm which behaviors to test, and prioritize them — **you can't test everything**; focus on critical paths and complex logic, not every edge case
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design the interface for [testability](interface-design.md)
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get the user's approval on the plan

Ask: "What should the public interface look like? Which behaviors matter most to test?"

## The Red-Green-Refactor cycle

### RED — write one failing test

Write one minimal test showing what should happen. One behavior, clear name, real code.

<Good>
```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
Clear name, tests real behavior, one thing.
</Good>

<Bad>
```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
Vague name, tests the mock not the code.
</Bad>

See [tests.md](tests.md) for what makes a good test and [mocking.md](mocking.md) for when (and when not) to mock.

### Verify RED — watch it fail

**MANDATORY. Never skip.** Run the test. Confirm it *fails* (not errors), the failure message is the expected one, and it fails because the feature is missing — not because of a typo.

- Test passes already? You're testing existing behavior. Fix the test.
- Test errors? Fix the error and re-run until it fails *correctly*.

### GREEN — minimal code

Write the simplest code that passes the test. Don't add features, don't refactor other code, don't "improve" beyond the test.

<Good>
```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try { return await fn(); }
    catch (e) { if (i === 2) throw e; }
  }
  throw new Error('unreachable');
}
```
Just enough to pass.
</Good>

### Verify GREEN — watch it pass

**MANDATORY.** Run the test. Confirm it passes, other tests still pass, and the output is pristine (no errors, no warnings). Test fails? Fix the code, not the test. Other tests fail? Fix them now.

### REFACTOR — clean up (green only)

After green only: remove duplication, improve names, extract helpers, and — most valuably — **deepen modules** (move complexity behind simple interfaces). Apply SOLID where it falls out naturally. Keep tests green; add no behavior. See [refactoring.md](refactoring.md) and [deep-modules.md](deep-modules.md). **Never refactor while red — get to green first.**

### Repeat

Next failing test for the next behavior.

---

## Good tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in the name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes the behavior | `test('test1')` |
| **Shows intent** | Demonstrates the desired API | Obscures what the code should do |
| **Survives refactor** | Tests behavior via the public interface | Breaks when you rename an internal function |

Warning sign: your test breaks when you refactor but behavior hasn't changed → it was testing implementation, not behavior. See [testing-anti-patterns.md](testing-anti-patterns.md).

## Why order matters

- **"I'll write tests after to verify it works."** Tests written after code pass immediately, which proves nothing — they might test the wrong thing, test implementation, or miss cases you forgot. You never saw it catch the bug.
- **"Tests after achieve the same goals."** No. Tests-after answer "what does this do?" Tests-first answer "what *should* this do?" Tests-after are biased by your implementation.
- **"Deleting X hours of work is wasteful."** Sunk cost. The time is gone. Keeping code you can't trust is the actual waste.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine — throw away the exploration, start with TDD. |
| "Test is hard to write" | Listen to the test. Hard to test = hard to use. Simplify the interface. |
| "TDD will slow me down" | TDD is faster than debugging in production. |

## Red Flags — STOP and start over

Code before test · test after implementation · test passes immediately · can't explain why the test failed · "I'll add tests later" · "just this once" · "keep as reference" · "I already manually tested it" · "it's about spirit not ritual".

**All of these mean: delete the code, start over with TDD.**

## When stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write the wished-for API. Write the assertion first. Ask the user. |
| Test too complicated | The design is too complicated. Simplify the interface. |
| Must mock everything | Code is too coupled. Use dependency injection. See [mocking.md](mocking.md). |
| Test setup is huge | Extract helpers. Still complex? Simplify the design. |

## Verification checklist

- [ ] Every new function/method has a test
- [ ] You watched each test fail before implementing
- [ ] Each test failed for the expected reason (feature missing, not a typo)
- [ ] You wrote minimal code to pass each test
- [ ] All tests pass, output pristine
- [ ] Tests use real code (mocks only where unavoidable)
- [ ] Edge cases and errors covered

Can't check all the boxes? You skipped TDD. Start over.

## Reference files

- [tests.md](tests.md) — what makes a good test
- [mocking.md](mocking.md) — when to mock and when not to
- [interface-design.md](interface-design.md) — designing interfaces for testability
- [deep-modules.md](deep-modules.md) — small interface, deep implementation
- [refactoring.md](refactoring.md) — the refactor step in depth
- [testing-anti-patterns.md](testing-anti-patterns.md) — pitfalls to avoid

## Related skills

- **systematic-debugging** — when a test surfaces a bug, debug it to root cause; write the regression test here.
- **checklist** — verify the suite actually passes before you claim it.
