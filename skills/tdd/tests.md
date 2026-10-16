# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

## Name the break

Before writing the test body, say which production change would make it fail: a wrong branch, a missing side effect, a wrong argument, a boundary case, a broken contract. Then ask whether that change is a bug or a deliberate decision. If you can't name one, the test has no job; rewrite it around a behaviour someone could observe.

## Derive expectations independently

An expected value computed by the code under test, or by its helpers, agrees with the code whatever the code does. Use literals and hand-checked fixtures; table-driven tests with literal expected values work well.

```typescript
// BAD: the same builder produces both sides, so this always passes
const expected = buildSearchQuery({ tag: "urgent" });
expect(buildSearchQuery({ tag: "urgent" })).toBe(expected);

// BAD: the expectation repeats the implementation's arithmetic
const items = [{ price: 10 }, { price: 5 }];
expect(calculateTotal(items)).toBe(items.reduce((sum, i) => sum + i.price, 0));

// GOOD: literals worked out by hand
expect(buildSearchQuery({ tag: "urgent" })).toBe('tag:"urgent"');
expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
```

## No change detectors

A test that only an intentional decision can fail (a constant's value, the exact wording of a message, a private structure) fails on every redesign and stays green through real bugs. Test the behaviour that depends on the decision: not `expect(MAX_RETRIES).toBe(5)`, but "a failing call is retried 5 times and the 6th attempt never happens".

## Behaviour, not text

Checking that a script or config file contains a particular line only proves the file says what it says. Run the script or load the config against controlled inputs and assert the output, the side effects or the exit code.

## Your code, not the framework

Test the contract your code makes at its boundaries: the route you register, the query you emit, the payload you produce. Asserting that the router calls a registered handler tests the router, which its maintainers already do. If upstream behaviour surprised you, one narrow test naming the assumption is enough. Constructors, getters, constants and plain forwarding earn a test only when they validate, normalise, default, derive or cause a side effect; otherwise assert the first result a caller can see that depends on them.

## Specific doubles, one fixture per branch

When arguments, call counts or ordering are part of the contract, assert them; a fake that accepts anything checks nothing. Give success, error and malformed input their own fixture or spy, so the wrong branch can't satisfy the expectation. (For where mocks belong at all, see [mocking.md](mocking.md).)

## The mutation check

Before finishing, imagine changing the production code in each of these ways. At least one test should fail for each:

- a wrong constant or argument
- the wrong branch handler
- a missing state change or side effect
- an empty or default return
- missing validation for zero, empty, null, unauthorised or malformed input

A change nothing catches means that behaviour is unprotected, or a test is tautological.

## Warning signs

- Setup and assertion share the same object, so they are equal by construction.
- The test can only fail through a crash or a missing selector.
- It fails on every intentional change and never on an accidental one.
- Expected values are hidden behind loops, builders or helpers.
- It greps source text, or asserts that a removed symbol stays removed.
- It would still pass with only the framework left.
- It exists for coverage and checks no outcome or side effect.
