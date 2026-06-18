# Agentic Coding Workshop: From Zero to Hero

A fourteen-module workshop covering agentic coding from first principles to enterprise adoption. Tool-agnostic. The concepts apply to Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and any agentic coding harness.

Built from research across 26 primary sources including Anthropic's 2026 Agentic Coding Trends Report, peer-reviewed papers, and production case studies.

---

## Part 1: Foundations

The basics. What agentic coding is, how the underlying loop works, and how to get set up with any tool.

### [00 — Introduction](docs/00-introduction.md)

What agentic coding is, how it differs from autocomplete, and why it matters now. Lays out the five principles that run through the entire workshop: context is the product, verify then trust, start minimal, treat instructions like code, and delegate don't dictate.

### [01 — The Agentic Loop](docs/01-the-agentic-loop.md)

The universal architecture behind every AI coding agent: gather context, take action, verify results, repeat. Covers tools, harnesses, models, and your role in the loop. If you only read one module, this is the mental model that makes everything else click.

### [02 — Setting Up Your Environment](docs/02-environment-setup.md)

Practical guide to the 2026 tool landscape: Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and others. Installation patterns, the instruction file (AGENTS.md, CLAUDE.md, .cursorrules), project structure, permissions, and running your first session.

---

## Part 2: Core Skills

The skills that separate developers who get consistent results from those who get expensive randomness.

### [03 — Context Engineering Fundamentals](docs/03-context-engineering.md)

The single most important module. Context engineering is the practice of curating what information the agent has access to, and when. Covers the instruction file in depth, what belongs and what doesn't, scoped rules, skills as on-demand knowledge, the altitude problem (too specific vs. too vague), just-in-time context retrieval, and the feedback-driven approach to evolving your setup.

### [04 — Effective Prompting for Agents](docs/04-effective-prompting.md)

Prompting an agent is not prompt engineering. It's more like writing a task brief for a contractor. Covers the spectrum from vague to precise, five patterns for better prompts (reference existing patterns, include verification criteria, separate research from implementation, scope explicitly, provide invisible constraints), conversational iteration, anti-patterns, and task sizing.

### [05 — Tools, MCP, and External Connections](docs/05-tools-and-mcp.md)

How agents interact with the world beyond your codebase. Built-in tool categories (files, search, execution, web, code intelligence), Model Context Protocol for connecting to databases, Slack, project management tools, and other external services. Hooks for deterministic automation. How tools, MCP, and hooks compose together.

### [06 — Verification and Quality Gates](docs/06-verification-and-quality.md)

Speed amplifies both good design and bad decisions. Covers three layers of verification: the agent checking its own work, automated quality gates (linting, type checking, coverage regression, static analysis at three checkpoints), and human review of the diff. The refactoring-first approach, TDD with agents, end-to-end verification, and building a complete quality pipeline.

---

## Part 3: Advanced Patterns

Delegation, parallelism, long-running work, and building your own system.

### [07 — Subagents and Parallel Execution](docs/07-subagents-and-parallelism.md)

When one agent isn't enough. Subagents for context isolation and focused work, custom subagent definitions for reusable specialized workers, git worktrees for parallel file-level isolation, agent teams for collaborative multi-session work. Orchestration patterns: fan-out/fan-in, pipeline, and parallel implementation.

### [08 — Long-Running Agents and Memory](docs/08-long-running-agents.md)

What happens when context fills up. Compaction strategies and how to direct them, structured note-taking as external memory, the initializer/worker pattern for multi-session projects, JSON feature lists as contracts between sessions, session management (naming, resuming, forking), and persistent memory systems.

### [09 — Production Workflows](docs/09-production-workflows.md)

Taking agentic coding from personal use to team practice. Headless mode for CI/CD integration, automated code review in pipelines, PR description generation, scheduled agent tasks (daily audits, weekly cleanup, overnight test runs), team standardization through shared instruction files and subagents, coding guidelines for agents, cost management, and security considerations.

### [10 — Building Your Own Agentic System](docs/10-building-your-system.md)

The step-by-step guide. Audit your workflow, create your instruction file, set up verification, run your first real task, add complexity incrementally based on observed needs, define specialized agents, establish multi-session patterns, and scale to the team. Includes a complete example setup showing what a mature agentic configuration looks like in practice.

---

## Part 4: Organization and Scale

