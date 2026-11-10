---
name: review-loop
description: Reviews and fixes a branch in rounds before a pull request. Fresh reviewer subagents, each following a persona's checklist of review moves distilled from real maintainers' public reviews, check the change against the session's intent and the project's conventions for bugs, unneeded or misplaced code and duplication; a gate fact-checks their findings; the loop ends when a round finds nothing new, then writes the PR body. Use when a branch is about to become a PR, or when asked to review-and-fix a branch until it's clean.
disable-model-invocation: true
argument-hint: "[base branch or paths] [--personas a,b] [--max-rounds N] [--rereview]"
---

# Review loop

AI reviewers always find *something*, so a script decides when to stop: a round is clean when every finding is a repeat, below the bar or dropped by the gate, and every check passes.

`$SKILL_DIR` is this file's directory (`${CLAUDE_SKILL_DIR}` in Claude Code). `state.py` means `python3 "$SKILL_DIR/scripts/state.py"`, run from the repository root. It needs only Python 3 and git.

## How it works

- **Fresh reviewers.** Each round, every reviewer is a new subagent that gets only a brief: the intent, the change, the conventions and one persona's moves. A reviewer that watched the fixes happen grades them generously.
- **Personas are checklists, not role-play.** `personas/` holds review moves distilled from maintainers' public review history (matklad, tiangolo, sindresorhus, BurntSushi) and from review methods (`necessity`, `goldfish-reader`, `decisions`, `design-families`). `personas/README.md` says which to pick.
- **A gate.** Fresh reviewers over-report, and the agent that fixes findings can't fairly judge them. A separate subagent rules on each new finding with the rules in `gate.md`.
- **A ledger.** `state.py` records every finding, drops repeats, caps each reviewer at its five most severe distinct findings, and later rounds review only the previous round's fixes.

## Unattended

When the caller says to run unattended or the user asks not to be asked, nothing below waits for an answer:

- **Branch:** uncommitted work is committed first as `wip: work under review`.
- **Checks:** a red baseline gets one repair attempt (the failing check is part of the change), then init; still red, `state.py stop "red baseline: <cmd>"`.
- **No `/goal` line.** Run rounds back to back.
- **Owner findings** stay `wontfix "needs owner: …"`. Report them; never ask.
- **Finish:** capped runs one more round (`state.py extend`) when `end` printed `UNREVIEWED FIXES`, else it is accepted as is. Offer nothing; report.

## Before round 1

1. **Branch.** You need a git repo. Uncommitted work is part of the PR: ask the user to commit it, or later rounds mistake it for fixes. Stay on the current branch, and only on the default branch create `review-loop/<short-name>`.
2. **Intent.** Write `.review-loop/intent.md` (create the folder) from this session: what the user asked for, decisions made, non-goals, and the expected load. Claims only, under 200 words. Reviewers judge "should this exist" against it, and the gate won't let them undo a decision in it. With no session to draw on, write what the commits and docs say and mark it inferred.
3. **Conventions.** Find the project's written standards: AGENTS.md or CLAUDE.md, CONTRIBUTING, `docs/conventions/` or similar, and a `declined.md` (what the project decided against) if one exists. Don't write conventions yourself.
4. **Checks.** Every command CI runs on a PR (tests, lint, type check, build; read the CI config, or without one the commands the docs name). Run each once. If one fails before you change anything, init, then `state.py stop "red baseline: <cmd>"`: a red baseline makes every fix unverifiable.
5. **Init.** `state.py init --conventions "<files>" --check "<cmd>"...`. It reviews the diff against the default branch; `--base <branch>` picks another base, and `--scope <paths>` reviews paths whole instead. `--rereview` reviews the whole change every round and needs two clean rounds: slower, for large or risky changes. `--models opus,sonnet` runs round 1's reviewers on the first model and later rounds on the next (the last for any round after). Round 1 is the only round that reads the whole change, so give it the strong model; later rounds read only the fixes. `report` then counts each reviewer per model. A `SMALL CHANGE` line means one round, only `necessity`, and no gate. A caller may also say "no gate": then decide each new finding yourself, applying `gate.md`'s rules S and D first, and anything they would stop is `wontfix "needs owner: …"`.
6. **Panel.** `necessity` always, plus one reviewer matched to the stack (`personas/README.md` has the table); a second only for a change over ~300 lines, except `design-families`, which joins whenever a Python or TS change touches two or more packages (top-level source folders or workspace packages), the repo has history to read, and the `improve-code-design` skill is installed next to this one. `decisions` joins likewise when the change adds or moves a rule over shared data (permissions, writes, state several paths change) or was built from a plan. One rule kept in two places is what reviews catch most and file-by-file readers miss. `--personas` overrides. On a 3,000-line change each reviewer used 170k to 220k tokens and five to seven minutes, and the gate about 160k tokens and five minutes (measured 2026-11-10); in later rounds a second reviewer often catches a bad fix.

