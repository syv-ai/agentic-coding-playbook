# Anti-patterns

Six families of patterns to avoid or flag. The names inside each family are standard ([refactoring.guru](https://refactoring.guru/refactoring/smells)); the grouping is not. Examples are Python. The families are not language-specific.

---

## 1. Bloat

**Cause:** a feature was added where related code already lived. Each addition was small and locally correct.

**Names:** Long Method, Large Class, Long Parameter List.

```python
# Bad — six concerns, so six unrelated reasons to edit this.
def process_order(order, user, discount=None, tax_region=None,
                  gift_wrap=False, express=False, referral_code=None):
    ...  # 200 lines
```

```python
# Good — one reason to change each.
def process_order(order: Order, user: User, options: OrderOptions) -> Receipt:
    priced = price_order(order, user)
    fulfilled = schedule_fulfilment(order, options)
    return issue_receipt(priced, fulfilled)
```

**Remedy:** Extract Method, Extract Class, Introduce Parameter Object.

---

## 2. Rigidity

**Cause:** behaviour was wired in place because that was the smallest change available.

**Names:** Switch Statements, Inappropriate Intimacy, global state.

```python
# Bad — every new payment method edits this function.
def charge(method: str, amount: Money) -> ChargeResult:
    if method == "card":      return stripe_charge(amount)
    elif method == "paypal":  return paypal_pay(amount)
    elif method == "klarna":  return klarna_session(amount)
```

```python
# Good — a new method is a new entry.
CHARGERS = {
    "card": stripe_charge,
    "paypal": paypal_pay,
    "klarna": klarna_session,
}

def charge(method: str, amount: Money) -> ChargeResult:
    if method not in CHARGERS:
        raise UnknownPaymentMethod(method)
    return CHARGERS[method](amount)
```

Check that something actually varies before proposing a seam. A conditional that has not gained a branch in two years is a conditional.

**Remedy:** Strategy, Adapter, dependency injection.

---

## 3. Over-build

**Cause:** the request said "clean", "general" or "future-proof" without saying what that meant.

**Names:** Speculative Generality, Dead Code.

```python
# Bad — one implementation, one caller.
class AbstractDiscountStrategyFactoryProvider(ABC):
    @abstractmethod
    def get_factory(self) -> "DiscountStrategyFactory": ...
```

```python
# Good — what it actually does.
def discount_for(user: User, order: Order) -> Money:
    if not user.is_member:
        return Money.zero()
    return order.subtotal * Decimal("0.1")
```

**Remedy:** delete it. Dead code lives in version control.

---

## 4. Make-it-work

**Cause:** the request was to stop the error. The symptom was made to disappear where it surfaced.

**Names:** band-aid fix, symptom masking, over-broad exception handling, Primitive Obsession, untyped boundary.

```python
# Bad — hides the failure instead of reporting it.
def render_total(order):
    return f"{order.total if order.total else 0:.2f}"

def load_config(path) -> dict[str, Any]:
    try:
        return json.loads(Path(path).read_text())
    except Exception:
        return {}
```

```python
# Good — typed boundary, narrow catch, loud failure.
@dataclass(frozen=True)
class Config:
    currency: str
    retries: int

def load_config(path: Path) -> Config:
    try:
        data = json.loads(path.read_text())
    except FileNotFoundError:
        raise ConfigMissing(path) from None
    return Config(currency=data["currency"], retries=int(data["retries"]))
```

Fail loud and fail specifically. Broad catches swallow the failures nobody predicted along with the one that was expected. Catch only what the code can act on.

Silent defaults each remove a signal. The construct is not the problem; the location is. The decision was made where the failure surfaced, not where the bad value was produced.

**Remedy:** catch narrowly, type the boundary, fix at the point of production. Replace Primitive with Object.

---

## 5. Churn

**Cause:** each transformation was written as its own pass over the data.

**Names:** no standard name. Repeated packing and unpacking, intermediate collections with a single consumer, several passes where one would do.

```python
# Bad — four passes and three throwaway lists.
ids = [line.product_id for line in order.lines]
products = [lookup(i) for i in ids]
prices = [p.price for p in products]
total = sum([p for p in prices if p is not None])
```

```python
# Good — one pass, and still plain.
total = Money.zero()
for line in order.lines:
    price = lookup(line.product_id).price
    if price is not None:
        total += price
```

The fix is one pass, not a cleverer expression. If the rewrite needs a comment to be read, it is not a fix — leave the code alone and drop the candidate.

Also flag: converting between list, set and dict inside a loop; membership tests against a list where a set is available.

Only call this a performance finding when the collection is large. Otherwise it is legibility. Say which.

**Remedy:** one pass, a plain loop, the right container for the lookup.

---

## 6. Structure

**Cause:** no single change caused it. These are properties of where code ended up across many diffs.

**Names:** Shotgun Surgery, Divergent Change, Feature Envy, misplacement, bypassed abstraction, duplicate implementation, import cycle.

```python
# Bad — pricing policy in a route, and the database reached past the service layer.
@app.post("/orders")
def create_order(payload: dict):
    if payload["quantity"] > 100:
        payload["discount"] = 0.15
    db.execute("INSERT INTO orders ...", payload)
    return {"ok": True}
```

```python
# Good — the handler parses and responds.
@app.post("/orders")
def create_order(request: CreateOrderRequest, orders: OrderService) -> OrderResponse:
    command = request.to_command()
    order = orders.place(command)
    return OrderResponse.from_order(order)
```

Not visible in one file. If you did not compare across modules, report this family as unassessed rather than absent.

**Remedy:** SRP and DIP at module scale, Facade, boundary discipline.
