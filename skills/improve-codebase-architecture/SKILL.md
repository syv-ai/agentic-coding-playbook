---
name: improve-codebase-architecture
description: Find deepening opportunities in a codebase — refactors that turn shallow modules into deep ones — and present them as a visual HTML report. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**: refactors that turn shallow modules into deep ones, for testability and AI-navigability.

## Glossary

Use these terms exactly — consistent language is the point, so don't drift into "component", "service", "API" or "boundary". Full definitions and principles in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know: types, invariants, error modes, ordering, config.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface. **Deep** = a lot of behaviour behind a small interface; **shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place.
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth. **Locality** — what maintainers get: change, bugs and knowledge concentrated in one place.

Three checks carry most of the weight:

- **Deletion test** — imagine deleting the module. If complexity vanishes, it was a pass-through; if it reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

If the project keeps a domain glossary (e.g. CONTEXT.md) or architecture decision records (ADRs), let them inform the work: domain language names good seams, and ADRs record decisions not to re-litigate. Neither is required.

## 1. Explore

Read the glossary and any ADRs in the area first. Then walk the codebase — delegate to an exploration subagent if your harness has one; otherwise keep the exploration narrow, starting from the area the user named. Explore organically and note where you feel friction:

- Where does understanding one concept mean bouncing between many small modules?
- Where are modules shallow — interface nearly as complex as the implementation?
- Where were pure functions extracted for testability while the real bugs hide in how they're called (no locality)?
- Where do tightly coupled modules leak across their seams?
- What is untested, or hard to test through its current interface?

Apply the deletion test to anything you suspect is shallow.

## 2. Report

Write a self-contained HTML file to the OS temp directory (`$TMPDIR`, falling back to `/tmp`, or `%TEMP%` on Windows) as `architecture-review-<timestamp>.html`, so nothing lands in the repo. Open it (`open` on macOS, `xdg-open` on Linux, `start` on Windows) and give the user the absolute path.

Each candidate gets a card with:

- **Files** involved
- **Problem** — why the current architecture causes friction
- **Solution** — plain-English description of the change
- **Benefits** — in terms of locality and leverage, and how tests improve
- **Before / after diagram** — side by side, illustrating the shallowness and the deepening
- **Recommendation strength** — `Strong`, `Worth exploring` or `Speculative`

End with a **top recommendation**: which candidate to tackle first and why. Scaffold, diagram patterns and styling are in [HTML-REPORT.md](HTML-REPORT.md).

Use the project's domain vocabulary for the domain and LANGUAGE.md vocabulary for the architecture: "the Order intake module", not "the FooBarHandler" or "the Order service".

If a candidate contradicts an ADR, include it only when the friction justifies reopening the decision, and mark it on the card ("contradicts ADR-0007 — worth reopening because…").

Don't propose interfaces yet. Once the file is written, ask which candidate the user wants to explore.

## 3. Grill

When the user picks a candidate, walk the design tree with them: constraints, dependencies, the shape of the deepened module, what sits behind the seam, which tests survive. The **grill-me** skill is a good companion.

Record decisions as they settle:

- **A new name for a deepened module?** If the project keeps a glossary, add the term there; otherwise note it in your write-up.
- **A fuzzy term sharpened?** Update the glossary, if there is one.
- **Candidate rejected for a load-bearing reason?** If the project records ADRs, offer one so future reviews don't re-suggest it. Skip ephemeral reasons ("not now") and self-evident ones.
- **Want alternative interfaces?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
- **How to deepen given the dependencies?** See [DEEPENING.md](DEEPENING.md).
