# Module 11: From Business Context to Agent-Ready Tasks

## The Upstream Problem

Most agentic coding tutorials start at the prompt. You type something into the agent and it works. But in a real organization, the work doesn't start there. It starts with a business need, gets shaped into a product vision, broken down into requirements, and eventually becomes something an engineer works on.

That pipeline from business context to agent-ready task is where most teams lose quality. Anthropic's research shows that developers use AI in roughly 60% of their work, but only 0 to 20% of tasks can be fully delegated [^1]. A major reason for that gap is that tasks arrive in formats agents can't work with effectively: vague Jira tickets, Slack threads of discussion, half-formed ideas from a meeting.

Codegen's research confirms this: the rate-limiting factor for agentic workflow quality is what goes into the agent before execution starts, not what happens inside the model [^2].

This module covers the pipeline that turns business context into work an agent can actually do well.

## The Full Pipeline

```
Business need / opportunity
        |
    Product vision
        |
    PRD (Product Requirements Document)
        |
    Technical specification
        |
    Task breakdown (issues)
        |
    Agent-ready task prompt
```

You don't need all of these steps for every piece of work. A bug fix skips straight from "the thing is broken" to an agent-ready task. But for feature work, especially in enterprise settings, the upstream quality directly determines what the agent produces.

## Writing Agent-Ready PRDs

A traditional PRD is written for human engineers who can fill gaps with intuition and ask clarifying questions in standups. An agent-ready PRD is a different artifact. It needs to be explicit enough that a literal-minded system can work from it without ambiguity [^3].

The key difference: agents don't read between the lines. They follow what's written. If the PRD says "add authentication" without specifying the method, the agent picks whatever it was trained on most. If it says "add OAuth2 authentication using the authorization code flow with PKCE, supporting Google and GitHub as providers," the agent has a clear target.

### Structure That Works

Addy Osmani's research, backed by GitHub's analysis of over 2,500 agent configuration files, identifies six essential sections [^4]:

| Section | What It Contains | Why Agents Need It |
|---------|------------------|--------------------|
| **Commands** | Exact build, test, lint commands with flags | Agents execute these literally. Wrong commands waste time. |
| **Testing** | Framework, file locations, coverage targets | Agents need to know where tests go and how to run them |
| **Project Structure** | Directory organization with paths | Agents use this to place new files correctly |
| **Code Style** | One real code snippet per convention | A snippet is worth a hundred words of description |
| **Git Workflow** | Branch naming, commit format, PR rules | Agents will commit; these rules shape how |
| **Boundaries** | What agents can and cannot do | Prevents the agent from touching things it shouldn't |

### The Boundary System

The most effective specs use a three-tier boundary system [^4]:

**Always do.** Rules the agent should follow without exception. "Always run tests before committing." "Always follow the naming conventions in the style guide."

**Ask first.** Actions the agent should propose but not execute autonomously. "Ask before modifying database schemas." "Ask before adding new dependencies."

**Never do.** Hard limits. "Never commit secrets." "Never modify CI configuration." "Never delete migration files."

"Never commit secrets" was the single most common helpful constraint found across thousands of agent configuration files [^4].

## From PRD to Issues

A PRD describes the whole feature. Issues describe individual pieces of work. The translation from one to the other is where task sizing matters (covered in Module 04), but there's a structural element too.

An agent-ready issue needs:

```markdown
## What
Add cursor-based pagination to GET /api/users

## Why
The current endpoint returns all users in a single response.
With 50k+ users, this causes timeouts and excessive memory usage.

## Acceptance Criteria
- Accepts optional `cursor` query parameter (base64-encoded user ID)
- Returns max 25 items per page
- Response includes `next_cursor` field (null when no more results)
- Response includes `total_count` field
- Empty page returns empty array with null cursor

## Technical Constraints
- Must not add a COUNT(*) query (too expensive on our user table)
- Use the same cursor encoding pattern as GET /api/orders
- Must work with our existing API response envelope

## Out of Scope
- Changing the existing response format for non-paginated fields
- Adding pagination to other endpoints (separate tickets)
```

Notice what's in there: clear success criteria, constraints the agent can't infer from code, a reference to an existing pattern, and explicit scope boundaries.

## The Spec-as-Artifact Pattern

