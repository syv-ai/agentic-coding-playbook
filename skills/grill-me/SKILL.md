---
name: grill-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Treat it as a decision tree: every decision branches into the decisions that hang off it. For each question, give your recommended answer.

## Ask how I want to answer

Before the first round, ask me once which way I'd like the questions, with a one-line note on each:

- **Menus**: through your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode), recommended answer first. Quick to answer and cleanly recorded, but preset options can steer me toward your assumptions.
- **Open questions**: plain text, answered in my own words. Slower, but more likely to bring out what I actually think.

Keep to my choice for the rest of the session, and don't ask again if I already chose earlier in it. If your harness has no question tool, use open questions without asking.

With menus, label your recommended answer and put it first, list the other plausible answers as options, and word each question so "yes" accepts your recommendation. With open questions, ask each round as a short numbered list and give your recommendation after each question.

## Work the tree in rounds

The **frontier** is every decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you haven't heard yet. Ask the whole frontier in one round. Most question tools take three or four questions per call, so split a larger round across calls. A question that depends on another question still open belongs to a later round, not this one.

Each round of answers reshapes the tree: settled decisions unblock the questions that depended on them. Recompute the frontier and ask the next round.

**Finding facts is your job, never mine.** When a frontier question needs a fact from the code or the environment, look it up, or send an exploration subagent if your harness has one, instead of asking me. Don't block on it: only the questions downstream of a running lookup wait; ask the rest of the frontier now. The decisions are mine: put each to me and wait.

**You're done when the frontier is empty**: every branch visited, nothing silently assumed. Don't act on the plan until I confirm we've reached a shared understanding.

## Sharpen the language as you go

- **Challenge against the glossary.** If the project keeps a domain glossary and I use a term in a way that conflicts with it, say so straight away: "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"
- **Challenge fuzzy terms.** When I use a vague or overloaded word, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
- **Stress-test with scenarios.** When domain relationships come up, invent concrete edge cases that force me to be precise about the boundaries between concepts.
- **Cross-reference with code.** When I state how something works, check whether the code agrees. If it doesn't, say so immediately.

## Keep the glossary current

If the project keeps a domain glossary (for example a CONTEXT.md, or a glossary section in its docs or instructions file), update it as terms get settled, right when each term is resolved rather than in a batch at the end. Keep it a glossary and nothing else: no implementation details, specs or scratch notes. If the project has no glossary, don't create one unless I ask.

## Offer ADRs sparingly

If the project keeps architecture decision records, offer to write one only when a decision is hard to reverse, would surprise a future reader without the context, and came out of a real trade-off between genuine alternatives. If any of the three is missing, skip it. Follow the project's existing ADR format and location.
