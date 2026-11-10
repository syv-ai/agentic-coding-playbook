# Test design families

Four families. Each lists what it looks like, what it costs, what is *not* an instance, the named remedies, and how to find it by hand when the scripts don't cover the language. Read this before judging; the test-auditor gate rules against it too.

## Principles in play

Name the principle a finding violates, but only when it carries the argument; the cost is what persuades.

| Principle | What it says about tests |
|---|---|
| **KISS** | A test needing elaborate setup, many doubles or private access is reporting an interface that asks too much of callers. |
| **DRY** | One piece of knowledge, one home. Near-identical tests across functions usually mean the knowledge is duplicated in production. DRY is about knowledge, not text: two rules that happen to look alike stay apart. |
| **YAGNI** | Code only tests call, parameters only tests pass, and branches only tests take exist for the test, not for a user. It also cuts the other way: no seam for a variant that doesn't exist. |
| **Open/Closed** | When adding the obvious next variant means copying a function and its tests, the design is closed where it varies. |
| **Single Responsibility** | A test that has to stub five collaborators is testing a unit with several reasons to change. |
| **Dependency Inversion** | Patching a module path to replace a collaborator means the unit builds its own dependencies; passing them in removes the patch. |
| **Law of Demeter** | Tests that chain through `a.b.c.return_value` mirror production code that reaches through its collaborators. |
| **Tell, don't ask** | Tests that read private state to check an outcome mean the outcome isn't observable through the interface. |

## 1. Pinning design

The test freezes how the code is built. It passes, but a refactor with no behaviour change breaks it, and a real bug in the collaborators it mocked goes unnoticed.

**Looks like:** patching or `jest.mock`-ing the project's own modules; three or more doubles in one test; assertions only on calls to doubles (`assert_called_once_with`, `toHaveBeenCalledWith`) with no outcome checked; reading `_private` attributes, importing private functions, `as any` or `@ts-expect-error` to reach inside; 20+ lines of arrange before the first assertion.

**Costs:** every structural change breaks tests, so agents learn to change tests with the code, and the suite stops catching drift. Heavy setup also hides which input matters.

