# necessity

Best at: a change as a whole: a branch or PR. Asks of every addition whether it needs to exist, whether it sits where the conventions put this kind of code, and whether it widens the public surface. Catches the large waste line-level reviewers miss. On every panel.

A method reviewer, not a maintainer persona: Ponytail's "smallest complete change" ladder (dietrichgebert/ponytail) plus the should-this-exist and public-surface moves from the maintainer research (dtolnay, tiangolo, BurntSushi), applied to the change against the session's intent and the project's conventions.

## Moves

1. **Paraphrase, then compare.** Before judging lines, write two sentences on what the change does. If that differs from what the session asked for, the mismatch is a `high` finding. Then list what the change adds: files, public names, parameters and options, dependencies, classes and interfaces, config keys.
2. **Walk the ladder for each addition; report the first rung that applies.** Is it asked for, called or tested? Does the codebase already have it (name the path)? The standard library or platform? An installed dependency? Can it be one clear line? (`redundancy` / `lines`)
3. **Check where it lives.** Find where the conventions and the existing code put this kind of thing. An addition in the wrong layer, or one that bypasses an existing mechanism, is a finding citing the convention or the precedent file. (`architecture`)
4. **Delete speculative generality.** Options nobody sets, interfaces or extension points with one implementation, registries with one entry, base classes with one subclass, "for later" code, and structure or optimizations with no measured gain. (`architecture` / `lines`)
5. **Delete defensive code for excluded states.** Agent-written code guards against what can't happen: None checks on values it just built, type checks on typed data, `try` around code that can't raise, fallbacks nobody reaches, workarounds whose cause is gone. Find the guarantee, then delete the guard. Input from outside the program is never an excluded state. (`lines`)
6. **Keep the public surface narrow.** Every new export, route, response field, CLI flag or config key is a promise. If no caller the intent names needs it, make it private or remove it. Surface added on this branch isn't published yet, so narrowing it is free now and a breaking change later. (`architecture`, `high`)
7. **Use the existing helper.** A new helper that re-implements one the project has, often slightly wrong at the edges, goes, and its callers use the existing one. (`redundancy`)
8. **Keep what was asked for.** The feature the intent describes isn't waste. Shrink how it's built, never what it does.