In Claude Code, give the user this line once with the run id from init's output, then start round 1 without waiting:

```
/goal a state.py command output in this conversation shows a line starting with "review-loop [<run id>]: converged at round", "review-loop [<run id>]: capped at round" or "review-loop [<run id>]: stopped at round"
```

Only the user can set a goal, and its checker reads only the conversation, so status lines come only from `state.py`; never write one yourself. Run rounds back to back.

## Each round

1. `state.py start`.
2. **Review.** For each reviewer, `state.py brief <name>` prints a brief path. Start one fresh subagent per reviewer at the same time, on the model in `start`'s `MODEL` line when it printed one (one that can write files; in Claude Code, general-purpose) and give each only "Follow the instructions in `<path>`". If a reviewer fails or writes nothing, retry it once, then `state.py notrun <name> "<reason>"`. With no subagents, run each brief in a fresh chat, not inline: you've seen the fixes. A round that reviews only the fixes needs two reviewers: `necessity` and the first stack reviewer.
3. `state.py add .review-loop/r<n>-<name>.json` for each. It reads a reviewer's first ten findings, drops repeats and findings below the bar, records its five most severe that no other reviewer raised, and says what it skipped. A finding at the same spot as another reviewer's is most likely a repeat, so it goes to the gate without taking one of the five; a reviewer's own second finding at a spot counts. A finding outside the change or past the five is set aside once; raised again by another reviewer or in a later round, it is recorded (`RAISED AGAIN`), because a doc the change forgot to update is a file the change never touched. `OSCILLATING` and `CHURN?` lines say what to do instead of another fix. `TREE CHANGED during review` means a reviewer created or changed files: restore them before fixing.
4. **Gate.** If anything is new, `state.py brief gate` and one fresh subagent (a faster model is fine; Sonnet in Claude Code). Record each verdict: `decide F7 kept`, `decide F7 dropped "rule 3: …"` (a rule 0 drop names the finding it repeats, `"rule 0: same issue as F5"`, so `report` credits both reviewers), and OWNER as `decide F7 wontfix "needs owner: session decision"`. Overrule a drop only if its facts are wrong or its rule doesn't apply, and say so.
5. **Fix** each kept finding as its `fix` proposes: all of it, deletions included, plus the callers it forces, and nothing it doesn't name (a wider type, an extra option). If it offers options, take the smallest. Fixing it another way needs a reason in the note; the next round checks both. If you can't restate it as a concrete change, `wontfix "unclear: …"`.
   - `high` first, then simple fixes, then larger ones; a fix another needs goes first. Find every caller before changing a signature. Moved or merged code keeps its error handling and validation.
   - A `bug`: first write a test that fails (or a repro in the note when no check can show it). If it passes, `dropped "repro passes"`. Keep the test.
   - After each fix run only the tests that cover it; after the round's last fix run `state.py check` once (it runs the `--check` commands). Green: `decide F7 fixed`. Red, the fix the failing check points at: after a bug fix you can't repair in one more try, revert it, `wontfix "breaks <test>"`; after a `lines`, `redundancy` or `architecture` fix the rewrite isn't equivalent, so revert at once, `wontfix "not equivalent"`. When the output doesn't show which fix broke it, revert fixes newest first until it is green.
   - A fix that adds non-test lines says why in its note. A comment or guard only a zero-context reader would want: `wontfix "reviewer-only"`.
   - `wontfix "needs owner: …"`, never your own call: changing a published interface (documented, or exported by a library others install), behaviour users would notice (output, exit codes, errors), or anything the safety floor protects (validation of outside input, error handling that prevents data loss, security, accessibility). Surface this branch added isn't published yet, and deleting unused internal code needs no owner.
6. **Commit** if anything was fixed: `review-loop round <n>: <k> fixes`, with one "title: why" line per fix in the body, following the project's commit conventions.
7. `state.py end` runs the checks, unless `check` passed on the content the round committed, and prints the status line. A failed check shows its output, and the round isn't clean. Still running: next round. Ended: read `$SKILL_DIR/finish.md` and finish in the same turn.
