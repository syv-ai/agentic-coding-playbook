import { Part } from "./types";

export const PARTS: Part[] = [
  { number: 1, title: "Foundations", subtitle: "What agentic coding is, how the loop works, and getting set up" },
  { number: 2, title: "Core Skills", subtitle: "The skills that separate consistent results from expensive randomness" },
  { number: 3, title: "Advanced Patterns", subtitle: "Delegation, parallelism, long-running work, and building your system" },
  { number: 4, title: "Organization & Scale", subtitle: "Rolling agentic coding out across an organization" },
];

export const MODULE_META: {
  file: string;
  slug: string;
  number: string;
  title: string;
  description: string;
  partIndex: number;
}[] = [
  { file: "00-introduction.md", slug: "00-introduction", number: "00", title: "Introduction", description: "What agentic coding is, how it differs from autocomplete, and why it matters now.", partIndex: 0 },
  { file: "01-the-agentic-loop.md", slug: "01-the-agentic-loop", number: "01", title: "The Agentic Loop", description: "The universal architecture: gather context, take action, verify results, repeat.", partIndex: 0 },
  { file: "02-environment-setup.md", slug: "02-environment-setup", number: "02", title: "Setting Up Your Environment", description: "The 2026 tool landscape and getting your first session running.", partIndex: 0 },
  { file: "03-context-engineering.md", slug: "03-context-engineering", number: "03", title: "Context Engineering Fundamentals", description: "The single most important skill: curating what information the agent has access to.", partIndex: 1 },
  { file: "04-effective-prompting.md", slug: "04-effective-prompting", number: "04", title: "Effective Prompting for Agents", description: "Writing task briefs, not prompt engineering. Five patterns for better prompts.", partIndex: 1 },
  { file: "05-tools-and-mcp.md", slug: "05-tools-and-mcp", number: "05", title: "Tools, MCP, and External Connections", description: "How agents interact with the world beyond your codebase.", partIndex: 1 },
  { file: "06-verification-and-quality.md", slug: "06-verification-and-quality", number: "06", title: "Verification and Quality Gates", description: "Three layers of verification: self-check, automated gates, human review.", partIndex: 1 },
  { file: "07-subagents-and-parallelism.md", slug: "07-subagents-and-parallelism", number: "07", title: "Subagents and Parallel Execution", description: "When one agent isn't enough. Isolation, worktrees, and orchestration.", partIndex: 2 },
  { file: "08-long-running-agents.md", slug: "08-long-running-agents", number: "08", title: "Long-Running Agents and Memory", description: "Context limits, compaction, structured note-taking, and session management.", partIndex: 2 },
  { file: "09-production-workflows.md", slug: "09-production-workflows", number: "09", title: "Production Workflows", description: "From personal use to team practice. CI/CD, headless mode, cost management.", partIndex: 2 },
  { file: "10-building-your-system.md", slug: "10-building-your-system", number: "10", title: "Building Your Own Agentic System", description: "The step-by-step guide to a mature agentic configuration.", partIndex: 2 },
  { file: "11-from-business-context-to-agent-tasks.md", slug: "11-from-business-context-to-agent-tasks", number: "11", title: "From Business Context to Agent Tasks", description: "The upstream pipeline from business needs to agent-ready prompts.", partIndex: 3 },
  { file: "12-enterprise-adoption.md", slug: "12-enterprise-adoption", number: "12", title: "Enterprise Adoption", description: "Code health prerequisites, vendor lock-in, and the collaboration paradox.", partIndex: 3 },
  { file: "13-observability-and-lifecycle.md", slug: "13-observability-and-lifecycle", number: "13", title: "Observability and Lifecycle", description: "Tracing, metrics, alerting, and token economics in practice.", partIndex: 3 },
  { file: "14-software-distillation-and-atomic-agents.md", slug: "14-software-distillation-and-atomic-agents", number: "14", title: "Software Distillation and Atomic Agents", description: "Atomic skills, single-responsibility design, and the Executive-Worker pattern.", partIndex: 3 },
  { file: "research-summary.md", slug: "research-summary", number: "RS", title: "Research Summary", description: "Annotated bibliography of all 26 primary sources.", partIndex: 3 },
];
