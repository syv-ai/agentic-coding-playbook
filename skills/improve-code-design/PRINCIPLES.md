# Principles

Applied at module scale. The textbooks demonstrate these between a few classes; the failures happen between modules, packages and services.

How hard each bites depends on the type system. In dynamically or structurally typed languages, substitution is the default rather than something arranged in advance, so Liskov and Interface Segregation arise less often than the literature suggests.

Examples are Python.

## Single Responsibility

**Test:** list the kinds of requirement that would force an edit here. Two unrelated kinds means two jobs.

"Does it do one thing" is unanswerable at module scale. Reasons to change is answerable.

```python
# Two reasons: tax law changes, and the PDF vendor changes.
class InvoiceModule:
    def calculate_tax(self, order: Order) -> Money: ...
    def render_pdf(self, invoice: Invoice) -> bytes: ...
```

The cost is blast radius: a tax rule change can break rendering.

**False positive:** two requirement kinds that always change together are one reason.

## Open/Closed

**Test:** to add the next case, do you edit working code or add new code?

The remedy is a seam. Check first that something varies: a two-branch conditional stable for two years is not a violation.

## Liskov Substitution

**Test:** can a caller hold the interface without knowing which implementation it got?

```python
# Callers cannot treat this like the others: it silently does nothing.
class InvoicePayment:
    def charge(self, amount: Money) -> ChargeResult | None:
        return None
```

Usually the fix is that this is not the same interface. Invoicing is not charging.

Raise sparingly. When it does bite it surfaces at runtime rather than as a type error.

## Interface Segregation

**Test:** does a caller depend on operations it never calls?

At module scale: a wide service type that three callers each use two operations of. Where the language allows it, declare the narrow interface at the caller's side and let the existing type satisfy it.

```python
class ReadsOrders(Protocol):
    def get(self, order_id: OrderId) -> Order: ...
```

Raise sparingly, as with Liskov.

## Dependency Inversion

**Test:** which module owns the abstraction — the caller or the implementation?

This is the principle that produces seams, so it is most often worth acting on.

```python
# Bad — policy depends on a vendor. No seam, so tests need the network.
class Checkout:
    def pay(self, amount: Money) -> None:
        stripe.Charge.create(amount=int(amount))
```

```python
# Good — Checkout owns the abstraction; the adapter depends on it.
class Gateway(Protocol):
    def charge(self, amount: Money) -> ChargeResult: ...

class Checkout:
    def __init__(self, gateway: Gateway) -> None:
        self._gateway = gateway
```

The dependency arrow crossed the module boundary and flipped. The test surface is the payoff.

## DRY and YAGNI

One judgement, not two rules.

DRY is about knowledge, not text. Two functions that look alike but encode different rules are not a violation.

```python
# Looks duplicated. Is not. One is a tax rule, one is a discount cap.
def clamp_tax(rate: Decimal) -> Decimal:      return min(rate, Decimal("0.25"))
def clamp_discount(rate: Decimal) -> Decimal: return min(rate, Decimal("0.25"))
```

Merging these couples VAT to marketing policy, and the next legislative change breaks a discount.

The asymmetry decides it. Duplicate, then find it is one thing: merge cheaply, knowing both cases. Abstract, then find it is two things: every change fights the abstraction and unpicking it touches every caller. When unsure, leave them apart.

Agents fail on both sides — told to be clean they over-abstract, told to be quick they copy.

## KISS

Fewer moving parts. A tiebreaker, not a standalone finding: "too complicated" is neither searchable nor arguable.

## Law of Demeter

**Test:** how many objects' shapes does this line encode?

```python
zip_code = order.customer.address.zip_code
```

Three, and it breaks when any of them changes. The fix is an operation on the nearest collaborator, not a chain of delegating wrappers.

## Least Astonishment

**Test:** would a reader who skims this be wrong about what it does?

Worth raising for agent-generated code: a function named `get_` that writes to the database will be copied by the next agent that reads it, because reading nearby code is how it decides what to write.
