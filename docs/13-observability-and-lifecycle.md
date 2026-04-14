# Module 13: Observability, Traceability, and Lifecycle Management

## What You Can't See Can Hurt You

When a human developer writes code, the process is largely invisible but the output is small and reviewable. When an agent writes code, the process involves dozens of tool calls, file reads, command executions, and reasoning steps, most of which scroll past too fast to follow or happen in background workers you're not watching.

For a solo developer running a single agent interactively, this is manageable. You're there, you see the work happening, you review the result. But when agents run in CI, on schedules, in parallel, or across a team, you need structured visibility into what they're doing, how much they cost, and whether they're producing good results.

This module covers the observability and lifecycle management practices that make agentic coding sustainable at scale.

## The Three Pillars of Agent Observability

Borrowing from traditional systems observability, agent observability rests on three pillars [^1]:

### 1. Tracing

A trace follows a single task from initial prompt through every tool call, file read, edit, and command execution to the final result. It's the complete record of what the agent did and why.

What to capture in a trace:

| Data Point | Why It Matters |
|------------|----------------|
| Input prompt | What was the agent asked to do |
| Tool calls (name, arguments, result) | The specific actions taken |
| Files read and edited | What code was examined and changed |
| Commands run and their output | What was executed on the system |
| Model used and tokens consumed | Cost attribution |
| Total duration and latency per step | Performance analysis |
| Final outcome (success, failure, partial) | Was the task completed |

Most agentic tools log sessions locally. Claude Code stores sessions as JSONL in `~/.claude/projects/`. Other tools have their own storage formats. For team visibility, you need these traces in a shared system.

### 2. Metrics

Aggregate data over time. Not individual traces, but patterns:

**Cost metrics.** Token spend per developer, per project, per task type. Which workflows are expensive? Which are cheap? Is cost trending up or down?

**Quality metrics.** How often do agent-generated PRs get approved on first review? How often do they need rework? What percentage of agent runs end in success vs. failure?

**Throughput metrics.** Tasks completed per day, average task duration, time from issue to merged PR. Are agents actually accelerating your delivery?

**Error metrics.** Agent failures, timeout rates, permission denials, test failures. Where are agents struggling?

### 3. Alerting

Proactive notification when something needs attention:

**Cost alerts.** A single agent session burning through an unusual amount of tokens. A daily CI run that suddenly costs 10x more than usual.

**Failure alerts.** Scheduled agent tasks that fail silently. CI agent runs that timeout.

**Quality alerts.** A sudden increase in agent-generated PRs requiring rework. Coverage regression triggered by agent changes.

## Practical Observability Setup

You don't need a dedicated observability platform on day one. Start with what you have.

### Level 1: Local Session Logs

Every agentic tool already logs sessions. The simplest observability is reviewing those logs.

For Claude Code, sessions are in `~/.claude/projects/`. You can search them, review individual sessions, or write scripts to extract metrics.

For CI runs, capture the agent's output as a build artifact. When something goes wrong, you have the full trace.

### Level 2: Cost Tracking

Most API providers offer usage dashboards. Review them weekly:

1. Which projects are consuming the most tokens?
2. Which developers are running the most expensive sessions?
3. Are there runaway costs from misconfigured automation?

Set up billing alerts. Every API provider supports them. There's no reason to discover a cost spike at the end of the month.

For more granularity, tools like ccxray (from the awesome-claude-code repository [^2]) sit between the agent and the API as a transparent proxy, capturing every request with token counts and cost tracking in a visual dashboard.

### Level 3: Shared Tracing

For teams, centralize traces. Options range from lightweight (shared log files, a simple database) to full platforms:

**Lightweight.** Write a hook that logs each agent session summary (task, duration, tokens, outcome) to a shared spreadsheet or database. Review weekly.

**Mid-weight.** Use general-purpose observability tools (OpenTelemetry, Datadog, Grafana) with custom instrumentation for agent metrics.

**Full platforms.** Dedicated agent observability tools like Langfuse, Arize, or LangSmith provide purpose-built tracing, evaluation, and dashboards [^1]. These make sense when you're running agents at significant scale.

OpenTelemetry has established standardized semantic conventions for AI agent observability [^1], so if you're already using OTel for your application monitoring, extending it to cover agent workflows is a natural step.

## Lifecycle Management

An agent interaction doesn't start when you type a prompt and end when the agent responds. There's a lifecycle around it, especially for tasks that span sessions, run in CI, or execute on schedules.

### The Task Lifecycle

