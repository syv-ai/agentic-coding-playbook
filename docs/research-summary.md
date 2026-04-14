# Research Summary and Sources

This document summarizes the research that informed the workshop content, organized by theme. It serves as a reference for workshop facilitators and attendees who want to go deeper.

## Primary Sources

### Official Documentation

1. **Claude Code Documentation** (Anthropic, 2026)
   - [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works): Definitive reference on the agentic loop architecture, tool categories, context management, and session handling.
   - [Extend Claude Code (Features Overview)](https://code.claude.com/docs/en/features-overview): Complete taxonomy of extension mechanisms: CLAUDE.md, skills, MCP, subagents, agent teams, hooks, plugins. Includes context cost analysis and feature comparison tables.
   - [Common Workflows](https://code.claude.com/docs/en/common-workflows): Practical workflow patterns for codebase exploration, debugging, refactoring, testing, PR creation, parallel sessions via git worktrees, headless/CI usage, and scheduled tasks.

### Anthropic Engineering Blog

2. **[Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)** (Anthropic, 2025): The foundational paper on context engineering. Key concepts: the altitude problem (too specific vs. too vague instructions), just-in-time context retrieval, compaction strategies, sub-agent architectures, and the principle of "find the smallest set of high-signal tokens." Introduces the concept of "context rot" (accuracy degradation as context grows).

3. **[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)** (Anthropic, 2025): Research on multi-session agent patterns. Key findings: the initializer/worker two-agent pattern, JSON feature lists as contracts between sessions, one-feature-at-a-time constraint, importance of git commits as progress checkpoints, and browser-based end-to-end verification.

### Industry Analysis and Best Practices

4. **[Agentic AI Coding: Best Practice Patterns for Speed with Quality](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality)** (CodeScene, 2026): Research-backed patterns for maintaining code quality with agents. Key contributions: code health as a prerequisite for agent work (target 9.5+/10.0), three-layer quality gates (real-time, pre-commit, PR), the refactoring-first approach, coverage as a regression signal rather than vanity metric. The central thesis: "Speed amplifies both good design and bad decisions."

5. **[How to Build Agentic Coding Workflows That Actually Ship](https://codegen.com/blog/how-to-build-agentic-coding-workflows/)** (Codegen, 2026): Practical workflow architecture. Identifies five components: task input, context assembly, sandbox execution, PR output, and review. Key insight: the rate-limiting factor is task specification quality, not model capability. Categorizes tasks by success rate (migrations/bug fixes = high, cross-cutting/greenfield = lower).

6. **[Building Shared Coding Guidelines for AI (and People Too)](https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/)** (Stack Overflow Blog, 2026): How to write coding guidelines that work for both humans and agents. Key finding: agent-facing guidelines must be more explicit and demonstrative than human-facing ones. Agents follow what's written literally and lack the intuition to read between the lines.

7. **[5 Key Trends Shaping Agentic Development in 2026](https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/)** (The New Stack, 2026): Industry trend analysis. Five trends: MCP management challenges, parallel task execution for senior engineers, CLI vs. desktop app differentiation, agent-driven commerce, and VS Code forking challenges.

### Standards and Ecosystem

8. **[AGENTS.md](https://agents.md/)** (Agentic AI Foundation / Linux Foundation, 2026): The open standard for guiding coding agents. A simple Markdown format supported by Claude Code, Codex, Cursor, OpenCode, and others. Recommendation: start with a single file, split when it exceeds 150-200 lines.

9. **[How to Build Your AGENTS.md](https://www.augmentcode.com/guides/how-to-build-agents-md)** (Augment Code, 2026): Practical guide to writing effective instruction files. Key finding: frontier LLMs follow roughly 150-200 instructions consistently; tool system prompts consume approximately 50 of those slots.

10. **[How to Use AGENTS.md with Codex, Cursor, and Claude Code](https://benjamincrozat.com/agents-md)** (Benjamin Crozat, 2026): Cross-tool setup guide showing how AGENTS.md is loaded by different tools.

### Community Resources

11. **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)** (affaan-m, GitHub): 140K+ stars, Anthropic hackathon winner. A comprehensive agent harness performance system covering skills, agents, hooks, rules, and memory across 12+ language ecosystems. Evolved over 10+ months of daily use. Key contributions: the concept of "instincts" (learned patterns with confidence scoring), continuous learning hooks, multi-agent orchestration via PM2, cross-harness support (Claude Code, Cursor, Codex, OpenCode, Gemini).

12. **[Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)** (hesreallyhim, GitHub): Curated list of skills, agents, plugins, hooks, and tools for agentic coding. Valuable for discovering community-built extensions and MCP servers.

### Tool Landscape

13. **[Best Open Source AI Coding Agents in 2026](https://www.opensourceaireview.com/blog/best-open-source-ai-coding-agents-in-2026-ranked-by-developers)** (Open Source AI Review, 2026): Rankings and comparison of open-source coding agents.

14. **[9 Best AI Coding Agents in 2026, Ranked](https://www.mightybot.ai/blog/coding-ai-agents-for-accelerating-engineering-workflows)** (MightyBot, 2026): Comprehensive comparison including both open-source and commercial tools.

15. **[The Complete Guide to Agentic Coding in 2026](https://www.teamday.ai/blog/complete-guide-agentic-coding-2026)** (TeamDay, 2026): Overview of the agentic coding landscape.

16. **[Coding with AI Agents: Best Practices for 2026](https://nimbalyst.com/blog/coding-with-ai-agents-best-practices-2026/)** (Nimbalyst, 2026): Practitioner-oriented best practices.

## Key Themes Across Sources

### Context Engineering Is the Core Skill
Every source converges on this point. The quality of agent output depends primarily on the information available to the agent, not on prompt cleverness or model selection. Anthropic's context engineering paper [2] provides the theoretical framework. CodeScene [4] and Codegen [5] provide practical validation. The AGENTS.md standard [8] provides the implementation format.

### Verification Cannot Be Optional
CodeScene [4] provides the strongest evidence: automated quality gates at three levels (real-time, pre-commit, PR) are necessary to prevent quality regression. Codegen [5] adds that poor PRs typically indicate underspecified requirements, not agent failures. Anthropic's harness research [3] emphasizes that agents mark features complete prematurely without explicit verification prompts.

### Start Minimal, Evolve from Observed Failures
Anthropic's documentation [1] explicitly recommends a trigger-based approach to adding features. The everything-claude-code project [11] demonstrates this in practice: its 180+ skills and 47 agents were built incrementally over 10+ months, each addressing a real need. This aligns with the context engineering principle [2] of starting minimal and adding complexity only when failures demand it.

### Parallel Execution Is Standard Practice
The New Stack [7] identifies parallel task execution as a defining trend of 2026. Claude Code's worktree support [1] provides the mechanism. The pattern: spin up isolated worktrees, let agents work independently, review and merge results.

### Instructions Need to Be More Explicit for Agents Than for Humans
Stack Overflow [6] and Augment Code [9] both emphasize that agents lack the intuition humans use to fill gaps in guidelines. Show patterns, not just rules. Include decision logic. Be explicit about what not to do.

### Code Health Is a Prerequisite for Enterprise Adoption
CodeScene's benchmarks [17] show the average enterprise codebase scores 5.15/10, well below the 9.4+ threshold for safe agent work. Unguided refactoring produces shallow, cosmetic changes; guided refactoring with explicit health targets yields 2–5x more structural improvement. Legacy code uplift must precede agentic acceleration.

### Task Specification Quality Is the Bottleneck
Codegen [5], Addy Osmani [18], and the agentic PRD literature [19] all converge: the rate-limiting factor is what goes into the agent before execution starts. GitHub's analysis of 2,500+ agent configs identifies six essential sections. The three-tier boundary system (always/ask first/never) is the most effective constraint format.

### The Collaboration Paradox
Anthropic's Trends Report [16] reveals that developers use AI in ~60% of work but fully delegate only 0–20% of tasks. Effective AI collaboration requires active supervision, not hands-off delegation. A controlled study found experienced developers were 19% slower with AI tools due to "comprehension debt" [20]. This shapes how organizations should think about adoption.

## Additional Sources (Modules 11–13)

16. **[2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report)** (Anthropic, 2026): Eight trends defining agentic coding in 2026 across foundation, capability, and impact categories. Key data: the collaboration paradox (60% AI use, 0–20% full delegation), role transformation from implementer to orchestrator, onboarding collapse from weeks to hours, timeline compression changing project viability, and the economics shift toward output volume over individual speed.

17. **[Making Legacy Code AI-Ready: Benchmarks on Agentic Refactoring](https://codescene.com/blog/making-legacy-code-ai-ready-benchmarks-on-agentic-refactoring)** (CodeScene, 2026): Quantitative benchmarks on code health and agent performance. Average IT code health: 5.15/10. Agent safety threshold: 9.4+. MCP-guided refactoring produces 2–5x more structural improvement. Uplifted codebases achieve ~50% lower token consumption.

18. **[How to Write a Good Spec for AI Agents](https://addyosmani.com/blog/good-spec/)** (Addy Osmani, 2026): Comprehensive methodology for agent-ready specifications. Five principles: vision first, structured document architecture (six sections from GitHub analysis of 2,500+ configs), modular context, self-checks and constraints, iterative evolution. Introduces the three-tier boundary system and spec-driven development model.

19. **[Agentic PRD: Designing Requirements for AI-Driven Engineering](https://prodmoh.com/blog/agentic-prd)** (ProdMoh, 2026): Reframes PRDs as machine-readable, versioned, executable artifacts for both humans and agents. Key insight: structured acceptance criteria as predicates, invariants, and example-driven assertions.

20. **[Coding with AI Agents: Best Practices for 2026](https://nimbalyst.com/blog/coding-with-ai-agents-best-practices-2026/)** (Nimbalyst, 2026): Practitioner best practices including comprehension debt research (experienced developers 19% slower with AI despite predicting 24% faster).

21. **[AI Agent Observability: The New Standard for Enterprise AI](https://www.n-ix.com/ai-agent-observability/)** (N-iX, 2026): Framework for agent observability covering traces, metrics, and alerting. OpenTelemetry semantic conventions for agent instrumentation.

22. **[15 AI Agent Observability Tools in 2026](https://aimultiple.com/agentic-monitoring)** (AI Multiple, 2026): Landscape of observability platforms for agent workflows including Langfuse, Arize, LangSmith, and Maxim.

## Additional Sources (Module 14)

23. **[Scaling Coding Agents via Atomic Skills](https://arxiv.org/html/2604.05013)** (arXiv, April 2026): Defines five fundamental atomic skills for software engineering (localization, editing, test generation, issue reproduction, code review). Joint reinforcement learning across all five produces 18.7% improvement on composite downstream tasks. Key insight: training on atomic skills generalizes to unseen composite problems without task-specific training.

24. **[Why I Believe the Atomic Agents Framework](https://hyscaler.com/insights/ai-with-atomic-agents-framework/)** (HyScaler, 2026): Practical framework for single-responsibility agent design. Each agent has a run method, input schema, and output schema defined via Pydantic. Side effects handled deterministically in regular code, not in agent logic.

25. **[Think Small to Scale Big for Agentic AI Efficiency](https://medium.com/@khayyam.h/think-small-to-scale-big-for-agentic-ai-efficiency-8863a887b3f2)** (Khayyam H., Medium, 2026): The Executive-Worker pattern and knowledge distillation pipeline. High-reasoning LLMs generate synthetic training data for 1B–8B parameter Worker SLMs. 10–30x cost advantage for structured tasks. New KPIs: tokens per joule, cost-per-successful-outcome, agentic operational capacity. Core thesis: "the failure mode in production agentic systems is never insufficient model power—it's insufficient coordination."

26. **[Agentic Workflows for Software Development](https://medium.com/quantumblack/agentic-workflows-for-software-development-dc8e64f4a79d)** (QuantumBlack / McKinsey, 2026): Two-layer architecture separating deterministic orchestration from agent-driven execution. Spec-Driven Development (SDD) convention with .sdlc/ folder hierarchy. Key finding: agents "routinely skipped steps, created circular dependencies, or got stuck in analysis loops" when given workflow-level decisions. Orchestration must be rule-based, not agent-driven.
