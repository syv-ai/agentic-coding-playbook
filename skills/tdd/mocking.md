# Mocking

## Where mocks belong

Mock at **system boundaries** you don't control:

- External APIs (payments, email, third-party services)
- Time and randomness
- Databases and the file system, when a test instance isn't practical

Don't mock your own modules or internal collaborators. A test that replaces them checks the wiring you wrote, not the behaviour callers rely on.

## Designing boundaries that are easy to mock

**Pass dependencies in.**

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**Prefer one function per operation over a generic fetcher.** Each mock then returns one known shape, with no branching in test setup.

```typescript
// Each operation mocks independently
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// Mocking this needs conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

## Common mistakes

**Asserting on the mock.** `expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument()` proves the mock rendered. Test the real component, or assert on the behaviour of the unit under test with the mock present.

**Test-only methods in production code.** A `destroy()` that only tests call looks like real API and can be called by accident. Put cleanup in test utilities instead, and check the class actually owns the resource.

**Mocking without knowing what the real thing does.** Mocking a high-level method can remove a side effect the test depends on, such as a config write, so the test passes or fails for the wrong reason. Run the test against the real implementation first, see what it needs, then mock the slow or external part at the lowest level that works.

**Incomplete mock data.** A response mocked with only the fields this test reads hides assumptions; downstream code that reads `metadata.requestId` fails only in production. Mirror the real response shape, using the API's documentation or a captured example.

**Mocks that outgrow the test.** When setup is longer than the test, or the mock needs methods the real component has, ask whether a test with real components would be simpler. It often is.

## Warning signs

- Assertions on `*-mock` test ids
- Methods called only from test files
- Mock setup is most of the test
- The test fails when you remove the mock, but the behaviour is fine
- You can't say why the mock is needed
