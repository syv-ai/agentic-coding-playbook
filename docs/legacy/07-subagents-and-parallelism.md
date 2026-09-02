# Module 07: Subagents and Parallel Execution

## Why Delegation Matters

Up to this point, we've been working with a single agent in a single conversation. That works for most tasks. But there are situations where you want more:

You want to run several tasks simultaneously instead of sequentially. You want to isolate a research-heavy task so it doesn't bloat your main conversation. You want a specialized worker for a specific kind of job (security review, test generation, documentation). You want to explore multiple approaches to a problem at the same time.

This is where subagents and parallel execution come in.

## Subagents: Isolated Workers

A subagent is a separate agent instance that runs in its own context window, does some work, and returns a summary to the calling agent [^1]. The details of what it read and explored stay in its own context. Only the result comes back to yours.

Think of it like delegating a research task to a colleague. You say "look into how our auth system handles token refresh and give me the key findings." They go read a dozen files, trace the flow, and come back with a paragraph. You get the answer without having to process all those files yourself.

### When to Use Subagents

The primary benefit is **context isolation** [^1]. Every file the agent reads, every command it runs, every tool output it processes, all of that accumulates in your context window. For a focused task, that's fine. But when you ask the agent to "review all the API endpoints for security issues," it might read 30 files, and now your context is full of code you don't need for the next task.

With a subagent, that review happens in a separate context. Your main conversation gets: "I found three potential issues: [summary]." Clean.

Use subagents when:

| Situation | Why a subagent helps |
|-----------|---------------------|
| Task reads many files but you only need a summary | Keeps main context lean |
| You want parallel research | Multiple subagents explore simultaneously |
| Specialized review (security, performance, style) | Dedicated context with focused instructions |
| Your context is getting full | Offload work to fresh context |

### How Subagents Work

The calling agent (your main session) spawns a subagent with:

1. A task description (the prompt)
2. Optional: skills or instructions to preload
3. Optional: tool restrictions

The subagent gets a fresh context window. It inherits the project's instruction file (CLAUDE.md/AGENTS.md) and git status, but not your conversation history [^1]. It does its work, then returns a summary to the calling agent.

In Claude Code, this happens through the Agent tool. In other harnesses, the mechanism varies, but the concept is the same: spawn an isolated worker, get back a result.

### Custom Subagents

Most tools let you define reusable subagent configurations. These specify what the subagent does, what tools it can access, and what instructions it follows [^2].

Example: a security reviewer subagent that has access to read files and search but cannot edit anything or run commands:

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools:
  - read
  - glob
  - grep
  - web_search
skills:
  - security-checklist
---

You are a security reviewer. Analyze the specified code for:
- Injection vulnerabilities (SQL, command, XSS)
- Authentication and authorization issues
- Sensitive data exposure
- Dependency vulnerabilities

Report findings with file paths, line numbers, severity, and remediation suggestions.
Do not suggest code changes; report findings only.
```

You can define these in your project (e.g., `.claude/agents/security-reviewer.md`) so they're available to everyone on the team [^2].

## Git Worktrees: Parallel File-Level Isolation

Subagents give you context isolation, but they still share the same files on disk. If two subagents try to edit the same file simultaneously, you get conflicts.

Git worktrees solve this. A worktree is a separate working directory that has its own files and branch, while sharing the same repository history [^3]. Each agent session works in its own worktree, so edits don't collide.

```bash
# Start Claude in an isolated worktree
claude --worktree feature-auth

