---
name: review-tests
description: Critically reviews the design of a test suite — tests that pin a poor production design, near-duplicate tests that reveal duplicated code, tests that freeze an over-specialised design, and tests that keep dead code alive — and reports each with a named remedy and a handoff file. Use after an agent has added or changed tests, in a fresh session to audit a suite, when asked whether tests are any good or test the right thing, or when tests break on every refactor. Not for writing tests (tdd) or for production design with no test angle (improve-code-design).
---

# Review Tests

Tests are the clearest record of how an agent understood the code. A test that mocks four collaborators says the unit does too much; three tests that differ only in the function they call say the production code is written three times; a test for a function nothing else calls says the function shouldn't exist. Read the suite as evidence about the design, and say what it shows.

The job of a test is to catch the codebase drifting from its intended behaviour. A test that fails on every refactor and passes through real bugs is doing the opposite job, however green it is.

## Be ruthless, both ways

A weak finding costs more than a missing one, and so does the opposite over-build. Your default failure is to report too much and to "fix" duplication by proposing an abstraction nobody needs.

- Reporting nothing is a valid result. Say so in one line and stop.
- Every finding completes: *this test works; here is what it costs, here is the remedy, and here is how you would know I was wrong.*
- **Generalise only on evidence of variation.** Two near-identical siblings make a seam worth naming; three make it a finding. One case alone is fine unless a test freezes its only value in a way that blocks a sibling already in sight. No evidence, no generalisation.
- Duplication is cheaper than the wrong abstraction. When it's unclear whether two things are one thing, leaving them apart is the reversible choice.

`$SKILL_DIR` means the directory containing this SKILL.md (`${CLAUDE_SKILL_DIR}` in Claude Code).

## 1. Scope

- **After changes** (the branch or working tree differs from the default branch): review the changed and added tests, plus the production code they exercise. Compare them against the whole suite, since a new test often duplicates an old one. Build the focus list with git when the project uses it: `git diff --name-only $(git merge-base HEAD <default-branch>)` plus `git ls-files --others --exclude-standard`, written one path per line to a temp file.
- **Fresh session, no diff:** the whole suite, or the path the user names. Track which test files you read, and list anything unread as not examined.

Run the project's test command once for the scope, if it has one and it's cheap. A test that fails or is skipped without anyone noticing is a finding in itself: report it in one line and don't develop it. If the runner isn't installed, say so, and check suspicious expectations by evaluating the production call directly when that is a one-liner.

Under ~5 tests or a single test file, skip the scripts and the gate: read them and answer in the conversation.

## 2. Mechanical pass

Run before reading tests; the hits are candidates, not findings.

```
python3 "$SKILL_DIR/scripts/tells.py" ROOT [--focus @focus.txt]
python3 "$SKILL_DIR/scripts/dupes.py" ROOT [--focus @focus.txt]
python3 "$SKILL_DIR/scripts/reach.py" ROOT [--focus @focus.txt]
```

Stdlib only, Python and TypeScript/JavaScript. `tells.py` finds internal mocks, mock-heavy and interaction-only tests, private access, heavy arrange and variant families in production. `dupes.py` clusters near-identical tests and says whether they aim at one target or several. `reach.py` finds production code only tests reach, parameters only tests pass and production code that switches on test mode; when the project already has a dead-code tool (knip, ts-prune, vulture, deadcode), it names it, and that tool's output wins. For other languages, or without `python3`, use the by-hand checks in FAMILIES.md and say the scripts were skipped.

## 3. Read and judge

Read FAMILIES.md before judging. For each test in scope, read it next to the production code it calls and ask what the test claims the code *is*. Then place each candidate in one family:

1. **Pinning design** — the test freezes how the code is built, not what it does.
2. **Duplicated behaviour** — tests that are one test with the target renamed.
3. **Closed design** — tests that freeze an over-specialised shape.
4. **Dead code kept alive** — tests are the only callers.

Give each finding a remedy kind:

- **Test fix:** changes only tests (merge, parametrise, test through the interface, delete a redundant copy).
- **Removal:** deletes production code together with the tests that kept it alive (dead code, test-mode branches, test-only parameters).
- **Design fix:** changes production code, and the test is only the evidence; its test fix waits for it.

Test fixes and removals are mechanical enough to hand straight to an executor; design fixes need a design conversation first. Name the remedy (Extract Function, Parameterize Function, Strategy, Dependency Injection, Inline, delete). "Refactor this" is not a remedy.

Weak assertions in general (tautologies, change detectors) belong to the **tdd** skill's test guidance; mention them in one line only when they sit inside a finding.

## 4. Gate

You can't reliably gate your own findings. Hand the drafted list to the **test-auditor** subagent, with prompt `$SKILL_DIR/subagents/test-auditor.md`:

- **Named agent registered** (Claude Code and Cursor plugins): "Use the test-auditor subagent on these candidates: `<list>`. Families: `$SKILL_DIR/FAMILIES.md`."
- **Other harnesses with subagents:** start one whose instructions are the text below that file's frontmatter.
- **No subagents:** run it in a fresh chat and paste the verdicts back.

Give the auditor read-only tools where the harness lets you. Each candidate goes in with its claim, its evidence (file:line, counts) and its remedy; script hits you set aside while judging don't go in, but count them as "set aside" in the tally. It returns KEEP, DOWNGRADE or DROP with evidence. Overturn a drop only where its evidence is wrong, and say so.

## 5. Report

Read REPORT.md before writing. Each kept finding gets an ID (T1, T2…) that both outputs share.

- **No findings:** say so in the conversation, with the coverage. Write nothing.
- **One or more:** write the Markdown handoff where the project's instructions file (AGENTS.md or CLAUDE.md) says plans or reviews go, otherwise in the OS temp directory, and give the full absolute path. Test fixes and removals are written as tasks **executing-plans** can run; design fixes as leads **improve-code-design** can take as its scope.
- **Two or more Strong:** also the HTML page, published where the harness can (Claude Code's `Artifact` tool), otherwise a local file.

Make no edits to tests or production code during the review.

## 6. Walk through it

Ask which findings to act on, and walk each one: what varies and what doesn't, which callers move, what the tests look like afterwards, what must not break. The **grill-me** skill is a good companion. Then hand off: test fixes and removals to **executing-plans** with the handoff file, design leads to **improve-code-design** on the listed paths, or fix a small one in place with the **tdd** loop.

## Gotchas

- A mock of a real boundary (network, clock, randomness, filesystem, third-party API) is correct. Only internal collaborators count as pinning design.
- An interaction assertion is right when the call is the contract: an emitted event, an outbound request, a message sent.
- Similar shape is not the same behaviour. Read both bodies before calling tests duplicates; parametrised-looking tests for different rules stay apart.
- "Only tests reference it" misses reflection, string registration, config files, other packages and public API. Check before calling it dead.
- Don't propose a plugin system for two cases. The remedy for two siblings is usually Parameterize Function, not Strategy.

---

FAMILIES.md · REPORT.md · subagents/test-auditor.md · scripts/
