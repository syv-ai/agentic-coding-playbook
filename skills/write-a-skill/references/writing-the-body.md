# Writing the body

Read this when choosing how to phrase a rule, when a draft isn't changing behaviour, or when designing a bundled script. Anthropic's longer guide is at [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

Contents: degrees of freedom · match the form to the failure · wording rules · pruning · workflow patterns · files and progressive disclosure · scripts for agents

## Degrees of freedom

Match how specific an instruction is to how fragile the task is.

- **High freedom** (prose heuristics) when several approaches are valid and the right one depends on context: a code review, a design discussion.
- **Medium freedom** (a template or a script with parameters) when there's a preferred pattern and some variation is fine.
- **Low freedom** (an exact command, few or no parameters) when the operation is fragile or must happen in a fixed order: a migration, a release.

Most skills mix all three. Give a default rather than a menu ("use pdfplumber; for scanned PDFs, use OCR instead"), and give each option a condition for choosing it.

## Match the form to the failure

Look at what went wrong in the baseline before choosing how to phrase the fix. The form that fixes one kind of failure can make another worse.

| What the baseline did | Form that works | Form that tends to backfire |
|---|---|---|
| Output had the wrong shape (bloated, buried the answer, restated the input) | A positive recipe: say what the output is, its parts in order | A list of things not to do |
| Left out an element it should include | A required slot in the template it fills in | A prose reminder near the template |
| Should behave differently depending on a condition | A conditional on something the agent can observe ("if a spec file exists, link it") | An unconditional rule with exceptions attached |
| Knew the rule and skipped it under pressure | The rule at the point of use, with its reason, then tested under pressure | Softer wording ("consider …") |

The last row is where discipline skills such as test-first or root-cause debugging live. There, a reason stated in prose can be what holds the rule. The superpowers project found that removing the prose rebuttals from its TDD skill dropped test-first compliance under "just write it, tests after" pressure from 8 in 10 runs to 5 in 10, so it kept them. Test before cutting a rationale from a discipline skill.

## Wording rules

- **Prompt the positive target.** "Write one-line comments" works better than "don't write long comments": a prohibition puts the unwanted behaviour into context. Keep a prohibition only as a hard guardrail you can't phrase positively, and pair it with what to do instead.
- **No nuance clauses.** "Don't X unless it matters" reopens the question every time. Write a real exception as its own conditional on an observable predicate.
- **Exemption clauses don't scope.** "This limit doesn't apply to code blocks" still tends to suppress code blocks. If part of the output must be exempt, restructure so the rule can't reach it.
- **Give the reason in a clause.** "Run the linter before committing, since CI rejects unformatted code." The reason lets the agent handle cases the rule didn't foresee.
- **Leading words.** A compact term the model already knows (*tracer bullet*, *red* for a failing test, *tight loop*) anchors a whole behaviour in one token. Reuse an existing term before coining one; a coined term costs definition tokens.
- **One trigger per branch** in descriptions and pointers. Synonyms for the same case add length without reach; list only cases that are genuinely different.
- **Every step ends on a checkable completion criterion.** "Done when every changed module has a test", not "understand the codebase". A vague end invites the agent to move on early, especially when later steps are visible.
- **Consistent terms.** Pick one word for each thing and use it throughout.

## Pruning

- **Delete no-ops.** A sentence the model already obeys by default ("be careful", "write clean code") costs context and changes nothing. Delete the whole sentence. Whether a sentence is a no-op is settled by running the skill without it.
- **Don't cache what the agent can look up.** `package.json` scripts, config files, directory layout and `--help` output are already available and can't go stale. Write down what isn't: the unwritten convention, the reason behind a choice, the gotcha no config file reveals.
- **One place per rule.** The same instruction in two places drifts apart and reads as more important than it is.
- **No time-sensitive text.** "Before August, use the old API" will be wrong later. Describe the current way; put a legacy note in a collapsed section if it's still needed.

## Workflow patterns

- **Checklists** for long or multi-step workflows: a short list the agent can copy and tick off, so steps aren't skipped.
- **Templates** for structured output. Say how strict: "use exactly this structure" for data formats, "a sensible default; adapt sections" for reports.
- **Examples** as input/output pairs when style matters more than rules can say. One good example beats several weak ones.
- **Validation loops:** run a validator, fix, run again, and continue only when it passes. The validator can be a script or a checklist in a reference file.
- **Plan, validate, execute** for batch or destructive work: the agent writes its intended changes to a file (`changes.json`), a script checks it, and only then are changes applied.

## Files and progressive disclosure

- **`scripts/`** hold code the agent runs; say whether to run a script or read it. Running costs only its output.
- **`references/`** hold depth read on demand. Each link from `SKILL.md` says when to read it. Keep references one level deep: agents may only skim a file linked from another reference.
- **`assets/`** hold templates, schemas and static files used in the output.
- A reference file longer than about 100 lines gets a short contents list at the top, so a partial read still shows what's there.
- Name files for their content (`form-validation-rules.md`, not `notes2.md`) and use forward slashes in paths.

## Scripts for agents

From [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts):

- **Non-interactive.** Agents can't answer prompts; a script that waits for input hangs. Take input from flags, environment variables or stdin, and fail with a usage line when something is missing.
- **`--help`** with a one-line description, the flags and an example. Keep it short; it lands in context.
- **Useful errors:** what went wrong, what was expected, what to try.
- **Structured output** (JSON, CSV) on stdout; progress and warnings on stderr.
- **Meaningful exit codes**, documented in `--help`.
- **Idempotent** where possible, since agents retry: "create if missing" rather than "fail on duplicate".
- **`--dry-run`** for destructive or stateful operations, and an explicit flag such as `--force` where the risk calls for it.
- **Bounded output.** Harnesses truncate long tool output. Default to a summary or a limit, with `--offset` or `--output FILE` for the rest.
- **Pinned dependencies** declared in the script: PEP 723 inline metadata run with `uv run`, or versioned one-off commands (`npx eslint@9.0.0`). State runtime prerequisites in the skill or in `compatibility`.
- **Paths relative to the skill folder**, invoked through the interpreter (`bash scripts/x.sh`, `python3 scripts/x.py`) so a missing executable bit doesn't matter.
- **Handle errors in the script** rather than leaving them to the agent, and explain constants (`TIMEOUT = 30  # most requests finish in 10s`).
