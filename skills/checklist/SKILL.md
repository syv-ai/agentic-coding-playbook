---
name: checklist
description: Evidence before assertions. Turn any claim, requirement set, or pre-merge gate into a concrete checklist, then verify each item by running the command and reading the output before asserting it passes. Use before claiming work is complete/fixed/passing, before committing or opening a PR, or whenever you need to confirm a set of requirements is actually met.
---

# Checklist

## Overview

Claiming something is done without verifying it is dishonesty, not efficiency. The fix is the same every time: convert the claim into a checklist of falsifiable items, then produce **evidence** for each item before you assert it.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO CLAIM WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the check in this message, you cannot claim it passes. Not "should pass", not "looks right" — passes, with the output to prove it.

## The Gate Function

Run this before stating any status or expressing satisfaction:

```
1. IDENTIFY  What command / inspection proves this item?
2. RUN       Execute the FULL command, fresh and complete.
3. READ      Full output. Check the exit code. Count the failures.
4. VERIFY    Does the output confirm the item?
             - NO  → state the actual status, with the evidence.
             - YES → state the claim, with the evidence.
5. ONLY THEN make the claim.

Skipping any step is lying, not verifying.
```

## Building the checklist

Most claims are really *several* claims. Decompose before verifying:

- **From a requirements doc / PRD / plan** → one checklist item per acceptance criterion. Re-read the source; don't verify from memory.
- **From "it's done"** → list every behavior that "done" implies, then verify each.
- **From a pre-merge gate** → tests, types, lint, build, and a read of the diff — each is its own item.

Write the checklist down. An unwritten checklist is the one you'll skim.

## Common claims and what each actually requires

| Claim | Requires | NOT sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | A previous run, "should pass" |
| Linter clean | Linter output: 0 errors | A partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, "logs look fine" |
| Bug fixed | Original symptom re-tested: passes | Code changed, assumed fixed |
| Regression test works | Red → green cycle verified | Test passes once |
| Requirements met | Line-by-line checklist against the source | Tests passing |
| Delegated work done | VCS diff shows the actual changes | The agent reported "success" |

## Key patterns

**Tests**
```
✅ [run test command] [see: 34/34 pass] → "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression test (red-green)**
```
✅ Write → run (pass) → revert the fix → run (MUST fail) → restore → run (pass)
❌ "I've written a regression test" (without the red-green proof)
```

**Build**
```
✅ [run build] [see: exit 0] → "Build passes"
❌ "Linter passed" (the linter doesn't check compilation)
```

**Requirements**
```
✅ Re-read the plan → checklist each item → verify each → report gaps or completion
❌ "Tests pass, so the phase is complete"
```

**Delegated work**
```
✅ Agent reports success → check the VCS diff → verify the changes → report the actual state
❌ Trust the agent's report
```

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit / push / open a PR without running the checks
- Trusting a subagent's success report without checking the diff
- Relying on a partial or earlier verification
- Thinking "just this once" or "I'm tired, it's fine"
- **Any wording that implies success without having run the check**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification. |
| "I'm confident" | Confidence ≠ evidence. |
| "Just this once" | No exceptions. |
| "The linter passed" | The linter isn't the compiler or the test suite. |
| "The agent said success" | Verify independently against the diff. |
| "I'm tired" | Exhaustion ≠ excuse. |
| "A partial check is enough" | Partial proves nothing about the rest. |
| "Different words, so the rule doesn't apply" | Spirit over letter. |

## When to apply

**ALWAYS before:** any success/completion claim, any expression of satisfaction, committing, opening a PR, marking a task done, moving to the next task, or trusting delegated work.

The rule applies to exact phrases, paraphrases, synonyms, and any implication of success.

## The bottom line

Run the command. Read the output. *Then* make the claim. No shortcuts. This is non-negotiable.
