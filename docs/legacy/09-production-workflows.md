# Module 09: Production Workflows

## From Personal Use to Team Practice

The previous modules covered how to work effectively with a single agent. This module covers what happens when you take those skills to a team setting: integrating agents into CI/CD, running scheduled agent tasks, standardizing practices across a team, and managing the cost and risk profile of agentic coding at scale.

## Agents in CI/CD

The same agent that fixes bugs in your terminal can run in a CI pipeline. The interface changes (headless mode instead of interactive), but the underlying loop is identical [^1].

### Headless Mode

Every major agentic tool supports a non-interactive mode where you pass a prompt and get output without a conversation:

```bash
# Claude Code
claude -p "review the changes in this PR for security issues" --output-format json

# Codex
codex -p "analyze this diff for potential bugs"

# General pattern
<tool> -p "<prompt>" [--output-format text|json]
```

This lets you embed the agent as a step in any pipeline.

### Common CI/CD Use Cases

**Automated code review.** When a PR is opened, an agent reviews the diff and posts comments. This doesn't replace human review but catches common issues before a human looks at it [^1]:

```yaml
# GitHub Actions example
- name: AI Code Review
  run: |
    claude -p "Review the changes in this PR. Focus on:
    1. Security vulnerabilities
    2. Performance regressions
    3. Missing tests for new functionality
    Post findings as PR comments." \
    --output-format text
```

**Automated linting with judgment.** Beyond mechanical linting (which you can do with ESLint), an agent can flag style issues that require understanding context: inconsistent naming relative to the rest of the codebase, overengineered solutions, or missing error handling in critical paths.

**PR description generation.** The agent reads the diff and writes a PR description summarizing what changed and why. This saves time and produces more consistent documentation:

```bash
claude -p "Look at the changes on this branch vs main. 
Write a PR description with: summary, what changed, testing done."
```

**Test generation for uncovered changes.** When a PR modifies code without corresponding test changes, an agent can generate test suggestions or even create the tests directly.

### Practical CI/CD Setup

A few things to get right when running agents in CI:

**Be explicit about what success looks like.** The agent can't ask clarifying questions in CI. Your prompt needs to be complete and unambiguous. Define exactly what to check, what format to output in, and what action to take on findings [^1].

**Set timeouts.** Agents in CI don't have a human to interrupt them if they get stuck. Set reasonable time limits on agent steps.

**Cost controls.** Every CI run consumes API credits. Set up budget alerts or per-run limits so a misconfigured pipeline doesn't burn through your account.

**Keep prompts in version control.** The prompts you use for CI agent tasks should live alongside your code, not in CI configuration UIs. This way they get reviewed and versioned like any other code.

## Scheduled Agent Tasks

Some tasks benefit from running on a schedule without human initiation [^1]:

**Daily dependency audit.** An agent checks for known vulnerabilities in your dependencies every morning.

**Weekly PR cleanup.** An agent reviews stale PRs, pings authors, and summarizes the state of open work.

**Overnight test suite.** An agent runs the full integration test suite that's too slow for CI, reports failures by morning.

**Monitoring agent.** An agent periodically checks deployment health, log patterns, or performance metrics.

The scheduling mechanism varies by tool:

| Method | Where It Runs | When to Use |
|--------|--------------|-------------|
| Cloud-based scheduled tasks | Provider infrastructure | Tasks that should run even when your machine is off |
| Desktop scheduled tasks | Your local machine | Tasks needing local file/tool access |
| GitHub Actions cron | CI pipeline | Tasks tied to your repository |
| Loop commands | Current CLI session | Quick polling while you're working |

## Incident Response

The same pattern, an agent triggered by an event rather than by you, extends past CI into operations. When an alert fires, an agent can do the first-responder legwork: pull the relevant logs and metrics (often through an MCP connection to your observability stack), correlate them with recent deploys, form a ranked set of hypotheses, propose a mitigation, and draft the incident write-up for a human to approve.

This is real but early, and it sits at the high-autonomy, high-blast-radius end of everything in this workshop. An agent with the access to diagnose production also has the access to make an outage worse. So it only belongs behind the controls from the rest of this module and [Module 02](./02-environment-setup.md): scoped, least-privilege credentials, hard guardrails on destructive actions, and a human approval gate before anything it proposes touches production. Let it investigate and recommend freely; keep the act-on-it step gated.

## Team Standardization

When a team adopts agentic coding, consistency matters more than individual optimization. Three practices help:

### 1. Shared Instruction Files

