# Spec reviewer prompt

Use this to get a fresh-context review of a written spec before planning. Hand it to a subagent if your harness has one; otherwise paste it into a new chat along with the spec. The reviewer should not be the agent that wrote the spec.

Fill in the location of the spec — a file path, an issue or work-item link, or the spec text itself.

```
You are reviewing a spec before implementation planning starts. Check that it is complete, consistent and ready to plan from.

Spec: [SPEC PATH, LINK OR TEXT]

Check for:
- Completeness: TODOs, placeholders, "TBD", unfinished sections.
- Consistency: requirements that contradict each other.
- Clarity: requirements ambiguous enough that someone could build the wrong thing.
- Scope: whether it is focused enough for one plan, or covers independent subsystems.
- YAGNI: features nobody asked for.
- Verification: whether it says how to confirm the feature works end to end.

Only flag issues that would cause real problems during planning. A missing section, a contradiction, or a requirement that can be read two ways is an issue. Wording, style and uneven detail are not. A reviewer asked to find gaps will usually report some even when the spec is sound, so approve unless the gaps would lead to a flawed plan.

Reply in this format:

Status: Approved | Issues found

Issues:
- [section]: [issue] — [why it matters for planning]

Recommendations (advisory, not blocking):
- [suggestion]
```