# Start another in a different worktree
claude --worktree bugfix-123
```

Each session gets a fresh checkout. They can edit files freely without stepping on each other. When work is complete, you merge the branches normally.

This is the pattern that senior engineers use for parallel agentic work [^4]: spin up multiple agents in separate worktrees, each working on a different task. You review and merge the results as they come in.

### Practical Worktree Workflow

1. Identify two or three independent tasks from your backlog
2. Start an agent session in a worktree for each one
3. Give each agent its task and let them work
4. As agents finish, review their diffs
5. Merge clean results, iterate on anything that needs adjustment
6. Clean up worktrees

Some things to watch for:

**Environment setup.** Each worktree is a fresh checkout. It won't have your `node_modules`, `.env` files, or virtual environments. Some tools support a `.worktreeinclude` file to automatically copy gitignored files like `.env` into new worktrees [^3].

**Dependent tasks don't parallelize.** If task B depends on the output of task A, you can't run them simultaneously. Identify truly independent work before spinning up parallel agents.

**Review overhead.** Three agents producing code simultaneously means three sets of diffs to review. Don't start more parallel tasks than you can review promptly.

## Agent Teams

Some tools support a more advanced pattern: multiple agents that communicate with each other directly, coordinate through a shared task list, and work collaboratively on larger problems [^1].

This is different from subagents:

| | Subagents | Agent Teams |
|---|-----------|-------------|
| **Communication** | Reports back to the caller only | Teammates message each other directly |
| **Coordination** | Main agent manages everything | Self-coordination through shared task list |
| **Independence** | Focused, single-purpose tasks | Can challenge each other, share findings |
| **Cost** | Lower (summarized results) | Higher (each teammate is a full session) |

Agent teams are useful for complex work where multiple perspectives help: security audit from one agent while another checks performance, a researcher and an implementer working on the same feature, or competing hypotheses about a bug.

This is still an emerging pattern. Not all tools support it, and the cost is significant (each team member is a full agent session). But for the right problems, the results are substantially better than a single agent working alone.

## Orchestration Patterns

As you get comfortable with delegation, some patterns emerge:

### Fan-Out / Fan-In

Send the same codebase to multiple specialized reviewers, collect their findings, and synthesize.

```
Prompt: "Review the auth module. Spawn subagents for:
1. Security review
2. Performance review  
3. Test coverage analysis
Then synthesize the findings into a single report."
```

### Pipeline

Each step feeds into the next. Research produces a plan, the plan drives implementation, implementation feeds into testing.

```
Phase 1 (subagent): Research how the current system works
Phase 2 (main): Review findings and create implementation plan
Phase 3 (subagent in worktree): Implement the plan
Phase 4 (subagent): Run tests and verify
```

### Parallel Implementation

Multiple agents implementing different features simultaneously in separate worktrees.

```
Worktree 1: Add user avatar upload
Worktree 2: Implement notification preferences
Worktree 3: Add export-to-CSV feature
```

You merge each when it's ready, resolving any conflicts that arise.

## Practical Advice

**Don't over-parallelize.** Start with one subagent for a research task. Then try two parallel worktrees. Build up to more as you develop the review discipline to handle the output.

**Use subagents for research, worktrees for implementation.** Subagents are great when you need information back (code review, analysis, research). Worktrees are for when the agent needs to write code that you'll merge.

**Provide focused instructions.** A subagent with "review this code" will produce vague results. A subagent with "check these 5 specific security concerns in the auth module" produces actionable findings.

**Clean up.** Worktrees that accumulate without being merged or deleted clutter your repository. Close them out regularly.

## Exercises

1. Use a subagent to research a part of your codebase you're less familiar with. Notice how the research details stay out of your main context.
2. Define a custom subagent for a task you do repeatedly (code review, documentation check, test analysis).
3. Start two worktrees for independent tasks. Work on them in parallel and merge the results.
4. Try the fan-out pattern: send a piece of code to three different subagents with different review focuses.

## References

[^1]: Anthropic, "Extend Claude Code (Features Overview)," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/features-overview

[^2]: Anthropic, "Common Workflows," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/common-workflows

[^3]: Anthropic, "Common Workflows: Git Worktrees," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/common-workflows

[^4]: "5 Key Trends Shaping Agentic Development in 2026," *The New Stack*, 2026. https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/