Your AGENTS.md or CLAUDE.md lives in the repository. Everyone on the team gets the same conventions, build commands, and patterns. This is one of the strongest arguments for keeping instruction files in version control rather than in personal settings [^2].

When someone discovers a new convention the agent should follow, they add it to the instruction file and it's available to the whole team in the next pull.

### 2. Shared Subagent Definitions

Custom subagents defined in the project (e.g., `.claude/agents/`) are shared across the team. A security reviewer, a test generator, a documentation updater. Everyone gets the same specialized agents with the same instructions [^1].

### 3. Coding Guidelines for Agents (and Humans)

Stack Overflow's research emphasizes that coding guidelines for agents need to be more explicit and demonstrative than guidelines written for humans alone [^3]. Humans have intuition and can read between the lines. Agents follow what's written literally.

Good agent-facing guidelines:

**Show patterns, not just rules.** Instead of "use consistent error handling," show the exact error handling pattern and say "follow this pattern."

**Be explicit about what not to do.** Agents sometimes do things that experienced developers know to avoid but that aren't written down anywhere. If there's a common antipattern in your codebase, call it out.

**Include decision logic.** "Use approach A when X, use approach B when Y." Agents are good at following conditional rules when the conditions are clear.

## Cost Management

Agentic coding has a cost profile that's different from traditional development tools. You're paying per token, and agents can be verbose, reading many files and running many commands to complete a task.

### Understanding Costs

The main cost drivers:

**Context size.** Larger context windows cost more per request. Every file the agent reads, every command output it processes, adds to the context.

**Number of turns.** A complex task might involve dozens of tool uses, each a separate API call.

**Model selection.** More capable models cost more per token. Using Opus for a simple formatting task is wasteful; using Haiku for complex architectural reasoning is penny-wise and pound-foolish.

### Controlling Costs

**Match the model to the task.** Use cheaper, faster models for routine work (formatting, simple edits, boilerplate generation). Reserve expensive models for tasks that need strong reasoning (architectural decisions, complex debugging, multi-file refactoring) [^4].

**Keep context lean.** Everything from Module 03 (context engineering) directly affects your costs. Lean instruction files, scoped rules, on-demand skills all reduce the per-request context size.

**Use subagents for context isolation.** A subagent that reads 30 files and returns a paragraph costs less overall than reading those 30 files in your main context (which then costs more for every subsequent request in that session).

**Monitor usage.** Most tools provide usage dashboards or API usage data. Review periodically to identify wasteful patterns.

**Set budgets.** Per-user, per-project, or per-run budget limits prevent runaway costs from misconfigured automation or overly ambitious prompts.

## Security Considerations

Agents execute code on your machine (or in your CI environment). They can read files, run commands, and access any service you've connected via MCP. This brings real security considerations [^5]:

**Review before executing.** The agent proposes actions; you approve them. Don't auto-approve commands that touch production systems, credentials, or external services until you've built trust with the specific workflow.

**Credential management.** Don't put API keys, database passwords, or other secrets in your instruction files or commit them to git. Use environment variables and `.env` files that are gitignored.

**Sandbox sensitive operations.** For CI/CD agent tasks, run them in containers with limited permissions. An agent that can review code doesn't need write access to the production database.

**Audit agent actions.** Keep logs of what agents do, especially in CI and scheduled tasks. If an agent makes an unexpected change, you want to trace what happened.

**Supply chain awareness.** MCP servers, plugins, and skills are code that runs in your environment. Audit them before installing, and prefer well-known, maintained packages.

## Exercises

1. Set up a headless agent run that reviews a diff and produces a summary. Integrate it into a GitHub Action or similar CI step.
2. Create a scheduled agent task that runs daily (a dependency check, a stale PR review, or a code quality report).
3. Review your team's instruction file. Is anything missing that would help a new team member's agent produce consistent results?
4. Set up cost monitoring for your agent usage. Identify the most expensive session from the past week and analyze whether the cost was justified.

## References

[^1]: Anthropic, "Common Workflows," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/common-workflows

[^2]: "AGENTS.md: The Open Standard," *Agentic AI Foundation*, 2026. https://agents.md/

[^3]: "Building Shared Coding Guidelines for AI (and People Too)," *Stack Overflow Blog*, 2026. https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/

[^4]: "Everything Claude Code," *GitHub (affaan-m)*, 2026. https://github.com/affaan-m/everything-claude-code

[^5]: "Awesome Claude Code," *GitHub (hesreallyhim)*, 2026. https://github.com/hesreallyhim/awesome-claude-code
