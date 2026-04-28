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

## Triggering Tools Creatively

Your agent ships with more tools than the obvious file-editing and shell-running ones. Most of them get invoked when the agent decides it needs them. But you can also prompt the agent to use a specific tool on purpose, to change how a session behaves.

A good example in Claude Code is the `AskUserQuestion` tool. The agent usually decides on its own when to ask for clarification, and by default it leans toward making reasonable assumptions and pushing forward. You can override that bias explicitly:

```
Before you start, use AskUserQuestion to ask me 10 questions
about this task to make sure we're aligned on scope,
architecture, and edge cases. Don't write any code until
I've answered.
```

This flips the interaction. Instead of the agent guessing and you correcting later, the agent surfaces its uncertainties up front. It's particularly valuable after a long session where context is dense and the next step is ambiguous, or before a complex task where the cost of guessing wrong is high.

The same idea applies to other built-in tools:

**Planning tools.** "Enter plan mode and produce a written plan before touching any files." Forces the research-then-implement split even when the agent would otherwise jump to code.

**Task tracking.** "Create a task list for this work and tick items off as you finish them." Useful for multi-step jobs where you want visible progress rather than one giant diff at the end.

**Subagents.** "Spawn an Explore subagent to map the auth module, then use its findings to plan the refactor." Keeps the main context clean and runs the search in parallel. Covered in more depth in [Module 07](./07-subagents-and-parallelism.md).

**Web search and fetch.** "Before implementing, use WebFetch on the library's changelog page and check the current API." Grounds the agent in up-to-date external facts instead of relying on training data.

**Memory.** "Save what we just agreed on as a project memory so future sessions know about it." Turns a passing conversation into durable context.

The pattern is the same each time: you know which tool fits the situation better than the agent's default heuristic does, so you name it in the prompt. Think of the tool list as a menu you can steer from, not a black box the agent manages alone.

A rough rule: if you've ever felt the agent was too eager to start coding, too shy to ask, or too quick to forget, there's usually a specific tool you can prompt it to use instead.

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
5. At the end of your next complex session, prompt the agent to use its ask-user-question tool to surface 10 alignment questions before continuing. Note which questions you hadn't thought to answer up front.

## References

[^1]: Anthropic, "How Claude Code Works" and "Common Workflows," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works / https://code.claude.com/docs/en/common-workflows

[^2]: "How to Build Agentic Coding Workflows That Actually Ship," *Codegen*, 2026. https://codegen.com/blog/how-to-build-agentic-coding-workflows/
