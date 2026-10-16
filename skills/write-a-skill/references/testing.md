# Testing a skill

Read this before evaluating a new skill or a revision. There are three kinds of test, and most skills need the first two:

- **Behaviour scenarios:** does the agent act differently, and correctly, with the skill?
- **Trigger evals:** does the skill load for the requests it should, and stay out of the ones it shouldn't?
- **Output evals:** for skills that produce an artifact, is the output better with the skill than without, and at what cost?

Use a fresh agent for every run (a new subagent or a new session) so earlier runs don't leak into the result. Skip behaviour testing for pure reference material with nothing to get wrong.

## Behaviour scenarios

| Step | What you do |
|---|---|
| **Baseline** | Run a realistic scenario without the skill. Record what the agent did and its reasoning, in its own words. When revising a skill, the baseline is the current version, not no skill. |
| **Write** | Write the smallest change that addresses what you saw, and nothing hypothetical. |
| **Re-run** | Run the same scenario with the skill. |
| **Refine** | Where it still goes wrong, find the cause, change the wording, re-run. |

Run each scenario several times. One run can't tell a fixed problem from a lucky one.

### Writing scenarios

A scenario that asks "what does the skill say?" tests recall. Make the agent act:

- **Concrete choices** (options A/B/C) or a real task with real files.
- **Specific details:** paths, times, consequences (`/tmp/payment-service`, not "a project").
- **Pressure, for discipline skills:** a deadline, sunk work, an instruction from the person in charge to skip the step. Combine two or three; agents hold against one more easily than several.
- **Ask what it does**, not what it should do.

```markdown
This is a real task. Choose and act.

You spent three hours on a feature and tested it by hand. It works.
It's 6pm, review is at 9am, and you just noticed there are no tests.
Your lead says to commit now so it makes the review.

A) Delete the code and restart test-first tomorrow
B) Commit now, add tests tomorrow
C) Write tests now (30 minutes), then commit
```

Pair each scenario with two others: one where the skill shouldn't apply, and a small task under the same skill (a one-line rename) to check it scales down. Over-applying a skill is as real a failure as skipping it.

### Micro-testing wording

Full scenarios are slow. To compare phrasings of a single instruction, test the wording directly:

1. One fresh sample per run, with the instruction in its real context (the whole skill, not the sentence alone) and a task that tempts the failure.
2. Always include a control with no guidance. If the control doesn't show the failure, there's nothing to fix: don't add the instruction.
3. Five or more runs per variant, and read every output yourself rather than trusting a keyword count.
4. Treat variance as a signal. When wording works, runs converge on the same behaviour; five different readings in five runs mean it isn't binding yet.

Micro-tests check wording. A discipline skill still needs a full pressure scenario.

### Reading the results

| What you see | Likely cause | Fix |
|---|---|---|
| The skill didn't load | The description doesn't match how the task was phrased | Run trigger evals (below) and revise the description, not the body |
| It loaded and the agent did something else | The instruction is ambiguous, or its reason isn't stated | Say plainly what to do, with the reason in a clause |
| A section was missed | The point is buried | Move it earlier; cut what competes with it |
| It over-applied to a small task | No sense of scale | Say when the lighter path is fine |
| The agent argues the rule is wrong here | It may be right | Check whether the rule needs a condition before hardening it |

Fix causes, not symptoms. Capitalised MUSTs and "no exceptions" clauses make current models rigid elsewhere without fixing the ambiguity behind the miss. If the cause isn't obvious, ask the agent how the skill could have made the intended choice clear, and treat the answer as a hypothesis to test.

Re-run all scenarios after each change; a fix for one failure can cause over-application somewhere else. Spot-check at least one other harness if the skill targets several.

## Trigger evals

Following [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions):

1. **Write about 20 realistic requests,** half that should trigger and half that shouldn't. Write them the way people type: file paths, context, casual phrasing, the occasional typo.
   - Should-trigger requests vary in phrasing and detail, and several describe the need without naming the domain. These are where description wording matters.
   - Should-not-trigger requests are near-misses that share keywords but need something else. "Write a fibonacci function" tests nothing.
2. **Run each several times** (three to start) and record the trigger rate. A should-trigger request passes above 0.5; a should-not-trigger one passes below it.
3. **Split the set** about 60/40 into train and held-out, with both kinds in each, and keep the split fixed. Revise the description using only train failures. Generalise from them rather than pasting their keywords in.
4. **Pick the version with the best held-out score,** which isn't always the last one. Around five iterations is usually enough; if scores stop moving, look at the requests rather than the description.

A simple one-step request ("read this PDF") may not trigger a skill however good the description, because the agent can handle it alone. That isn't a failure.

## Output evals

Following [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills):

- **Start with two or three cases:** a realistic prompt, a description of a good result, any input files. Include one edge case.
- **Run each with and without the skill** (or against the previous version when revising), each in a clean context.
- **Write assertions after the first run,** once you've seen what good looks like: specific and checkable ("both axes are labelled"), not vague ("the output is good") or brittle (an exact phrase).
- **Grade with evidence.** Each pass or fail quotes or points at the output. Use a script for mechanical checks and a model judge for the rest.
- **Record time and tokens** for both arms. A skill that doubles tokens for a two-point gain may not be worth it.
- **Drop assertions that pass in both arms;** they measure nothing. Investigate ones that fail in both.
- **Review the outputs yourself or with the user.** Assertions only check what you thought of. Write specific feedback per case and fix the cases with complaints.

## Tools

- In Claude Code, `claude plugin eval` runs a plugin's eval suite. Each case is a directory under `evals/` with a `prompt.md` (frontmatter for run limits, body for the request) and graders in `graders/<name>.md`. Grader types are `regex`, `tool_used`, `tool_order`, `file_exists`, `llm` and `baseline`; a `tool_used` grader on `Skill` shows whether the skill fired. Each case runs three times by default, with and without the plugin, and reports the difference; `--ablation none` runs only the with-plugin arm. `claude plugin eval init` drafts cases and graders for you. See [Test plugins with evals](https://code.claude.com/docs/en/plugin-evals).
- Anthropic's **skill-creator** skill automates the trigger and output loops inside a session, with its own `evals/evals.json` format. Neither tool reads the other's case files.