**Not an instance:** doubles at real boundaries (network, clock, randomness, filesystem, third-party services, the database when the project's convention is a fake); interaction assertions where the call *is* the contract (an emitted event, an outbound request, a message sent); a long arrange that builds a realistic domain fixture; private access in a test of the module's own internal invariant when the module documents that choice.

**Remedies:**
- *Test fix:* test through the public interface, and assert the outcome a caller can observe instead of the call that produced it. Replace internal mocks with the real collaborator or an in-memory fake.
- *Design fix:* **Dependency Injection** (pass collaborators in rather than constructing them); **Extract a pure core** (Functional Core, Imperative Shell) so the logic needs no doubles; **Extract Class** when the doubles split into two unrelated groups (two responsibilities); **Hide Delegate** when tests chain through collaborators; expose the outcome through the interface when tests read private state to see it.

**By hand:** search tests for the mock API of the language (`gomock`, `mockery`, `testify/mock`, Mockito `mock(`/`verify(`, `Moq`, `mockall`, `double(`/`allow(`) aimed at packages inside the repo; for private access, reflection (`setAccessible`, `reflect`, `unsafe`), `export_test.go` files, `@VisibleForTesting`, `friend` declarations.

## 2. Duplicated behaviour

Tests that are one test with the target renamed: same arrange, same assertions, a different function under test. The tests are rarely the problem; they show production code that implements one behaviour several times.

**Looks like:** `dupes.py` clusters with *different targets*; one assertion block copied across `test_export_csv`, `test_export_tsv`, `test_export_psv`; the same validation tested once per entry point. Also *same target, other literals*: one behaviour checked case by case in copied tests.

**Costs:** a fix to the shared behaviour must land in every copy, production and test, and the copies drift. When they already differ in a way no requirement explains, that drift is the evidence. Check what the copies *don't* test: the one thing that differs between the variants (the delimiter, the currency symbol) is often the only behaviour no test pins, so swapping two variants' implementations would leave the suite green.

**Not an instance:** tests with the same shape that assert different rules (the bodies decide, not the similarity score); two cases where merging would need a flag or a conditional to tell them apart again; Arrange-Act-Assert boilerplate that a framework imposes.

**Remedies:**
- *Test fix:* **Parameterize Test** / table-driven test for one behaviour across inputs or variants (`pytest.mark.parametrize`, `it.each`, a Go table). Delete a copy that adds nothing.
- *Design fix:* **Extract Function** for the shared part; **Parameterize Function** when variants differ by a value (a delimiter, a currency symbol); **Strategy** or a lookup table only when variants differ by behaviour *and* there are three or more. After the design fix, the tests collapse into one parametrised test of the shared behaviour plus one test per real difference.

**Thresholds:** three instances make it a finding; two make it Worth exploring, unless the two have already drifted.

**By hand:** sort test names and look for families that differ by one word; diff two suspect test bodies with the target name replaced (`sed 's/exportCsv/X/'`); count copies of a distinctive assertion string with grep.

## 3. Closed design

The test suite freezes an over-specialised shape, so the obvious next case means copying a function and its tests rather than adding a value. This is the Open/Closed failure seen from the tests, and it needs evidence of variation.

**Looks like:** a variant family in production (`tells.py`: functions in one file differing by one name token, bodies alike), each with its own test; tests that hard-code the only accepted value of something that plainly varies elsewhere in the code (`format="pdf"` is the only path when CSV export exists one module over); one function per customer, per tenant, per provider; a boolean parameter added for one caller, with tests pinning both branches.

**Costs:** every new variant costs a copy plus its tests, and each copy can drift. Tests that enumerate variants turn "add a variant" into "edit the test suite".

**Not an instance:** a single case with no sibling in sight (YAGNI: report nothing); variants that differ in rules, not just values, where a shared abstraction would need flags to separate them again; a deliberate closed set the domain fixes (HTTP methods, days of the week).

**Remedies:**
- *Design fix:* **Parameterize Function** for value-only variation; **Replace Conditional with Polymorphism** or **Strategy** at three or more behaviour variants; **Replace Flag Argument** with two explicit functions when a boolean switches unrelated behaviour; a **registry or lookup table** when variants are data.
- *Test fix (after):* one contract test the variants share, run against each (a parametrised suite), plus a test for each variant's real difference.
- *Cheap step* when there is one sibling: name the seam in the report and leave the code. Don't build it yet.

**By hand:** list function names in a module and look for one-token differences; grep for string switches (`case "pdf"`, `== "csv"`) that recur across files.

## 4. Dead code kept alive

Production code whose only callers are tests. Its tests make it look used, so it survives every cleanup.

**Looks like:** `reach.py` *referenced only from tests*; a parameter only tests pass (`_now=`, `client=` with a default production never overrides); production branches on test mode (`if TESTING`, `NODE_ENV === "test"`, `reset_for_testing`, `ForTesting` names); helpers exported only so a test can import them.

**Costs:** code and tests to maintain for no user; tests that exercise a path production never takes give false confidence about the path it does take.

**Not an instance:** a parameter that injects a real boundary (a clock, a random source, an HTTP client) when production relies on the default; code reached by reflection, string registration, a framework convention, a config file, a CLI entry point or another repository; public API in a library whose consumers live elsewhere (ask).

**Remedies:**
- *Removal:* delete the code and its tests (**Remove Dead Code**). For a test-only parameter that *switches behaviour*, delete it and test the behaviour production uses. For a test-mode branch, replace it with a real seam (**Dependency Injection**) or delete it. For a helper exported only for tests, test through the public function that uses it, then make the helper private or **Inline** it.

**By hand:** Go has `deadcode ./...` (golang.org/x/tools), and `staticcheck` reports unused code (U1000); Rust `cargo +nightly udeps` and the `dead_code` lint with tests excluded; Java/Kotlin IDE inspections or `-Xlint`; otherwise grep each suspect symbol across non-test files, including config, templates and other packages.

## Strength

- **Strong:** verified evidence, a named remedy, and a cost that has occurred or is certain. Per family: *pinning* — a refactor has already broken these tests, or a bug in a mocked collaborator would pass them; *duplicated* and *closed* — three or more copies, or copies that have already drifted; *dead code* — no production reference after checking config, registration and other packages, or a test that is red without anyone noticing.
- **Worth exploring:** verified evidence and a named remedy, but the cost is still in the future (two siblings, not three).
- **Speculative:** say it in one line in the conversation, or leave it out. It does not go in the report.