For larger features, the specification itself becomes a persistent file in the repository [^4]. Save it as `SPEC.md` or in a `docs/specs/` directory. The agent can read it at the start of each session, maintaining continuity across sessions (see Module 08).

This is the "spec-driven development" model:

1. **Specify.** Write a high-level description. Let the agent expand it into a detailed spec.
2. **Plan.** Use plan mode (read-only) to have the agent analyze your codebase against the spec and create a technical plan.
3. **Decompose.** The agent breaks the plan into individual tasks with clear dependencies.
4. **Implement.** Tasks are executed one at a time, with human review at each gate.

The spec file evolves as you learn things during implementation. When requirements change or gaps are discovered, update the spec and explicitly tell the agent: "The spec has been updated. Here's what changed. Adjust the remaining plan accordingly."

### Disposable Interactive Mockups

A written spec is the right artifact for behaviour and rules. For anything you need to *see*, prose is slow and ambiguous, and the fastest way to align is a throwaway interactive mockup. Ask the agent to generate a small, self-contained HTML file, a clickable UI sketch, a chart of a dataset, a working demo of a flow, and open it in a browser. Reacting to something concrete collapses a dozen rounds of "no, more like this" into one.

Two things make it work:

- **It's disposable.** The mockup exists to settle one question. Once you've decided, delete it; don't let it accrete into something you feel obliged to maintain.
- **It's not just for UI.** The same trick explains *anything*, a data shape, a state machine, an algorithm, faster than a paragraph, and a self-contained HTML file needs only a browser to open, which also makes it a low-friction thing to hand a non-technical colleague.

Any agent that can write a file can do this; Claude Code packages it as the `prototype` and `brainstorming` skills.

## Using Agents to Write Specs

Here's the part people miss: agents are good at expanding specifications. You don't have to write the full detailed spec yourself.

Start with a paragraph of business context:

```
We need to add a notification system. Users should be able to receive
notifications for: new comments on their posts, mentions in comments,
and follower activity. Notifications should be real-time (WebSocket)
with a fallback to polling. Users need a preferences page to control
which notifications they receive. We're using PostgreSQL and Next.js.
```

Then ask the agent to expand this into a full specification. Review it, adjust, and iterate. The agent is doing the tedious work of enumerating edge cases and acceptance criteria. You're doing the judgment work of deciding what's actually important.

## Connecting Business Context

The hardest upstream problem is translating business intent into technical requirements. A product manager says "we need to improve onboarding." That needs to become specific, testable work before an agent can touch it.

Practical approaches:

**Include the "why" in every task.** When the agent understands the business motivation, it makes better architectural decisions. "Add pagination because we have 50k users causing timeouts" leads to different implementation choices than "add pagination because the design team wants it."

**Link to existing patterns.** If your product already handles something similar, reference it. "Follow the same flow as the existing email notification system" gives the agent a concrete model.

**State what good looks like from the user's perspective.** "A new user should be able to complete signup in under 30 seconds" is more useful than "make signup fast."

**Include domain vocabulary.** If your business has specific terms (a "workspace" means something particular in your product), define them. Agents will default to generic interpretations otherwise.

## Exercises

1. Take a recent feature from your backlog. Rewrite the ticket/issue in the agent-ready format shown above, with acceptance criteria, constraints, and boundaries.
2. Write a one-paragraph business description and ask an agent to expand it into a full specification. Review how much you need to correct.
3. Apply the three-tier boundary system (always/ask first/never) to your project's instruction file.
4. Try the spec-driven workflow: write a spec, use plan mode to generate a technical plan, break it into tasks, implement one.

## References

[^1]: Anthropic, "2026 Agentic Coding Trends Report," 2026. https://resources.anthropic.com/2026-agentic-coding-trends-report

[^2]: "How to Build Agentic Coding Workflows That Actually Ship," *Codegen*, 2026. https://codegen.com/blog/how-to-build-agentic-coding-workflows/

[^3]: "Agentic PRD: Designing Requirements for AI-Driven Engineering," *ProdMoh*, 2026. https://prodmoh.com/blog/agentic-prd

[^4]: Addy Osmani, "How to Write a Good Spec for AI Agents," 2026. https://addyosmani.com/blog/good-spec/
