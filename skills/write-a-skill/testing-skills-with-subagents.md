# Testing Skills With Subagents

Load this when creating or editing a skill, to check that it changes agent behaviour in the way you intend — and no further.

## The loop

Testing a skill is test-driven development applied to instructions:

| Step | What you do |
|---|---|
| **Baseline** | Run a realistic scenario with a fresh agent *without* the skill. Record what it does and why, verbatim. |
| **Write** | Write the smallest skill that addresses the failures you actually saw. |
| **Re-run** | Run the same scenario *with* the skill. The agent should now behave as intended. |
| **Refine** | Where it still goes wrong, find out why and fix the instruction. Re-run. |

If you didn't watch an agent get it wrong without the skill, you don't know whether the skill teaches anything. Use a fresh subagent (or a fresh chat) per run so earlier runs don't leak into the result.

## What to test

- **Discipline skills** (test-first, root-cause debugging, verification) — scenarios where the shortcut is tempting.
- **Technique and reference skills** — a new situation the skill doesn't spell out: can the agent find and apply what it needs?
- **Scope** — scenarios where the skill should *not* apply, or should apply lightly. A one-line fix shouldn't trigger a full spec and plan. Over-application is as real a failure as skipping the skill.

Skip testing for pure reference material with no behaviour to get wrong.

## Writing scenarios

A scenario that just asks "what does the skill say?" tests recall, not behaviour. Make the agent act:

- **Concrete choices** — offer options A/B/C rather than an open question.
- **Real constraints** — specific times, paths, consequences (`/tmp/payment-system`, not "a project").
- **Realistic pressure** — a deadline, hours of sunk work, a senior colleague suggesting the shortcut. Combine two or three; agents resist a single nudge more easily than a stack of them.
- **Ask what it does**, not what it should do.

```markdown
This is a real task. Choose and act.

You spent three hours on a feature and tested it by hand. It works.
It's 6pm, review is at 9am tomorrow, and you just noticed there are no tests.

A) Delete the code and restart test-first tomorrow
B) Commit now, add tests tomorrow
C) Write tests now (30 minutes), then commit
```

Pair each pressure scenario with a scope scenario, for example a trivial rename under the same skill, to check the skill doesn't turn into ceremony.

## Reading the results

Record the agent's choice and its reasoning in its own words. The reasoning tells you what to fix:

| What you see | Likely cause | Fix |
|---|---|---|
| Agent didn't load or apply the skill | Description doesn't match how the task is phrased | Add the trigger words and symptoms to `description` (not the workflow) |
| Agent read it and did something else | The instruction is ambiguous, or its reason isn't stated | Say plainly what to do and why it matters in one clause |
| Agent missed a section | The key point is buried | Move it earlier; cut what competes with it |
| Agent over-applied it to a small task | No sense of scale in the skill | State when a lighter path is fine |
| Agent argues the rule is wrong for this case | It may be right | Check whether the rule needs an exception before hardening it |

Fix causes, not symptoms. Stacking capitalised MUSTs, "no exceptions" clauses and lists of forbidden excuses tends to make current models rigid — they over-apply the rule elsewhere — without fixing the ambiguity that caused the miss. One clear instruction with its reason usually holds better.

When a run goes wrong and the cause isn't obvious, ask the agent directly:

```markdown
You read the skill and chose C. How could the skill have been written
so that the intended choice was clear?
```

Treat its answer as a hypothesis to test, not as a patch to paste in.

## Re-run after every change

Run the original scenarios and the scope scenarios again after each edit. A fix for one failure can easily create over-application somewhere else. Stop when the agent behaves as intended across both, for reasons that match the skill.

If the collection targets several harnesses, spot-check at least one other agent: the same instruction can land differently.

In Claude Code, `claude plugin eval` can run cases like these repeatedly against a plugin, compare with a no-plugin baseline, and measure how often a skill triggers.

## Checklist

- [ ] Baseline run without the skill, failures recorded verbatim
- [ ] Skill addresses the observed failures and nothing hypothetical
- [ ] Re-run with the skill behaves as intended
- [ ] A scope scenario confirms the skill scales down for small tasks
- [ ] Every refinement fixed a cause and was re-tested
