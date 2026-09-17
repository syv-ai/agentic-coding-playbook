---
name: receiving-code-review
description: Evaluates code review feedback against the codebase before acting on it, with clarification, evidence-based pushback and a check against over-building. Use when receiving review comments from a person, a reviewer agent or a review tool, especially when feedback is unclear, broad, or seems technically questionable.
---

# Receiving Code Review

Review feedback is a set of claims to check, not a list of orders. Verify each one against the code, then fix it, question it, or push back with evidence.

## The pattern

1. **Read all of it** before changing anything. Items are often related.
2. **Restate each item** as a concrete technical requirement. If you can't, it's unclear.
3. **Check it against the code.** Is the claim true here? Does the suggestion break something, contradict an earlier decision, or miss context the reviewer didn't have?
4. **Respond per item:** fix it, ask about it, or push back with reasons.
5. **Implement one item at a time,** running the relevant tests after each.

## Clarify first

If any item is unclear, ask about those items before implementing any of them. Partial understanding of related items leads to a fix for the wrong thing.

> "Items 1, 2, 3 and 6 are clear. For 4 and 5: do you mean the retry limit per request or per session?"

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot); if it has none, ask in plain text. Independent questions can go together.

## Weigh the source

- **The user:** trusted on intent. Still check scope and technical claims against the code, and say so if a request conflicts with something they decided earlier.
- **External reviewers, reviewer agents and tools:** useful, but they may lack context. Before implementing, check that the suggestion is correct for this codebase, doesn't break existing behaviour, and works on the platforms and versions the project supports. If the current implementation looks deliberate, find out why before replacing it.

If you can't verify a claim, say so: "I can't confirm this without running against production data. Should I investigate, or leave it?"

## Don't chase every finding

A reviewer asked to find problems will usually find some, even in sound work. Treat findings that affect correctness or stated requirements as required; treat the rest as optional and say which is which.

**YAGNI check.** When a reviewer asks to "implement this properly" (metrics, configuration, export options), search for real usage first:

> "Nothing calls this endpoint. Remove it instead? Or is there a caller I'm missing?"

Adding capability nobody uses is its own defect: more code, more tests, more surface.

## Push back with evidence

Push back when a suggestion breaks existing behaviour, lacks context, adds unused features, is wrong for this stack, conflicts with compatibility requirements, or contradicts an architectural decision the user made.

Point at code, tests or documentation rather than opinion:

> "Checked: the build targets 10.15, and this API needs 13. The legacy path stays. The bundle id it uses is wrong, though. Fix that, or drop pre-13 support?"

Involve the user when the disagreement is architectural.

If you pushed back and turn out to be wrong, say so briefly and move on: "Checked again; you're right, the cache is shared across tenants. Fixing."

## Order of work

After clarifying:

1. Blocking issues: broken behaviour, security.
2. Simple fixes: typos, imports, naming.
3. Larger changes: logic, refactoring.

Test each fix on its own and check for regressions at the end.

## Responding

Keep responses technical and short. State what changed and where, or ask the specific question. Skip performative agreement ("Great point!", "You're absolutely right"); the fix shows you took the feedback seriously.

Reply where the comment lives. On a pull request or work item, answer in the comment's own thread rather than as a new top-level comment (on GitHub: `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), so the reviewer sees the answer next to the question.
