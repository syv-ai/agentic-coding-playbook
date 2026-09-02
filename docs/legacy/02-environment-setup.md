# Module 02: Setting Up Your Environment

## Choosing a Tool

There's no single best agentic coding tool. The right one depends on how you prefer to work, what language ecosystems you live in, and what trade-offs you're willing to make.

Here's a practical overview of the major options as of 2026 [^1][^2]:

| Tool | Interface | Provider Lock-in | Notable Strengths |
|------|-----------|-------------------|-------------------|
| **Claude Code** | Terminal, Desktop, Web, IDE extensions | Anthropic models | Deep terminal integration, skills/hooks system, subagents, worktree support |
| **OpenAI Codex** | CLI and cloud app | OpenAI models | Cloud-based parallel agents, multi-agent workflows |
| **Cursor** | IDE (VS Code fork) | Multiple providers | Visual diffs, inline editing, composer mode |
| **OpenCode** | Terminal | Provider-agnostic (any LLM) | Open source, configurable, 100k+ GitHub stars |
| **Gemini CLI** | Terminal | Google models | Free tier with generous limits, Google ecosystem integration |
| **Augment Code** | IDE extension | Multiple providers | Enterprise focus, large context windows |

For this workshop, any of these will work. The underlying concepts transfer directly. If you don't have a preference yet, pick the one with the lowest friction for your current setup.

## Installation Patterns

Every tool follows roughly the same setup pattern:

1. Install the CLI or extension
2. Authenticate with the model provider
3. Navigate to your project directory
4. Start a session

### Terminal-Based Tools

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code
claude

# OpenCode
brew install opencode-ai/tap/opencode  # or npm/cargo
opencode

# Gemini CLI
npm install -g @anthropic-ai/gemini-cli
gemini

# Codex CLI
npm install -g @openai/codex
codex
```

### IDE-Based Tools

For Cursor, download the application from cursor.com. It's a modified VS Code, so your existing extensions and settings carry over.

For VS Code or JetBrains extensions (Claude Code, Copilot, etc.), install through the respective marketplace.

## The Instruction File

Every agentic tool reads a project-level instruction file at startup. This is where you tell the agent about your project's conventions, build commands, and anything it should always know. Different tools look for different filenames, but the concept is identical [^3][^4]:

| Tool | Primary File | Also Reads |
|------|-------------|------------|
| Claude Code | `CLAUDE.md` | `AGENTS.md` |
| Codex | `AGENTS.md` | `CODEX.md` |
| Cursor | `.cursor/rules/` | `AGENTS.md`, `.cursorrules` |
| OpenCode | `AGENTS.md` | Tool-specific config |
| Gemini CLI | `AGENTS.md` | `GEMINI.md` |

The emerging cross-tool standard is `AGENTS.md`, maintained by the Agentic AI Foundation under the Linux Foundation [^3]. If you want one file that works everywhere, start there. If you're using a specific tool primarily, use its native format for full feature access and add an AGENTS.md for interoperability.

Here's a minimal starting point:

```markdown
# Project: my-app

## Tech Stack
TypeScript, Next.js 15, PostgreSQL, Prisma

## Development
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Tests: `pnpm test`
- Lint: `pnpm lint`

## Conventions
- Use functional components with hooks, not class components
- All API routes go in `src/app/api/`
- Tests live next to the code they test (e.g., `Button.test.tsx`)
- Commit messages follow Conventional Commits
```

That's enough to start. You'll evolve this file over time based on what the agent gets wrong, which we cover in detail in [Module 03](./03-context-engineering.md).

## Project Structure Matters

Agents navigate your codebase the same way a new developer would: they look at file names, folder structure, and naming conventions to figure out where things are [^5]. A well-organized project is easier for both humans and agents to work with.

A few things that help:

**Consistent naming.** If your API routes are in `src/app/api/`, don't put one random route in `src/lib/endpoints/`. Agents use patterns to infer where to look.

**README and docs in expected places.** Agents will look for a README at the project root. If there's setup documentation, having it discoverable saves the agent from guessing.

**Standard tooling.** If you use a standard project layout for your framework (Next.js app router, Rails convention, Go module structure), the agent already knows the conventions. Nonstandard layouts require more instructions.

## Permissions and Safety

Agentic tools need to execute code on your machine. That means running shell commands, editing files, and potentially accessing the network. Every tool provides some mechanism to control what the agent can do without asking [^6].

The general pattern across tools:

**Ask-before-acting (default).** The agent proposes an action, you approve it. Safe but slow for routine operations.

**Auto-approve specific commands.** You whitelist trusted commands like `npm test` or `git status` so the agent doesn't ask every time. This is usually configured in a settings file.

**Permission modes.** Some tools offer modes like "plan only" (read-only analysis, no changes) or "auto" (the agent evaluates risk and proceeds). These map to different levels of trust.

Start with the defaults. As you build comfort with the tool, expand what it can do autonomously. The goal is to minimize interruptions for routine operations while keeping a check on anything that touches shared systems (pushing to remote, deploying, modifying databases).

**Match the level to the blast radius.** The right amount of autonomy depends on what a wrong action could damage. In a throwaway branch or an isolated worktree, let the agent run freely; the worst case is you delete the branch. Against anything real (shared databases, deploys, production config) keep approval on, or stay in a read-only plan mode. Choose the mode by asking "if this goes wrong, what does it touch?"

**Watch for approval fatigue.** Ask-before-acting only protects you while you're actually reading the prompts. Approve fifty trivial actions in a row and you stop reading; the fifty-first slips through unexamined. Too many prompts is its own failure mode: it trains you to rubber-stamp. Better to auto-approve the genuinely safe, routine commands and reserve real approval for the actions that matter, so each prompt still earns your attention. Whatever level you pick, you own the outcome; "the agent did it" is not an explanation anyone accepts.

## Your First Session

Once your tool is installed and you've created a basic instruction file, try this:

1. Navigate to an existing project
2. Start the agent
3. Ask: "give me an overview of this codebase"

Watch what happens. The agent will read your instruction file, scan the directory structure, open key files, and give you a summary. This is the gather-context phase of the agentic loop from Module 01, happening right in front of you.

Then try something more specific:

"Find where user authentication is handled and explain how it works."

The agent will search, read multiple files, trace the flow, and explain. You'll see it using tools in real time. That's the loop.

## Exercises

1. Install one agentic coding tool of your choice
2. Create an AGENTS.md (or equivalent) in an existing project with your tech stack, build commands, and top three conventions
3. Start a session and ask the agent to explain your project structure
4. Try asking it to find a specific piece of functionality and explain how it works

## References

[^1]: "Best Open Source AI Coding Agents in 2026," *Open Source AI Review*, 2026. https://www.opensourceaireview.com/blog/best-open-source-ai-coding-agents-in-2026-ranked-by-developers

[^2]: "9 Best AI Coding Agents in 2026, Ranked," *MightyBot*, 2026. https://www.mightybot.ai/blog/coding-ai-agents-for-accelerating-engineering-workflows

[^3]: "AGENTS.md: The Open Standard," *Agentic AI Foundation*, 2026. https://agents.md/

[^4]: "How to Use AGENTS.md with Codex, Cursor, and Claude Code," Benjamin Crozat, 2026. https://benjamincrozat.com/agents-md

[^5]: Anthropic, "Effective Context Engineering for AI Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

[^6]: Anthropic, "How Claude Code Works," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works