The strategic and operational challenges of rolling agentic coding out across an organization.

### [11 — From Business Context to Agent Tasks](docs/11-from-business-context-to-agent-tasks.md)

The upstream pipeline most tutorials skip. Going from business needs through product vision, PRDs, and technical specs to agent-ready task prompts. Writing agent-ready PRDs (the six essential sections from GitHub's analysis of 2,500+ configs), the three-tier boundary system (always/ask first/never), the spec-as-artifact pattern, spec-driven development, and using agents to write specs. Connecting business context to technical work.

### [12 — Succeeding with Agentic Coding in Enterprise Codebases](docs/12-enterprise-adoption.md)

Enterprise codebases bring specific challenges. Code health as a prerequisite (average IT score: 5.15/10, agent safety threshold: 9.4+), the refactoring-first workflow, vendor lock-in and portability strategies across the full stack, organizational ownership (who owns what), resources and investment (direct costs, indirect costs, the economics argument), the collaboration paradox (60% AI use but only 0–20% full delegation), comprehension debt (experienced devs 19% slower with AI), and the build-and-rebuild mindset.

### [13 — Observability, Traceability, and Lifecycle Management](docs/13-observability-and-lifecycle.md)

What you can't see can hurt you. The three pillars of agent observability (tracing, metrics, alerting), practical setup at three levels (local logs, cost tracking, shared tracing platforms), the full task lifecycle from specification through monitoring, session lifecycle management, and token economics in practice: cost attribution, model routing strategies, and budget practices including cost-per-merged-PR as the metric that connects spend to value.

### [14 — Software Distillation and Atomic Agents](docs/14-software-distillation-and-atomic-agents.md)

The architecture of scale. Atomic skills research (five fundamental building blocks that compose into all software engineering tasks, with 18.7% improvement on composite tasks from joint training). Single-responsibility agent design with clear input/output contracts. The Executive-Worker pattern (10–30x cost advantage for structured tasks). Three forms of software distillation: pattern distillation, spec distillation, and workflow distillation. McKinsey's finding that orchestration must be deterministic code, not agent-driven, because agents "routinely skip steps and create circular dependencies" when given workflow-level decisions.

---

## Supplementary

### [Research Summary](docs/research-summary.md)

Complete annotated bibliography of all 26 primary sources organized by theme. Key findings per source, cross-cutting themes, and guidance for further reading. Covers Anthropic's official documentation and engineering blog, the 2026 Agentic Coding Trends Report, CodeScene's code health benchmarks, Codegen's workflow research, the AGENTS.md standard, community projects (everything-claude-code, awesome-claude-code), the atomic skills paper, McKinsey/QuantumBlack's enterprise workflows, and more.

---

## Skills

A companion **[skills collection](skills/)** ships alongside the modules — a curated, best-of-breed set of agentic-coding skills (planning, execution, quality, verification) distilled from [`mattpocock/skills`](https://github.com/mattpocock/skills) and [`obra/superpowers`](https://github.com/obra/superpowers), plus skills written for this playbook. Where the modules teach the *why*, the skills are the *how* — installable workflows your agent runs.

Install into any project:

```bash
npx skills add syv-ai/agentic-coding-playbook
```

Or, inside Claude Code, install it as a native plugin (supports `/plugin update`):

```
/plugin marketplace add syv-ai/agentic-coding-playbook
/plugin install syv-skills@syv-skills
```

Either way, then run:

```
/setup-syv-skills
```

The collection is self-contained and tool-agnostic in spirit. See [skills/README.md](skills/README.md) for the full catalog and [skills/ATTRIBUTION.md](skills/ATTRIBUTION.md) for provenance and licensing.

## How to Use This

**As a workshop facilitator.** Each module works as a standalone 20–30 minute presentation unit. The docs are the leave-behind reference material. Build slides and visuals on top of these. Part 1 and 2 cover a half-day. Parts 3 and 4 fill a second half-day or can be split across sessions.

**As a self-study guide.** Read the modules in order. Each builds on the previous. Do the exercises at the end of each module. You can get through the whole thing in a day, or spread it over a week doing one part at a time.

**As a team reference.** Share the docs after the workshop. The research summary gives anyone who wants to go deeper a curated starting point. The instruction file templates and workflow patterns in Modules 03, 10, and 11 are immediately reusable.

## License

MIT
