# Report

Two outputs share one set of finding IDs (T1, T2…): a Markdown handoff that agents act on, and, at two or more Strong findings, an HTML page for the person. Write nothing when there are no findings, and don't build either to justify the review.

## Markdown handoff

Written whenever at least one finding survives the gate. Location: where the project's instructions file says plans or reviews go; otherwise the OS temp directory as `review-tests-<repo>-<YYYY-MM-DD>.md`. Give the user the resolved absolute path (not `$TMPDIR/…`, `~` or a relative path). Don't commit it unless asked.

It has to work in a fresh session with no memory of the review, so every task names exact files, lines and test names, and says how to verify.

```markdown
# Test review: <repo or area>

**Scope:** <diff against <base> | whole suite | <path>> · <N> test files read · not examined: <list or "none">
**Scripts:** tells / dupes / reach <ran | skipped: reason> · dead-code tool: <name or "none">
**Gate:** <set aside> script hits set aside while judging · <drafted> drafted, <kept> kept, <downgraded> downgraded, <dropped> dropped
**Suite:** <ran: command, result | could not run: reason>

## Test fixes

Tasks for **executing-plans**. Each changes tests only; run the project's test command after each.

### T1: <title in the codebase's own nouns>  (<family> · <Strong | Worth exploring>)

- [ ] **Change:** <exact edit: which tests to merge/delete/rewrite, into what>
- **Files:** `tests/test_export.py:9-31`
- **Why:** <the cost, one or two sentences>
- **Keep:** <behaviour the new test must still pin>
- **Verify:** <command>; <what should still fail if the behaviour breaks — name the mutation>
- **Wrong if:** <the concrete evidence that would show this finding was mistaken>

## Removals

Tasks for **executing-plans**. Each deletes production code together with the tests that kept it alive. Same fields as a test fix; **Wrong if** names the reference that would prove it is used (another package, a string registration, a config file).

### T3: <title>  (Dead code kept alive · <strength>)

- [ ] **Change:** <the symbol, branch or parameter to delete, and the tests that go with it>
- **Files:** …
- **Why:** …
- **Keep:** …
- **Verify:** <grep that should come back empty>; <test command>
- **Wrong if:** …

## Design leads

For **improve-code-design** (run it on the listed paths) or a plan. The tests are evidence only; fix the design first, then the tests listed under **Then**.

### T2: <title>  (<family> · <strength>)

- **Paths:** `shop/export.py`, `tests/test_export.py`
- **Evidence:** <what the tests show, with file:line and counts>
- **Smell → remedy:** <named smell> → <named remedy>
- **Principle:** <DRY | YAGNI | OCP | … — only if it carries the argument>
- **Remedy cost:** <callers touched, what could break>
- **Then:** <the test fix that follows, e.g. collapse T2's tests into one parametrised test>
- **Wrong if:** <concrete evidence>

## Not examined

<files or areas skipped, and why>
```

Order findings within each section by strength, then by cost. Leave out a section with nothing in it.

## HTML page

Only at two or more Strong findings, named like the handoff (`review-tests-<repo>-<YYYY-MM-DD>.html`) when written locally. One self-contained page with the same findings and IDs, for reading rather than acting. Publish it where the harness can (in Claude Code, the `Artifact` tool; load its design guidance first), which keeps it private until the user shares it; publishing uploads the quoted code, so say so once. Otherwise write a self-contained HTML file to the OS temp directory, open it (`open` / `xdg-open` / `start ""`) and give the full absolute path. A published page is content only (the publisher adds the document skeleton); a local file is a complete HTML document.

Contract:

- **Nothing from the network:** inline CSS, system font stacks, inline `<svg>` for any diagram.
- **Title:** two to four words, such as "Checkout test review".
- **Both themes:** colour tokens on `:root`, redefined under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and again under `:root[data-theme="dark"]`; `body` gets an explicit background.
- **Phone width:** a 16px side gutter; code and before/after pairs scroll inside `overflow-x: auto` containers.

Structure:

```
header            repo · date · scope (diff or suite)
section#coverage  files read, not examined, scripts run, the gate tally
section#findings  one card per finding
section#next      the order to tackle them in, and which handoff each goes to
```

Each card: the ID and a title in the codebase's nouns; the family and remedy kind as small monospace labels; strength shown by a left stripe (solid for Strong, faded for Worth exploring); the evidence, with the test excerpt and the production excerpt side by side when they make the point together; the cost; the named remedy and what it costs; *wrong if*. Use one accent colour for strength and one warning tone for the cost, and nothing else colour-coded.

No agent instructions on the page. The handoff file carries those.
