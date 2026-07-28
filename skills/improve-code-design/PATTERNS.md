# Patterns

Remedy vocabulary. You do not need to memorise implementations — an agent writes a correct Strategy quickly. The name is what compresses the instruction.

Names as spelled in the [catalogue](https://refactoring.guru/design-patterns/catalog), so they stay searchable. It is **Factory Method** and **Abstract Factory**, never "Factory".

## Before naming one

Prefer the lightest construct the language offers. A pattern is a shape, not a class hierarchy. The following patterns are *examples* of patterns.

| Pattern | Lightweight form |
|---|---|
| Strategy | A map from key to function |
| Adapter | One type satisfying the interface |
| Facade | A module with one entry point |
| Factory Method | A function |
| Observer | A list of callbacks |
| Command | A record plus a function |
| Builder | A record with defaults |
| Template Method | A function taking callbacks |
| Singleton | A module-level value, or pass it in |

The catalogue's examples are written as class hierarchies because they teach one shape across many languages. Read them for the shape; write the lightweight form.

Two implementations justify a seam. One does not. This applies to every pattern below.

Examples are Python; imports omitted.

---

## Strategy

[Catalogue](https://refactoring.guru/design-patterns/strategy/python/example) · **When:** a conditional grows by one branch per feature.

```python
CHARGERS = {"card": stripe_charge, "paypal": paypal_pay}

def charge(method: str, amount: Money) -> ChargeResult:
    if method not in CHARGERS:
        raise UnknownPaymentMethod(method)
    return CHARGERS[method](amount)
```

Use types with a shared interface instead of plain functions when strategies carry state or need more than one operation.

**Cost:** dispatch moves away from the call site. Worth it once the chain grows, not at two stable branches.

## Adapter

[Catalogue](https://refactoring.guru/design-patterns/adapter/python/example) · **When:** vendor or external code is called directly from many places, so it cannot be substituted and tests cannot avoid it.

```python
class Gateway(Protocol):
    def charge(self, amount: Money) -> ChargeResult: ...

class StripeGateway:
    def charge(self, amount: Money) -> ChargeResult:
        raw = stripe.Charge.create(amount=int(amount * 100), currency="dkk")
        return ChargeResult(id=raw.id, ok=raw.paid)
```

Vendor types must not escape the adapter. One that returns `stripe.Charge` to callers has moved the coupling, not removed it.

**Cost:** one indirection, and the adapter needs its own test against the real vendor.

## Facade

[Catalogue](https://refactoring.guru/design-patterns/facade/python/example) · **When:** a subsystem has decayed, callers are tangled into its internals, and rewriting it is not on the table.

```python
@dataclass(frozen=True)
class Fulfilment:
    picker: Picker
    labels: Labels
    notifier: Notifier

    def dispatch(self, order: Order) -> Shipment:
        pick = self.picker.reserve(order.lines)
        label = self.labels.create(order.address, pick.weight)
        self.notifier.sent(order.customer, label.tracking)
        return Shipment(pick, label)
```

A module exposing `dispatch()` is the lighter form. Use the record when collaborators must be injected for tests.

**Cost:** the decay remains and is now harder to see. Only propose this when the subsystem genuinely is not being rewritten, and say so rather than presenting it as a fix.

## Factory Method

[Catalogue](https://refactoring.guru/design-patterns/factory-method/python/example) · **When:** construction should be decoupled from use, or construction has real logic in it.

```python
def gateway_for(region: str) -> Gateway:
    return {"dk": StripeGateway, "us": AdyenGateway}[region]()
```

Agents produce factory layers constantly because "factory" reads as good practice. A factory with one implementation and one caller is Speculative Generality with a pattern name. Be readier to delete one than to add one.

## Observer

[Catalogue](https://refactoring.guru/design-patterns/observer/python/example) · **When:** side effects are wired into their cause, so the cause gains a reason to change whenever someone wants another effect.

```python
# Before — placing an order has four reasons to change, three not about orders.
def place_order(order: Order) -> None:
    save(order)
    send_confirmation_email(order)
    update_analytics(order)
    notify_warehouse(order)
```

```python
# After — handlers passed in, so the seam is visible and testable.
def place_order(order: Order, handlers: Sequence[Handler]) -> None:
    save(order)
    event = OrderPlaced(order.id)
    for handle in handlers:
        handle(event)
```

**Cost:** control flow stops reading top to bottom, and ordering between handlers becomes implicit. Propose it when the list keeps growing or handlers must fail independently — not for two effects that never change.

## Command

[Catalogue](https://refactoring.guru/design-patterns/command/python/example) · **When:** an action must be queued, logged, retried, undone or replayed. Making the action a value is what enables those.

```python
@dataclass(frozen=True)
class RefundOrder:
    order_id: OrderId
    amount: Money
    reason: str

def execute(cmd: RefundOrder, gateway: Gateway) -> RefundResult: ...
```

**Cost:** indirection between intent and execution. Worth it only when queue, log, undo or replay is a real requirement.

## Builder

[Catalogue](https://refactoring.guru/design-patterns/builder/python/example) · **When:** construction has many optional parts. The direct remedy for Long Parameter List.

```python
@dataclass(frozen=True, kw_only=True)
class OrderOptions:
    gift_wrap: bool = False
    express: bool = False
    referral_code: str | None = None
```

A stepwise builder earns its place only when construction genuinely proceeds in stages or needs validation between them.

## Template Method

[Catalogue](https://refactoring.guru/design-patterns/template-method/python/example) · **When:** several flows share a skeleton and differ only in steps.

```python
def run_import(source: Source, *, parse: Parser, validate: Validator) -> Report:
    ok = []
    for row in source.read():
        record = parse(row)
        if validate(record):
            ok.append(record)
    return Report(ok=ok)
```

Passing the varying steps in is lighter than a base class with hooks.

**Cost:** the skeleton becomes hard to vary. If two callers want different skeletons, this fights back.

## Singleton

[Catalogue](https://refactoring.guru/design-patterns/singleton/python/example) · **A finding, not a remedy.**

Agents reach for it constantly — config, connections, caches. It gives you global mutable state with a respectable name: no seam, no substitution, no test that avoids the real thing.

```python
# Bad — nothing can be tested without a real database.
class Database:
    _instance = None
    @classmethod
    def instance(cls) -> "Database":
        if cls._instance is None:
            cls._instance = cls(connect(os.environ["DB_URL"]))
        return cls._instance
```

Construct once at startup and pass it in. The question is never whether it was implemented correctly, but what it cost in testability.

---

Decorators, Bridge, Composite, Flyweight, Proxy, Chain of Responsibility, Iterator, Mediator, Memento, Prototype, State, Visitor and Abstract Factory are real and occasionally right. The nine above cover what agents produce. If a situation genuinely calls for another, name it and link the catalogue.
