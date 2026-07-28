---
name: improve-code-design
description: Find named design problems in a codebase — the anti-patterns coding agents produce most — and the principle and pattern that fix each one. Presents candidates as a visual HTML report, then works one through with the user. Use for a design review, when asking whether code violates SOLID/DRY/YAGNI, or when assessing agent-generated code.
---

# Improve Code Design

Find code that violates a named principle, name the anti-pattern, name the remedy. Names are the product: "extract this into a Strategy" is actionable, "clean this up" is not.

Language-agnostic. Examples in the reference files are Python.

## Scope

In scope: **does this code violate a named principle, and is there a named remedy?**

Out of scope:

- **Module depth** — leverage at the interface, the deletion test, where the seam belongs. That is the sibling skill `improve-codebase-architecture`. If a finding's real content is "this module is shallow", hand it over.
- **Bugs.** A violation is not a defect (but flag briefly if you spot one)
- **Style.** A linter's job. Misleading names are in scope; unconventional ones are not.

## Be ruthless

A weak candidate costs more than a missing one — it teaches the user this skill pads, and the strong candidates get skimmed too.

- Report nothing rather than pad. "Nothing here worth changing" is a valid result.
- Drop any candidate that cannot complete: *this works; here is what it costs, and here is how you would know.*
- Lead with the uncomfortable finding. Hedging to be agreeable makes the report worthless.
- Argue from impact and evidence. Never from seniority or taste.

## Process

### 1. Explore

Use the Agent tool with `subagent_type=Explore` if the domain is large. Prefer several narrow agents over one broad one — one per area or per family. A single agent told to find everything returns the first few things it sees. Do not assume your own coverage is complete. The failure modes in [ANTI-PATTERNS.md](ANTI-PATTERNS.md) apply to you while you run this skill: As a coding agent, your weak points are that you serve the immediate ask, you imitate what you read first and you do not volunteer breadth nobody requested.

- Report what you did not examine: untouched directories, generated code, anything skipped.
- Structure findings need cross-module comparison. Without it, report that family unassessed rather than zero.
- Verify before claiming. "Called from twelve places" needs a search, not an impression.

Explore organically. Note where you would hesitate to change something, then work out which family explains it.

Two tests to apply explicitly:

- **Reasons to change** (SRP): list the kinds of requirement that would force an edit here. Two unrelated kinds means two jobs.
- **Two implementations** (before proposing any seam): does something actually vary? Proposing a Strategy for a conditional that never gained a branch is over-build — the failure you are supposed to be naming.

Reference: [ANTI-PATTERNS.md](ANTI-PATTERNS.md) · [PRINCIPLES.md](PRINCIPLES.md) · [PATTERNS.md](PATTERNS.md) · [LANGUAGE.md](LANGUAGE.md)

### 2. Report

Write a self-contained HTML file to the OS temp dir so nothing lands in the repo. Resolve from `$TMPDIR`, falling back to `/tmp` or `%TEMP%`, as `<tmpdir>/design-review-<timestamp>.html`. Open it (`xdg-open` / `open` / `start`) and give the user the absolute path.

Format in [HTML-REPORT.md](HTML-REPORT.md).

Do not write agent instructions in the report. Do not start refactoring. Ask which candidate the user wants to work through.

### 3. Grilling loop

Once the user picks one, drop into a grilling conversation (the **grill-me** skill is a good companion). Walk the tree: what varies and what does not, which callers are affected, what the tests look like afterwards, what the remedy costs.

Duplication is cheaper than the wrong abstraction. When it is unclear whether two things are one thing, leaving them apart is the reversible choice — say so even if you proposed merging them.

The instruction for a coding agent is the output of this conversation, not of the report. Write it once the design decisions are settled: what to change, what to leave, what must not break.

## External reference

- [refactoring.guru](https://refactoring.guru/refactoring/smells) — smell and pattern catalogues.
- [lawsofsoftwareengineering.com](https://lawsofsoftwareengineering.com/) — 56 laws, with `api.json` and `llms.txt` for machine reading.
