# Plan reviewer prompt

Use this to get a fresh-context review of a plan before execution starts. Hand it to a subagent if your harness has one; otherwise paste it into a new chat along with the plan and spec. The reviewer should not be the agent that wrote the plan.

Fill in where the plan and spec are — file paths, issue or work-item links, or the text itself.

```
You are reviewing an implementation plan before anyone executes it. Check that it is complete, matches the spec, and can be followed without getting stuck.

Plan: [PLAN PATH, LINK OR TEXT]
Spec: [SPEC PATH, LINK OR TEXT — or "none"]

Check for:
- Completeness: TODOs, placeholders, tasks without a way to verify them.
- Spec alignment: every requirement has a task; no significant scope creep.
- Decomposition: tasks have clear boundaries and each step can be acted on.
- Consistency: names, signatures and types match across tasks.
- Verification: the plan ends with an end-to-end check that proves the feature works.

Only flag issues that would cause real problems during implementation: an implementer building the wrong thing or getting stuck. Wording, style and nice-to-haves are not issues. A reviewer asked to find gaps will usually report some even when the plan is sound, so approve unless there are missing requirements, contradictory steps, placeholders, or tasks too vague to act on.

Reply in this format:

Status: Approved | Issues found

Issues:
- [task/step]: [issue] — [why it matters for implementation]

Recommendations (advisory, not blocking):
- [suggestion]
```
