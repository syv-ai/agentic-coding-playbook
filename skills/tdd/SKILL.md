---
name: tdd
description: Test-driven development with a red-green-refactor loop and tracer-bullet vertical slices, testing behaviour through public interfaces rather than implementation. Use when implementing a feature or bugfix that has a testable seam, when the user mentions TDD, red-green-refactor or test-first, or wants integration-style tests.
---

# Test-Driven Development

Write one failing test, watch it fail for the right reason, write the least code that makes it pass, refactor while green, repeat. A test you never saw fail might not test anything.

Tests describe behaviour through the public interface. "User can check out with a valid cart" survives a rewrite of the internals; "checkout calls paymentService.process" does not.

## When it fits

Use it for behaviour changes that have a seam you can test: new features, bug fixes, refactors that must not change behaviour.

Skip it, and say so in one line, for throwaway prototypes, configuration, generated code, and small fixes already covered by an existing test (run that test before and after). If the change fits in one sentence, the planning below is one sentence too.

## Plan (scaled to the task)

For anything larger than a one-sentence change, agree on these with the user before writing code:

- The interface change: what callers will see and use.
- The behaviours worth testing, in priority order. You cannot test everything; favour critical paths and logic that is easy to get wrong.
- Where the seam is. Prefer the highest seam that exercises the real behaviour, and small interfaces with deep implementations (see [interface-design.md](interface-design.md)).

Use the project's own vocabulary for test names and interfaces. If the project records decisions (ADRs, a glossary), respect them.

## The loop

**Vertical slices, not horizontal.** One test, then the code for it, then the next test. Writing every test first and every implementation second produces tests of imagined behaviour and locks in a structure before you understand the problem.

```
WRONG (horizontal)            RIGHT (vertical)
  RED:   test1..test5           test1 → impl1
  GREEN: impl1..impl5           test2 → impl2
                                test3 → impl3 ...
```

1. **Red.** Write one small test for one behaviour, with a name that states the behaviour. Run it. It should *fail*, not error, and fail because the behaviour is missing. If it passes already, it tests existing behaviour; fix the test. If it errors, fix the error and rerun until it fails correctly.
2. **Green.** Write the simplest code that passes. No extra features, no refactoring of neighbouring code. Run the test and the rest of the suite; the output should be clean.
3. **Refactor.** Only while green. Remove duplication, improve names, and deepen modules by moving complexity behind a smaller interface. Keep tests passing and add no behaviour.
4. Pick the next behaviour.

Each cycle informs the next test, because you now know what the code actually needs.

## If code came before the test

It happens. Don't keep it on trust and don't bolt on a test that merely passes. Write the test that would have caught the missing behaviour, then check it fails with the new code reverted or stubbed out, and passes with it restored. If you can't make the test fail, it isn't testing that code.

## Good tests

- **One behaviour each.** An "and" in the name usually means two tests.
- **Named for the behaviour,** not the method.
- **Through the public interface.** A test that breaks on a rename or a refactor with no behaviour change was testing implementation.
- **Real code over mocks.** Mock only at system boundaries you don't control (network, time, randomness, third-party services).

Details and examples: [tests.md](tests.md) for what makes a test good, [mocking.md](mocking.md) for when to mock and the mistakes mocks invite.

## When it gets hard

| Symptom | What it usually means |
|---|---|
| Don't know how to write the test | Write the call you wish existed, then the assertion. Ask the user if the behaviour is unclear. |
| Test setup is huge | The interface asks too much of callers. Simplify it or extract a helper. |
| Everything needs mocking | The code creates its own dependencies. Pass them in. |
| Test is complicated | The design is. Simplify the interface before the test. |

## Before calling it done

- Each new behaviour has a test you watched fail for the expected reason.
- The full suite passes and the output is clean.
- Mocks appear only at boundaries.
- Edge cases and error paths that matter to callers are covered; you did not add tests for cases that cannot happen.

Show the evidence (the command and its output) rather than asserting the tests pass.

## Related skills

- **systematic-debugging** when a test exposes a bug whose cause isn't obvious; write the regression test here.
- **improve-codebase-architecture** when tests are hard to write because the modules are shallow.
