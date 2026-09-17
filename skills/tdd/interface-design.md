# Interface Design and Refactoring

## Deep modules

From *A Philosophy of Software Design*: a **deep module** has a small interface and a lot of implementation behind it. A **shallow module** has an interface nearly as complex as what it does, so callers pay for it without getting much.

```
Deep                         Shallow
┌───────────────┐            ┌─────────────────────────┐
│ small surface │            │ large surface           │
├───────────────┤            ├─────────────────────────┤
│               │            │ thin pass-through       │
│ real work     │            └─────────────────────────┘
│ hidden here   │
└───────────────┘
```

When shaping an interface, ask: can it have fewer methods, simpler parameters, and hide more?

## Designing for testability

1. **Accept dependencies instead of creating them.**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Return results instead of producing side effects.**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Keep the surface small.** Fewer methods mean fewer tests; fewer parameters mean simpler setup.

## Refactoring on green

After a cycle passes, look for:

- **Duplication:** extract a function or type.
- **Long functions:** split into private helpers, keeping tests on the public interface.
- **Shallow modules:** merge them or move logic behind one interface.
- **Feature envy:** move logic to where the data lives.
- **Primitive obsession:** introduce a small value type.
- **Existing code** the new code shows to be awkward.

Refactor in small steps, running the tests after each. Add no behaviour while refactoring.
