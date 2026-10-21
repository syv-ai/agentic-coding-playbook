# design-decisions.md format

One entry per decision, newest last, written when the decision is made. Keep each entry short; the user should be able to review the whole log in a few minutes.

```markdown
# Design decisions — <task name>

Plan/spec: <path or link>

## D1. <The decision, stated as a claim> [provisional]

- **Context:** what forced a choice, in one or two sentences.
- **Decision:** what you did, with the files or modules affected.
- **Alternatives:** what else was viable and why it lost.
- **Basis:** existing convention (cite the file), improve-code-design / improve-codebase-architecture reasoning, best practice, or assumption.
- **Cost if wrong:** cheap / moderate / expensive, what the user would get if this was the wrong call, and what undoing it would involve.
```

- Number entries (D1, D2, …) so the final report and later entries can refer to them.
- Add `[provisional]` to the heading when you were unsure or the choice rests on an assumption about intent; drop it if later work confirms it.
- When a later decision overrides an earlier one, add a new entry and mark the old heading `[superseded by Dn]`. Don't rewrite history.
- Small corrections to the plan (a misnamed function, a wrong path) are decisions too; a one-line entry is enough: `D7. <what you decided> — <why> — <cost if wrong>`.
- In the final report, list every entry in that one-line form, provisional ones first.
- Preparatory refactors get an entry too: the complexity you found, why it blocked the task, and what you changed.
