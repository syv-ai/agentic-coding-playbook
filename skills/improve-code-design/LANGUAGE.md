# Language

Term contract. Use these exactly. The point is not education — it is that vague nouns are how a review stops being falsifiable.

## Condition

**Complexity** — anything that makes a system hard to understand or change. Essential is inherent in the problem; accidental comes from how it was solved. Only accidental is in scope.

**Creep** — decay arriving one acceptable change at a time, visible only in aggregate. Avoid: rot, cruft.

**Mimicry** — inferring the local standard from surrounding code and matching it, including when it is bad. Agents do this by construction. It is why a misleadingly named function is a real finding: the next agent copies it.

**Technical debt** — the gap between the code and current best understanding of the domain. Not a synonym for mess. Both meanings circulate; say which you mean or use a family name.

**Blast radius** — how much can break from changing one thing.

**Batch size** — how much change ships in one unit of review.

**Seam** — a place where behaviour can be altered without editing code in place, because an implementation can be substituted. Avoid: boundary.

**Coupling / cohesion** — how much a module depends on another's internals; how much one module's contents belong together.

**Module** — anything with an interface and an implementation: function, class, package, service.

## Banned

Never: *clean · messy · spaghetti · best practice · code quality · maintainable · robust · scalable · proper · idiomatic* (as a verdict) · *architecture* · *just* · *simply*.

Each is unfalsifiable, which means it cannot be argued with, which means it will be ignored. If a sentence needs one of these to work, the finding is not ready.

Fits: "Two reasons to change: tax rules and the PDF vendor." · "Every payment method edits `charge()`." · "One implementation, one caller." · "The `None` was produced in the draft-order path and patched at the leaf." · "Four passes over `order.lines` where one would do."

## Principles, operational form

Cite the operational form, not the acronym. "Two reasons to change" lands; "violates SRP" does not.

| Principle | Operational form |
|---|---|
| Single Responsibility | One reason to change |
| Open/Closed | Extend without editing working code |
| Dependency Inversion | The caller owns the abstraction |
| DRY | One authoritative representation per piece of *knowledge*, not of text |
| YAGNI | Build for needs that exist |
| Law of Demeter | Talk to immediate collaborators |
| Least Astonishment | Behaviour matches the reader's model |
| KISS | Fewer moving parts. A tiebreaker, never a standalone finding |

Liskov and Interface Segregation: in dynamically and structurally typed languages substitution is the default rather than something arranged in advance, so both arise far less than the literature suggests. Raise Liskov only when an implementation silently does nothing where callers expect an effect — the usual fix is that it was never the same interface. Raise ISP only when a caller must construct or mock operations it never calls.

DRY and YAGNI are one judgement. The asymmetry decides it: duplicate, then discover it is one thing, and merging is cheap because you know both cases. Abstract, then discover it is two things, and every change fights the abstraction while unpicking it touches every caller. When unsure, leave them apart. Agents fail on both sides — told to be clean they over-abstract, told to be quick they copy.

## Remedies

Prefer the lightest construct the language offers. A pattern is a shape, not a class hierarchy. The catalogue writes them as hierarchies to teach one shape across many languages; read them for the shape, write the lightweight form.

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
| Singleton | A finding, not a remedy — see FAMILIES.md §2 |

Refactorings: Extract Method, Extract Class, Replace Conditional with Polymorphism, Replace Primitive with Object, Introduce Parameter Object.

Spell names as the [catalogue](https://refactoring.guru/design-patterns/catalog) does, so they stay searchable: **Factory Method** and **Abstract Factory**, never "Factory". Other patterns are real and occasionally right; the nine above cover what agents produce. If a situation genuinely calls for another, name it and link the catalogue.

Two costs worth stating whenever you propose one: **Adapter** — vendor types must not escape it, or the coupling moved rather than went away. **Facade** — the decay remains and is now harder to see; only propose it when the subsystem genuinely is not being rewritten, and say so rather than presenting it as a fix.

## Rules

- Two implementations justify a seam. One does not.
- Duplication is the reversible choice when it is unclear whether two things are one thing.
- Fail loud and specifically. Broad exception handling is the most common way agents hide problems.
- Working code is not the counter-argument, and neither is your taste. The form is: *this works; here is what it costs, and here is how you would know I was wrong.*
