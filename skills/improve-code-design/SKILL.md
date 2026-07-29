---
name: improve-code-design
description: Find named design problems in a codebase — the anti-patterns coding agents produce most — and name the remedy for each. Use for a design review, when asked whether code violates SOLID/DRY/YAGNI, when assessing agent-generated code, when someone says changing one thing keeps breaking another, or when anyone shares more than one file and asks for an opinion on it. Most requests for a code opinion are design reviews in disguise; reach for this even when the word "design" is absent. Not for single-function bug hunts, formatting, or performance work.
---

# Improve Code Design

Name the anti-pattern, name what it costs, name the remedy. Names are the product: "extract this into a Strategy" is actionable, "clean this up" is not.

You already know the theory. What you do not know is which of it applies here, and your default failure is to report too much. The reference files exist to constrain output, not to teach.

## Scope

**In:** does this code violate a named principle, and is there a named remedy?

**Out:** bugs (flag briefly, don't develop), style, unconventional-but-clear naming. Misleading names are in.

## Be ruthless

A weak candidate costs more than a missing one — it teaches the reader this skill pads, and the strong candidates get skimmed with the rest.

- **Reporting nothing is a valid result.** Say so plainly and stop. See NEGATIVES.md for what that looks like.
- Every candidate must complete this sentence or it is dropped: *this works; here is what it costs, and here is how you would know I was wrong.*
- Lead with the uncomfortable finding. Hedging to be agreeable makes the report worthless.
- Argue from impact and evidence, never from seniority or taste.

The failure modes in FAMILIES.md apply to **you** while you run this skill. You serve the immediate ask, you imitate what you read first, and you do not volunteer breadth nobody requested.

---

## 1. Calibrate

**Comment trust.** Several gate rules below defer to what comments claim. Sample three or four comments making a factual claim about behaviour and check them against the code. Then pick a mode and state it in one line at the top of the review:

- **Trusted** — comments track the code, name rejected alternatives, cite tests. The "justified surprise" gate rule applies in full.
- **Untrusted** — comments describe intent rather than behaviour, or one contradicts its code. That gate rule is void; verify each claim yourself and say you did.

**One clarifying question, only if it changes a severity.** "How many processes does this run in?" turns a footnote into an outage. "What's your testing philosophy?" changes nothing — don't ask it.

**Stop if there is nothing to review.** Under ~50 lines or a single self-contained function has no structure. Answer directly instead.

## 2. Mechanical pass

Run these before reading code. They are faster and more complete than grepping, and they surface candidates you would otherwise have to notice.

```
python3 "${CLAUDE_PLUGIN_ROOT}/skills/improve-code-design/scripts/tells.py" PATH [--lang py|ts|both]
python3 "${CLAUDE_PLUGIN_ROOT}/skills/improve-code-design/scripts/cochange.py" PATH [--since 2y]
```

`${CLAUDE_PLUGIN_ROOT}` resolves to the installed plugin directory. A bare `scripts/...` path resolves against the repo under review and will not be found. If the variable is unset — the skill is being used standalone rather than from a plugin — fall back to the path relative to this file.

Stdlib only, no third-party imports. `python3` is the portable spelling; `python` is absent on many machines. If neither resolves, say the mechanical pass was skipped rather than substituting grep and calling it equivalent.

`tells.py` finds duplicate predicate names across modules, getters that manufacture a default, cleanup verbs with no context manager, constant tables keyed by another module's type ids, sibling entry points sharing an input type, and the TypeScript boundary tells. `cochange.py` ranks files that change together but live apart — the Structure family, measured rather than guessed.

Output is candidates. Everything still goes through the gate.

## 3. Enumerate, then judge

**Do not delegate "find design problems in X."** That is open-ended search with no stopping criterion. A subagent returns the first real things it sees, and nothing in the task can tell it recall was 20%. This has been tested and it fails exactly this way. Better prompting does not fix a task shape that rewards satisficing.

Delegate enumeration instead. Judgment stays with you, because the Structure family is only visible when every unit is in one context.

```
python3 "${CLAUDE_PLUGIN_ROOT}/skills/improve-code-design/scripts/inventory.py" plan PATH --batch 8
```

Hand one batch per invocation of the **`design-inventory`** subagent. Its system prompt is frozen: it returns a factual table — what each file owns, what would force an edit, what it reaches into, its public surface, and a fixed checklist of observations — and evaluates nothing. Do not paraphrase its instructions or add "and note anything problematic you see" to the request. That single addition reintroduces the satisficing this protocol exists to remove.

Invoke it explicitly, one batch at a time:

> Use the design-inventory subagent on batch 3: `<paths>`

Judgment stays with you. The Structure family is only visible with every table in one context, which is here and not there.

Then prove coverage rather than asserting it:

```
python3 "${CLAUDE_PLUGIN_ROOT}/skills/improve-code-design/scripts/inventory.py" check PATH --covered covered.txt
```

Anything not covered goes in the report as not examined. **A tally that reads as complete when it is not is worse than a missing candidate.**

Below ~15 files, skip delegation and read them yourself.

## 4. Judge

Read FAMILIES.md. Apply three tests explicitly, in this order:

1. **Reasons to change** — list the kinds of requirement that would force an edit here. Two unrelated kinds means two jobs.
2. **Two implementations** — before proposing any seam, does something actually vary? A conditional that has not gained a branch in two years is a conditional, not a violation. Proposing a Strategy for it is the over-build you are supposed to be naming.
3. **Interface cost** — what must a caller understand to use this correctly, versus what it does for them? A module whose signature is as complicated as its body is a wrapper with a name. This is Over-build wearing an abstraction.

## 5. Gate

Draft your candidates, then hand the list to the **`design-auditor`** subagent. It applies the eight rules below against candidates it did not author, verifies each rule rather than accepting your claims, and returns KEEP / DOWNGRADE / DROP with evidence.

> Use the design-auditor subagent on these candidates: `<list>`. Comment mode: `<Trusted|Untrusted>`. Worked suppressions: `${CLAUDE_PLUGIN_ROOT}/skills/improve-code-design/NEGATIVES.md`.

You cannot gate your own findings reliably. You wrote them, you spent effort on them, and by this point every one of them has an advocate. That is the whole reason the auditor is a separate context.

**Then read the drops.** You are the appeal court and it costs nothing, because both the candidate and the evidence are already in front of you. Overturn a drop where the evidence does not actually support the rule cited — a "fewer than three instances" drop backed by a count that missed a directory, a "test pins the coupling" drop citing a test that asserts something else. State that you overturned it and why. Do not overturn on the grounds that you liked the finding.

The eight rules, so you know what to draft against. **The auditor owns their definitions** — `agents/design-auditor.md` holds the full text and the verification action for each. If this list and that file ever disagree, that file wins.

1. A test pins the coupling
2. There is no better home
3. Fewer than three instances
4. The metric is size
5. The surprise is justified *(Trusted mode only)*
6. It is a data carrier
7. The fix costs more than the defect
8. It cannot say how it would know it was wrong

A candidate you cannot defend against all eight is not worth drafting. Kill it yourself and save the round trip.

## 6. Report

Two or more strong candidates → publish the artifact. Fewer → say it in the conversation and stop. Never build the artifact to justify the review.

The report is a **Claude artifact**, published with the `Artifact` tool: load the `artifact-design` skill, write the page to your scratchpad, publish, and give the user the URL. Full contract — the tag, CSP, theming and layout rules, the token palette, and what goes on a card — in REPORT.md. Mention once that publishing uploads the quoted source to claude.ai; it is private until shared.

Every candidate carries: title in the codebase's own nouns · family · standard name · what it costs · the remedy, named · what the remedy costs and how you would know it was the wrong call.

Coverage and the gate tally go above the findings. Drafted, kept, downgraded, dropped — a reader who can see eleven candidates become three trusts the three.

Do not write agent instructions in the report. Do not start refactoring.

## 7. Grill

Ask which candidate to work through, then walk the tree: what varies and what does not, which callers are affected, what the tests look like afterwards, what the remedy costs. The **grill-me** skill is a good companion.

Duplication is cheaper than the wrong abstraction. When it is unclear whether two things are one thing, leaving them apart is the reversible choice — say so even if you proposed merging them.

**The instruction for a coding agent is the output of this conversation, not of the report.** Write it once the design decisions are settled: what to change, what to leave, what must not break.

---

FAMILIES.md · LANGUAGE.md · NEGATIVES.md · REPORT.md

External: [refactoring.guru](https://refactoring.guru/refactoring/smells) · [lawsofsoftwareengineering.com](https://lawsofsoftwareengineering.com/) (`api.json`, `llms.txt` for machine reading)
