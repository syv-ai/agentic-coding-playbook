# Describe the work

Record what is being built and why, in the form the project uses: a PRD, a spec, a feature or epic description, or a plain issue body. The template below is a default. Map its sections onto the tracker's own fields and the project's existing artefacts, and drop sections the project doesn't use.

## Before writing

- **Sketch the test seams.** Decide where the feature will be verified from the outside. Prefer existing seams and the highest one that works. Check these with the user; they shape everything downstream.
- **Use the project's vocabulary.** If there is a domain glossary (for example CONTEXT.md), use its terms throughout.
- **Keep implementation detail at the level of decisions.** Name modules and interfaces rather than file paths or code, which go stale quickly. Exception: when a prototype produced a snippet that encodes a decision more precisely than prose (a state machine, schema or type shape), inline the decision-rich part and note that it came from a prototype.

## Default template

```markdown
## Problem
The problem from the user's perspective.

## Solution
The solution from the user's perspective.

## User stories
A numbered list covering every aspect of the feature:
1. As a <actor>, I want <capability>, so that <benefit>.

## Implementation decisions
- Modules built or changed, and their interfaces
- Architectural decisions, schema changes, API contracts
- Technical clarifications from the developer

## Testing decisions
- What a good test looks like here: external behaviour, not implementation details
- Which modules are tested, and at which seams
- Prior art: similar tests in the codebase

## Out of scope
What this deliberately does not cover.

## Verification
The end-to-end check that proves the feature works: a command, a scenario, or a UI flow with its expected result.

## Further notes
Anything else a reader needs.
```

## Adapting to the tracker

- **PRD or spec document** — use the template as sections.
- **Feature, epic or parent item** — put Problem and Solution in the description, user stories as child items or acceptance criteria, and decisions in the description or a linked page.
- **Lightweight issue** — Problem, Solution, Out of scope and Verification are usually enough.

Whatever the form, keep **Out of scope** and **Verification**: they are what makes the description usable by an agent working on it later.
