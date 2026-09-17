---
name: grill-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions as you go. For each question, give your recommended answer.

**Ask through your harness's question tool** (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot, where the user may need to turn on `chat.askQuestions.enabled`). If it has none, ask in plain text. Put your recommended answer first, labelled as recommended, with the other plausible answers as options, so I can pick quickly and the decision is recorded cleanly.

**Order the questions by their dependencies.** When one answer changes what you'd ask next, ask it on its own and wait. Questions that don't depend on each other can go in the same batch.

If a question can be answered by exploring the codebase, explore instead of asking.

## Sharpen the language as you go

- **Challenge fuzzy terms.** When I use a vague or overloaded word, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
- **Stress-test with scenarios.** When domain relationships come up, invent concrete edge cases that force me to be precise about the boundaries between concepts.
- **Cross-reference with code.** When I state how something works, check whether the code agrees. If it doesn't, say so immediately.

## Keep the glossary current

If the project keeps a domain glossary (for example a CONTEXT.md, or a glossary section in its docs or instructions file), update it as terms get settled, right when each term is resolved rather than in a batch at the end. Keep it a glossary and nothing else: no implementation details, specs or scratch notes. If the project has no glossary, don't create one unless I ask.
