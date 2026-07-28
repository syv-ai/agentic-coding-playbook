# Language

Term contract. Use these exactly.

## Condition

**Complexity** — anything that makes a system hard to understand or change. Essential is inherent in the problem; accidental comes from how it was solved. Only accidental is in scope.

**Creep** — decay arriving one acceptable change at a time, visible only in aggregate. Avoid: rot, cruft.

**Mimicry** — inferring the local standard from surrounding code and matching it, including when it is bad. Agents do this by construction.

**Technical debt** — the gap between the code and current best understanding of the domain. Not a synonym for mess. Both meanings circulate; say which you mean or use a family name.

**Blast radius** — how much can break from changing one thing.

**Batch size** — how much change ships in one unit of review.

**Seam** — a place where behaviour can be altered without editing code in place, because an implementation can be substituted. Avoid: boundary. Shared with `improve-codebase-architecture`, same definition.

**Coupling / cohesion** — how much a module depends on another's internals; how much one module's contents belong together.

**Module** — anything with an interface and an implementation: function, class, package, service.

## Families

Grouped by cause. Definitions and examples in [ANTI-PATTERNS.md](ANTI-PATTERNS.md).

| Family | Cause |
|---|---|
| Bloat | Added to the code that was already open |
| Rigidity | Wired behaviour in place instead of leaving a seam |
| Over-build | Built for requirements that do not exist |
| Make-it-work | Made the symptom disappear where it surfaced |
| Churn | Each transformation written as its own pass over the data |
| Structure | Many changes, no single diff |

## Principles

Applied at module scale. See [PRINCIPLES.md](PRINCIPLES.md).

| Principle | Operational form |
|---|---|
| Single Responsibility | One reason to change |
| Open/Closed | Extend without editing working code |
| Liskov Substitution | Any implementation usable where its interface is expected |
| Interface Segregation | Callers do not depend on what they do not use |
| Dependency Inversion | The caller owns the abstraction |
| DRY | One authoritative representation per piece of knowledge, not of text |
| YAGNI | Build for needs that exist |
| KISS | Fewer moving parts |
| Law of Demeter | Talk to immediate collaborators |
| Least Astonishment | Behaviour matches the reader's model. Alias number of WTFs in the codebase.|

DRY and YAGNI are one judgement. Duplication is cheap to fix; the wrong abstraction is not.

## Remedies

See [PATTERNS.md](PATTERNS.md). Strategy · Adapter · Facade · Factory Method · Observer · Command · Builder · Template Method. Refactorings: Extract Method, Extract Class, Replace Conditional with Polymorphism, Replace Primitive with Object, Introduce Parameter Object.

## Rules

- Two implementations justify a seam. One does not.
- Duplication is the reversible choice when it is unclear whether two things are one thing.
- Fail loud and specifically. Broad exception handling is the most common way agents hide problems.
- Working code is not the counter-argument, and neither is your taste. The form is: *this works; here is what it costs, and here is how you would know.*
