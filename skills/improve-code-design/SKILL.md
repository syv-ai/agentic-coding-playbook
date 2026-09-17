---
name: improve-code-design
description: Find named design problems in a codebase — the anti-patterns coding agents produce most — and name the remedy for each. Use for a design review, when asked whether code violates SOLID/DRY/YAGNI, when assessing agent-generated code, when someone says changing one thing keeps breaking another, or when anyone shares more than one file and asks for an opinion on it. Most requests for a code opinion are design reviews in disguise; reach for this even when the word "design" is absent. Not for single-function bug hunts, formatting, or performance work.
---

# Improve Code Design

Name the anti-pattern, name what it costs, name the remedy. Names are the product: "extract this into a Strategy" is actionable, "clean this up" is not.

You already know the theory. What you don't know is which of it applies here, and your default failure is to report too much. The reference files exist to constrain output, not to teach.

**In scope:** does this code violate a named principle, and is there a named remedy? **Out:** bugs (flag briefly, don't develop), style, unconventional-but-clear naming. Misleading names are in.

## Be ruthless

A weak candidate costs more than a missing one: it teaches the reader the review pads, and the strong findings get skimmed with the rest.

- Reporting nothing is a valid result. Say so plainly and stop — NEGATIVES.md shows what that looks like.
- Every candidate completes this sentence or is dropped: *this works; here is what it costs, and here is how you would know I was wrong.*
- Lead with the uncomfortable finding, and argue from impact and evidence rather than seniority or taste.
- The failure modes in FAMILIES.md apply to you while you run this skill: you serve the immediate ask, imitate what you read first, and don't volunteer breadth nobody requested.

`$SKILL_DIR` below means the directory containing this SKILL.md (`${CLAUDE_SKILL_DIR}` in Claude Code). A bare `scripts/...` path resolves against the repo under review and won't be found.

## 1. Calibrate

**Comment trust.** Sample three or four comments that make a factual claim about behaviour and check them against the code. State the mode in one line at the top of the review:

- **Trusted** — comments track the code, name rejected alternatives, cite tests. Gate rule 5 applies.
- **Untrusted** — comments describe intent rather than behaviour, or one contradicts its code. Rule 5 is void; verify claims yourself and say you did.

Ask at most one clarifying question, and only if the answer changes a severity ("how many processes does this run in?"). Under ~50 lines or a single self-contained function there is no structure to review — answer directly instead.

## 2. Mechanical pass

Run these before reading code. They surface candidates faster and more completely than grepping.

```
python3 "$SKILL_DIR/scripts/tells.py" PATH [--lang py|ts|both]
python3 "$SKILL_DIR/scripts/cochange.py" PATH [--since 2y]
```

Stdlib only. `tells.py` finds duplicate predicates across modules, getters that manufacture defaults, cleanup verbs without a context manager, constant tables keyed by another module's type ids, sibling entry points sharing an input type, and TypeScript boundary tells. `cochange.py` ranks files that change together but live apart — the Structure family, measured. If `python3` isn't available, say the mechanical pass was skipped rather than substituting grep. Output is candidates; everything still goes through the gate.

## 3. Enumerate

Don't delegate "find design problems in X". It's open-ended search with no stopping criterion, so a subagent returns the first real things it sees at low recall, and better prompting doesn't fix that task shape. Delegate enumeration instead, and keep judgment here, because the Structure family is only visible with every unit in one context.

```
python3 "$SKILL_DIR/scripts/inventory.py" plan PATH --batch 8
```

Hand each batch to the **design-inventory** subagent. It returns a factual table per file and evaluates nothing. Pass the batch and nothing else; adding "and note anything problematic" reintroduces the satisficing this step removes. How to run it depends on the harness:

- **Claude Code (plugin install):** "Use the design-inventory subagent on batch 3: `<paths>`".
- **Other harnesses with subagents:** start a subagent whose instructions are the contents of `$SKILL_DIR/subagents/design-inventory.md`, and give it the batch.
- **No subagents:** run that prompt in a fresh chat per batch and paste the tables back, rather than doing the work inline here.

Below ~15 files, skip delegation and read them yourself. Then prove coverage:

```
python3 "$SKILL_DIR/scripts/inventory.py" check PATH --covered covered.txt
```

Anything uncovered goes in the report as not examined. A tally that reads as complete when it isn't is worse than a missing candidate.

In Claude Code, if dynamic workflows are available and the user has opted in, the batch fan-out and the audit below can run as one workflow; the steps stay the same.

## 4. Judge

Read FAMILIES.md, then apply three tests in order:

1. **Reasons to change** — list the kinds of requirement that would force an edit. Two unrelated kinds means two jobs.
2. **Two implementations** — before proposing a seam, does something actually vary? A conditional that hasn't gained a branch in two years is a conditional. Proposing a Strategy for it is the over-build you're meant to be naming.
3. **Interface cost** — what must a caller understand, versus what the module does for them? A signature as complicated as its body is a wrapper with a name.

## 5. Gate

You can't reliably gate your own findings — by now each one has an advocate. Hand the drafted list to the **design-auditor** subagent (same three routes as above, with `$SKILL_DIR/subagents/design-auditor.md`):

> Use the design-auditor subagent on these candidates: `<list>`. Comment mode: `<Trusted|Untrusted>`. Worked suppressions: `$SKILL_DIR/NEGATIVES.md`. Language list: `$SKILL_DIR/LANGUAGE.md`.

It verifies each claim and returns KEEP / DOWNGRADE / DROP with evidence. Then read the drops: overturn one only where the evidence doesn't support the cited rule (a count that missed a directory, a test that asserts something else), and say that you did and why. Don't overturn because you liked the finding.

The eight rules, so you can draft against them. The auditor prompt owns their definitions and verification steps; if the two disagree, it wins.

1. A test pins the coupling · 2. There is no better home · 3. Fewer than three instances · 4. The metric is size · 5. The surprise is justified *(Trusted only)* · 6. It is a data carrier · 7. The fix costs more than the defect · 8. It cannot say how it would know it was wrong

## 6. Report

Two or more strong candidates → write the report. Fewer → say it in the conversation and stop. Never build the report to justify the review.

The report is one self-contained page: published as an artifact where the harness can, otherwise a local HTML file whose full absolute path you give the user. Delivery, contract, palette and card structure are in REPORT.md. Every candidate carries: a title in the codebase's own nouns · family · standard name · what it costs · the named remedy · what the remedy costs and how you'd know it was wrong. Coverage and the gate tally (drafted, kept, downgraded, dropped) go above the findings. No agent instructions in the report, and no refactoring yet.

## 7. Grill

Ask which candidate to work through, then walk the tree: what varies and what doesn't, which callers are affected, what the tests look like afterwards, what the remedy costs. The **grill-me** skill is a good companion.

Duplication is cheaper than the wrong abstraction. When it's unclear whether two things are one thing, leaving them apart is the reversible choice — say so even if you proposed merging them.

The instruction for a coding agent comes out of this conversation, not the report. Write it once decisions are settled: what to change, what to leave, what must not break.

---

FAMILIES.md · LANGUAGE.md · NEGATIVES.md · REPORT.md · subagents/

External: [refactoring.guru](https://refactoring.guru/refactoring/smells) · [lawsofsoftwareengineering.com](https://lawsofsoftwareengineering.com/)