```
Specification  ->  Planning  ->  Execution  ->  Review  ->  Merge  ->  Monitor
     |                |              |             |           |           |
  PRD/Issue      Plan mode      Agent work    Human review   Ship    Watch for
  creation       analysis       + self-test   + CI gates            regressions
```

Each stage has different observability needs:

**Specification.** Track which specs lead to successful agent work and which lead to repeated failures. Specs that consistently produce rework need improvement (see Module 11).

**Planning.** If you use plan mode, save the plan. When execution diverges from the plan, that's a signal that either the plan was incomplete or the agent went off course.

**Execution.** Full tracing (tool calls, file changes, costs). This is where most observability effort goes.

**Review.** Track review metrics: time to review, number of comments, rework requests. These tell you about the quality of what agents are producing.

**Post-merge.** Monitor the deployed changes. Do agent-generated changes cause more production incidents than human-generated ones? This closes the feedback loop.

### Session Lifecycle

For interactive work:

**Start.** The agent loads your instruction file, skill descriptions, MCP connections. Verify this is happening correctly. If a skill fails to load or an MCP server disconnects, the agent operates with less context than you expect.

**Work.** The agentic loop runs. This is where tracing happens.

**Compaction.** As context fills, the agent compacts. Information may be lost. Monitor for signs of context degradation (Module 08).

**End.** Session summary, progress notes, git commits. Clean state for the next session.

For automated work (CI, scheduled tasks):

**Trigger.** What initiated the run? A PR event, a cron schedule, a manual trigger.

**Execution.** Full trace with timeout handling. Automated runs that hang silently are a common problem.

**Output.** What did the agent produce? PR comments, created issues, committed code, Slack messages. Log all outputs.

**Cleanup.** Worktrees removed, temporary files cleaned up, connections closed.

## Token Economics in Practice

Understanding your token spend requires more than looking at the monthly bill. You need to know where the tokens go.

### Cost Attribution

Break down costs by:

**Task type.** Bug fixes are usually cheap (small context, few iterations). Feature implementation varies widely. Code review is moderate. Research tasks can be expensive (many file reads).

**Session phase.** Context loading (instruction file, skills, MCP tool definitions) is a fixed per-request cost. File reads scale with codebase exploration. Edits and verification are relatively cheap per action but add up over many iterations.

**Model choice.** Using the most capable model for every task is wasteful. Use cheaper models for routine work. Reserve expensive models for complex reasoning.

### Model Routing

Most tools support multiple models. A practical routing strategy:

| Task | Appropriate Model |
|------|-------------------|
| Simple edits, formatting, boilerplate | Fast/cheap (Haiku, GPT-4o mini) |
| Standard feature work, bug fixes | Mid-tier (Sonnet, GPT-4o) |
| Complex architecture, multi-file refactoring | Top-tier (Opus, o3) |
| Code review, analysis | Mid-tier is usually sufficient |

Some tools support automatic model routing based on task complexity. For others, you switch manually. Either way, matching model capability to task complexity is one of the highest-leverage cost optimizations.

### Budget Practices

**Set per-developer monthly budgets.** Not to micromanage, but to surface unusual patterns early.

**Set per-run limits for CI.** A misconfigured CI agent can burn through a day's budget in minutes. Hard limits prevent this.

**Review the top 10 most expensive sessions weekly.** Were they justified? Could they have been cheaper with better prompting, model routing, or task decomposition?

**Track cost per merged PR.** This is the metric that connects token spend to business value. If agent-assisted PRs cost $5 in tokens and save 2 hours of developer time, the ROI is clear. If they cost $50 and save 20 minutes, the economics are different.

## Exercises

1. Review your last week of agent sessions. Calculate the total token spend. Identify the most expensive session and analyze whether it was cost-effective.
2. Set up a billing alert with your API provider at a level that would catch a 3x cost spike.
3. For your next CI agent integration, capture the full session output as a build artifact.
4. Create a lightweight tracking system (even a spreadsheet) that logs: task, model used, tokens, duration, outcome, rework needed. Fill it in for one week and review the patterns.

## References

[^1]: "AI Agent Observability: The New Standard for Enterprise AI in 2026," *N-iX*, 2026. https://www.n-ix.com/ai-agent-observability/ / "15 AI Agent Observability Tools in 2026," *AI Multiple*, 2026. https://aimultiple.com/agentic-monitoring

[^2]: "Awesome Claude Code," *GitHub (hesreallyhim)*, 2026. https://github.com/hesreallyhim/awesome-claude-code

[^3]: Anthropic, "2026 Agentic Coding Trends Report," Trend 6, 2026. https://resources.anthropic.com/2026-agentic-coding-trends-report
