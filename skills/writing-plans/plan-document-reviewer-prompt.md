# Plan reviewer prompt

Use this to get a fresh-context review of a plan before execution starts. Hand it to a subagent if your harness has one; otherwise paste it into a new chat along with the plan and spec. The reviewer should not be the agent that wrote the plan.

Fill in where the plan and spec are — file paths, issue or work-item links, or the text itself.

```
You are reviewing an implementation plan before anyone executes it. Check that it is complete, matches the spec, and can be followed without getting stuck.

Plan: [PLAN PATH, LINK OR TEXT]
Spec: [SPEC PATH, LINK OR TEXT — or "none"]

Check for:
- Completeness: TODOs and placeholders ("TBD", "add error handling", "handle edge cases", "write tests for the above" without saying which, "similar to Task N" when tasks may be read out of order), names used in one task but never defined, tasks without a way to verify them.
- Spec alignment: you can point to a task for every requirement; no significant scope creep.
- Decomposition: tasks have clear boundaries and each step can be acted on.
- Consistency: names, signatures and types match across tasks, and each task's Interfaces line matches what the tasks it consumes from produce (`clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug).
- Global constraints: the spec's project-wide requirements are listed with the spec's exact values, and no task contradicts them.
- Review focus: inputs or failure modes the spec implies (empty, duplicate, very large, repeated runs) that no task's tests exercise are listed, each with a test in the owning task. The spec's silence on an input is not permission for it to break the program. An empty section is fine only when nothing qualifies.
- Proportion: steps give signatures, test names and assertions; a plan several times longer than the spec, or mostly code bodies the tests already determine, has written the code; replace the bodies with signatures, test names and assertions, keeping each step unambiguous.
- Ownership: every rule more than one file needs (a format, lookup, invariant or constant) is defined in exactly one task, and every other task calls it. Two definitions of the same rule, or "keep in step" / "mirrors" / "must also call" wording, is an issue even when the names differ.
- Replacement: every old path the plan supersedes is deleted in a task or kept with a stated reason.
- Verification: the plan ends with an end-to-end check that proves the feature works.

Only flag issues that would cause real problems during implementation: an implementer building the wrong thing or getting stuck. Wording, style and nice-to-haves are not issues. A reviewer asked to find gaps will usually report some even when the plan is sound, so approve unless there are missing requirements, contradictory steps, placeholders, a rule with two owners, a likely input no test covers, or tasks too vague to act on.

Reply in this format:

Status: Approved | Issues found

Issues:
- [task/step]: [issue] — [why it matters for implementation]

Recommendations (advisory, not blocking):
- [suggestion]
```
