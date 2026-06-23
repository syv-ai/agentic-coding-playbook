---
name: grill-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each before continuing.

**Always ask through the `AskUserQuestion` tool** — never pose the question as plain prose in the chat. Put the question and your recommended answer (plus the other plausible answers) as options in the tool, so I can pick fast and the decision is captured cleanly. The recommended option goes first, labelled as recommended.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Sharpen the language as you go

- **Challenge fuzzy terms.** When I use a vague or overloaded word, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
- **Stress-test with scenarios.** When domain relationships come up, invent concrete edge-case scenarios that force me to be precise about the boundaries between concepts.
- **Cross-reference with code.** When I state how something works, check whether the code agrees. If you find a contradiction, surface it immediately.

## Keep the glossary current

If the project keeps a domain glossary (e.g. CONTEXT.md), maintain it as terms get settled during the grilling. When a term is resolved, update the glossary right there — don't batch it. Keep it a glossary and nothing else: no implementation details, no specs, no scratch notes. If the project doesn't have one, don't require it.
