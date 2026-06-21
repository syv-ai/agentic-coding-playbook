# Agentic Coding: From Zero to Hero

## What This Workshop Is About

Most developers today have used some form of AI code completion. You type a few characters, the model guesses the rest of the line, and you hit tab. That's useful, but it's not what we're here to talk about.

Agentic coding is a fundamentally different way of working. Instead of an autocomplete that fills in blanks, you have an AI agent that operates in a loop: it reads your codebase, reasons about what needs to change, edits files, runs commands, checks the results, and keeps going until the task is done [^1]. Your role shifts from typing code to steering the agent, reviewing its work, and making judgment calls about direction.

This workshop walks you through that shift, from scratch, in ten progressive modules. Each one builds on the previous. By the end you'll know how to set up an agentic coding environment, write instructions that agents actually follow, manage context across long sessions, run multiple agents in parallel, and ship the results with confidence.

## Why Now

A few things have converged to make this the right time to learn these skills.

AI coding agents have gone mainstream. Claude Code, OpenAI Codex, Cursor, Gemini CLI, OpenCode, and several others are in daily use by millions of developers [^2][^3]. They're no longer experimental curiosities.

The core skill has changed. It used to be about writing clever prompts. Now it's about **context engineering**: making sure the agent has the right information, at the right time, in the right format [^4]. That's a learnable, transferable skill, and it's what separates developers who get consistent results from those who get expensive randomness.

Parallel execution is normal now. Senior engineers regularly spin up multiple agents working on different tasks simultaneously using git worktrees [^5]. That's a workflow that simply didn't exist two years ago.

There's an open standard for agent instructions. AGENTS.md, stewarded by the Agentic AI Foundation under the Linux Foundation, gives you a single format that works across Claude Code, Codex, Cursor, and other tools [^6]. You write your instructions once.

And quality gates have become essential, not optional. When agents can produce code fast, speed amplifies both good design and bad decisions equally [^7]. The teams that ship well are the ones with solid verification practices.

## Principles

This workshop is tool-agnostic. We reference specific tools for concrete examples, but every concept works across any agentic coding harness. The patterns apply whether you're using Claude Code, Codex, Cursor, OpenCode, Gemini CLI, or whatever comes next.

Five ideas run through everything:

1. **Context is the product.** Your agent's output quality is a direct function of the context you provide [^4].
2. **Verify, then trust.** Never merge AI-generated changes without reading the diff [^8].
3. **Start minimal, add when it breaks.** Complexity should come from observed failures, not upfront speculation [^4].
4. **Treat instructions like code.** Your CLAUDE.md, AGENTS.md, or .cursorrules files deserve version control and review, just like your source [^9].
5. **Delegate, don't dictate.** Give the agent context and direction. Let it figure out the details [^1].

## Structure

| Module | Title | What You'll Learn |
|--------|-------|-------------------|
| **01** | [The Agentic Loop](./01-the-agentic-loop.md) | How AI coding agents actually work under the hood |
| **02** | [Setting Up Your Environment](./02-environment-setup.md) | Installing and configuring any agentic coding tool |
| **03** | [Context Engineering Fundamentals](./03-context-engineering.md) | Writing instructions that agents follow reliably |
| **04** | [Effective Prompting for Agents](./04-effective-prompting.md) | From vague requests to precise, verifiable task specs |
| **05** | [Tools, MCP, and External Connections](./05-tools-and-mcp.md) | Extending agents with tools and external services |
| **06** | [Verification and Quality Gates](./06-verification-and-quality.md) | Testing, review, and safeguards for generated code |
| **07** | [Subagents and Parallel Execution](./07-subagents-and-parallelism.md) | Delegation, isolation, worktrees, and multi-agent work |
| **08** | [Long-Running Agents and Memory](./08-long-running-agents.md) | Context management, compaction, and multi-session continuity |
| **09** | [Production Workflows](./09-production-workflows.md) | CI/CD integration, scheduled tasks, and team adoption |
| **10** | [Building Your Own Agentic System](./10-building-your-system.md) | Putting it all together into a customized setup |
| **11** | [From Business Context to Agent Tasks](./11-from-business-context-to-agent-tasks.md) | PRDs, specs, issue decomposition, and the upstream pipeline |
| **12** | [Enterprise Adoption](./12-enterprise-adoption.md) | Code health, vendor lock-in, org ownership, comprehension debt |
| **13** | [Observability and Lifecycle](./13-observability-and-lifecycle.md) | Tracing, cost tracking, monitoring, and token economics |
| **14** | [Software Distillation and Atomic Agents](./14-software-distillation-and-atomic-agents.md) | Decomposition, single-responsibility agents, model routing, and distillation patterns |

## Who This Is For

If you've never used an AI coding agent, Module 01 starts from scratch.

If you use Copilot or similar autocomplete tools and want to understand the agentic approach, Modules 03 through 06 bridge that gap.

If your team is adopting agentic workflows and you need production-level patterns, Modules 07 through 10 are where to focus.

If you're rolling out agentic coding across an organization or dealing with enterprise-scale codebases, Modules 11 through 13 address the strategic and operational challenges.

No AI or ML background required. You need a terminal, a code editor, and access to at least one AI coding agent. Free tiers work fine for following along.

## References

[^1]: Anthropic, "How Claude Code Works," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works

[^2]: "Best Open Source AI Coding Agents in 2026," *Open Source AI Review*, 2026. https://www.opensourceaireview.com/blog/best-open-source-ai-coding-agents-in-2026-ranked-by-developers

[^3]: "9 Best AI Coding Agents in 2026, Ranked," *MightyBot*, 2026. https://www.mightybot.ai/blog/coding-ai-agents-for-accelerating-engineering-workflows

[^4]: Anthropic, "Effective Context Engineering for AI Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

[^5]: "5 Key Trends Shaping Agentic Development in 2026," *The New Stack*, 2026. https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/

[^6]: "AGENTS.md: The Open Standard," *Agentic AI Foundation*, 2026. https://agents.md/

[^7]: "Agentic AI Coding: Best Practice Patterns for Speed with Quality," *CodeScene*, 2026. https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality

[^8]: "How to Build Agentic Coding Workflows That Actually Ship," *Codegen*, 2026. https://codegen.com/blog/how-to-build-agentic-coding-workflows/

[^9]: "Building Shared Coding Guidelines for AI (and People Too)," *Stack Overflow Blog*, 2026. https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/
