# Module 04: Effective Prompting for Agents

## Prompting Agents Is Not Prompt Engineering

There's a common misconception that getting good results from coding agents is about crafting the perfect prompt. It's not. With autocomplete tools, your prompt was a few characters of code and the model guessed the next line. With agents, your prompt is a task description, and the agent runs an entire workflow to complete it.

The prompt still matters, but it matters differently. A good prompt for an agent is more like a good task brief for a contractor than a cleverly worded incantation [^1].

## The Spectrum: Vague to Precise

Consider two ways to ask for the same feature:

**Vague:**
```
Add pagination to the user list
```

**Precise:**
```
Add cursor-based pagination to GET /api/users.
- Page size: 25 items
- Response includes a `next_cursor` field (base64-encoded user ID)
- When `next_cursor` is null, there are no more results
- Accept an optional `cursor` query parameter
- Write tests covering: first page, middle page, last page, empty result
- Follow the same pattern used in GET /api/orders
```

The vague version might work. The agent will make choices about pagination style, page size, response format, and test coverage. Those choices might match what you wanted, or they might not, and you'll spend time correcting.

The precise version tells the agent what success looks like. It gives explicit acceptance criteria, points to an existing pattern to follow, and specifies test cases. The agent has less room to guess wrong [^2].

This doesn't mean every prompt needs to be a paragraph. "Fix the failing tests" is fine when you both know what tests are failing. The point is: give enough context that the agent can make good decisions without guessing, and give it something to verify against [^1].

## Five Patterns for Better Task Prompts

### 1. Reference Existing Patterns

Agents are very good at matching patterns they can see. Instead of describing what you want from scratch, point to code that already does something similar:

```
Add a PATCH endpoint for updating user profiles.
Follow the same pattern as the PATCH /api/orders endpoint
in src/api/orders.ts.
```

The agent reads the reference, understands the patterns (validation, error handling, response format), and applies them to the new endpoint. Less instruction, more consistency.

### 2. Include Verification Criteria

The agent performs better when it can check its own work [^1]. Give it something concrete to verify against:

```
Implement validateEmail. 
Test cases: 'user@example.com' returns true,
'invalid' returns false, 'user@.com' returns false.
Run the tests after.
```

For visual work, you can paste a screenshot of the expected design and ask the agent to compare its implementation against it [^1].

### 3. Separate Research from Implementation

For complex tasks, don't ask the agent to understand the problem and fix it in one go. Split it into two phases [^1]:

**Phase 1: Research**
```
Read src/auth/ and understand how we handle sessions.
What would need to change to support OAuth2?
Create a plan, don't implement yet.
```

**Phase 2: Implementation**
```
Implement the OAuth2 changes from the plan.
Start with the token exchange, then the session migration.
Run tests after each step.
```

Most agentic tools have a "plan mode" that restricts the agent to read-only analysis [^1]. Use it for Phase 1. Review the plan, refine it through conversation, then let the agent implement.

### 4. Scope the Work Explicitly

Agents sometimes do more than you asked. They "helpfully" refactor surrounding code, add error handling you didn't request, or clean up imports in files they didn't need to touch. This creates noise in your diffs and potential regressions.

Be explicit about scope when it matters:

```
Fix the null pointer exception in UserService.getProfile().
Only change what's needed to fix this specific bug.
Don't refactor surrounding code or update other tests.
```

### 5. Provide Constraints the Agent Can't Infer

Some requirements aren't visible in the code. Performance budgets, backwards compatibility needs, deployment constraints. The agent can't know about these unless you mention them:

```
Add the new field to the API response.
This endpoint is called 10k times per minute, so the implementation
must not add a database query per request. Use the data already
fetched in the existing query.
```

## Conversational Iteration

A crucial difference between prompting an autocomplete and prompting an agent: it's a conversation [^1]. You don't need to get it right on the first try.

```
Fix the login bug
```

[Agent investigates, tries something]

```
That's not quite right. The issue is in the session handling,
not the password validation. Check src/auth/session.ts.
```

[Agent adjusts, makes another attempt]

```
Better. But use the existing refreshToken function
instead of creating a new one.
```

Each exchange gives the agent more context. This is normal and expected. Treat the first prompt as a starting direction, not a complete specification.

You can also interrupt. If the agent is heading in the wrong direction (you can see it reading files that aren't relevant, or making changes you disagree with), just type your correction and hit enter. The agent stops and adjusts [^1].

## Anti-Patterns

**Over-specifying the how.** Tell the agent what you want and let it figure out the approach. "Use reduce instead of a for loop" is micromanagement. "The function should return the sum of items matching the filter" lets the agent pick the right implementation.

**Dumping entire specs.** If you paste a 2000-word product spec into the chat, the agent will try to implement all of it at once, usually poorly. Break it into individual tasks.

**Assuming shared context.** The agent doesn't know what you discussed in yesterday's session (unless you have memory persistence set up, covered in [Module 08](./08-long-running-agents.md)). Each session starts fresh. If there's important context from previous work, provide it.

**Prompt-and-pray.** Sending a complex task and walking away. Stay engaged, at least for the first few minutes. Check that the agent is reading the right files and heading in the right direction before you let it run.

## Task Sizing

Not all tasks are equally suited to agentic coding. The sweet spot varies, but some patterns are clear [^2]:

| High Success Rate | Lower Success Rate |
|-------------------|--------------------|
| Bug fixes with reproducible test cases | Features with evolving specifications |
| Migrations with clear before/after patterns | Cross-cutting changes touching many systems |
| Refactors following defined patterns | Work requiring significant architectural judgment |
| Test generation and documentation | Greenfield design with ambiguous requirements |
| Boilerplate and scaffolding | |

For lower-success tasks, break them into smaller pieces that each fall into the high-success category. "Design and implement the new microservice" is hard. "Create the service scaffold following our template" + "Add the /health endpoint" + "Add the first business endpoint matching the spec" is three separate, tractable tasks.

## Exercises

1. Take a recent task you completed manually. Write the prompt you'd give an agent for it. Include acceptance criteria and verification steps.
2. Try the same task with a vague prompt and a precise prompt. Compare the results.
3. Practice the research-then-implement pattern: use plan mode to analyze a piece of your codebase, then switch to implementation mode.
4. Find a situation where pointing the agent to an existing pattern ("do it like X") produces better results than describing the desired output from scratch.

## References

[^1]: Anthropic, "How Claude Code Works" and "Common Workflows," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works / https://code.claude.com/docs/en/common-workflows

[^2]: "How to Build Agentic Coding Workflows That Actually Ship," *Codegen*, 2026. https://codegen.com/blog/how-to-build-agentic-coding-workflows/
