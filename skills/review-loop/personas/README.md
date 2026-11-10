# Personas

A persona is a short checklist of review moves taken from one maintainer's public review comments. A method reviewer has the same format, but its moves come from a review framework instead of a person. Each move is an instruction a reviewer can follow, tagged with the lens it feeds, and linked to two or three real comments where the maintainer made that move. A reviewer gets only the **Moves** section, with the links removed.

## Pick a panel

`necessity` is on every panel. Add one reviewer for the stack, from the first row that fits:

| Change | Panel |
|---|---|
| Python or TS app, service, stateful or multi-module code | `necessity` + `matklad` |
| Python library or framework with users who read docs | `necessity` + `tiangolo` |
| JS/TS package or library | `necessity` + `sindresorhus` |
| CLI or library with downstream users (any language, Rust included) | `necessity` + `burntsushi` |
| Docs-heavy code (README, docstrings, examples), not alongside `sindresorhus` | add `goldfish-reader` |
| Python/TS change touching two or more packages, with real git history | add `design-families` (default, even under ~300 lines) |
| App change that adds or moves a rule over shared data (permissions, writes, state several paths change), or one built from a plan | add `decisions` |

| Reviewer | Best at | Skip for |
|---|---|---|
| `necessity` | *Method.* The change as a whole: does each addition need to exist (Ponytail's ladder), does it sit where the conventions say, does it widen the public surface | never |
| `matklad` | Layer boundaries, one code path per state change, asserts and types over defensive checks, the bad order of events, test seams | single-file scripts |
| `tiangolo` | What every user must learn, fixing it upstream, methods over parameters, reproducing claims, docs and examples in sync, editor experience | non-Python code (moves 3–4) |
| `sindresorhus` | Moot code, one true description in docs and types, options objects, promise-returning functions that reject, house conventions | non-JS/TS code (moves 4–5) |
| `burntsushi` | Public-API and compatibility traps, cost on the default path, never silently wrong, cross-option interactions, restraint on DRY | apps with no downstream users |
| `goldfish-reader` | *Method.* Paraphrases each unit from its body, then checks names, docstrings and docs against it | code without docs |
| `decisions` | *Method.* Traces findings to the decision behind them: old paths kept beside new ones, rules enforced where the symptom showed, guards no test would miss, checks that can't see the code. Tags each finding with its decision id. Measured once: one finding no `generic` run found, otherwise within their spread | one-file changes with no rule over shared data |
| `design-families` | *Method.* Runs the improve-code-design scripts (tells, files that change together), then names the anti-pattern and remedy | languages other than Python/TS; one-commit histories |
| `generic` | Control: the five lenses only, to measure whether a persona adds anything | real runs |

**Measured.** On 2026-11-10, one real 3,000-line diff, one Sonnet run each, and two runs of `generic` as controls. `necessity` recorded two known fixes neither control found. `matklad` and `decisions` each recorded one finding no control found, and were otherwise within the spread between the two `generic` runs, which shared three of their seven distinct findings. Both controls found a bug that the `necessity` and `matklad` pair missed. One diff is not a verdict: put `generic` on the panel next to a persona and compare `state.py report` to measure again.

Moves the maintainers share (should this exist, use the existing helper, a test must fail without the fix, no drive-by edits, taste isn't a finding) live in `necessity.md` and `reviewer.md`, so no persona repeats them. A dtolnay persona was folded into `necessity` for that reason.

## Why moves, not role-play

The reviewer is never told it *is* the maintainer. A role-play prompt mostly changes the tone of the findings. A checklist changes what the reviewer looks for, and the linked comments show what each move looks like in real code. Each file says it is derived from public reviews, and none claims to speak for the person.

## Adding a persona

1. Pick a maintainer who reviews by hand on public GitHub repos, with a review style unlike the existing personas.
2. Collect at least 100 substantive review comments across 25 or more PRs (`gh api repos/O/R/pulls/N/comments`, `.../reviews`, `.../issues/N/comments`), including PRs that were closed unmerged.
3. Code them into categories you derive from the data, count them, and pick the 6–10 moves that recur and that AI reviewers rarely make. Drop any move `necessity.md` or `reviewer.md` already makes.
4. Write the file: a "Best at" line, a "Derived from public reviews by …" line with the sample size, then **Moves**, each with its lens and 2–3 comment URLs. Paraphrase; link rather than quote at length. Add a row to both tables above.
5. Check that every URL resolves, then run the new persona and `generic` on the same change and compare `state.py report`: a persona earns its place by what it finds that `generic` doesn't (the `only fixed` column).
