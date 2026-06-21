# Module 01: The Agentic Loop

## From Autocomplete to Autonomy

To understand what makes agentic coding different, it helps to see where we came from.

Traditional code completion predicts the next few tokens based on the surrounding text. It's fast, it's useful for boilerplate, and it has essentially zero understanding of your project as a whole. It sees the file you're editing and maybe a few neighboring files. That's it.

Agentic coding is a different architecture entirely. The agent receives a task, then enters a loop: it gathers context by reading files and searching your codebase, takes actions like editing code and running commands, verifies the results by running tests or checking output, and repeats until the task is done or it needs your input [^1].

This loop is the core mechanism. Every agentic coding tool, regardless of brand, implements some version of it.

## Anatomy of the Loop

The agentic loop has three phases that blend together in practice [^1]:

<div class="graph-diagram" data-orientation="LR">
<template>
{
  "nodes": [
    { "id": "spec", "label": "Spec /\ninstruction" },
    { "id": "plan", "label": "Agent plans" },
    { "id": "act", "label": "Agent acts", "sub": "tool calls / edits" },
    { "id": "verify", "label": "Verify", "sub": "tests / linters / human" },
    { "id": "done", "label": "Done" }
  ],
  "links": [
    { "source": "spec", "target": "plan" },
    { "source": "plan", "target": "act" },
    { "source": "act", "target": "verify" },
    { "source": "verify", "target": "done", "label": "pass" },
    { "source": "verify", "target": "plan", "label": "fail" }
  ]
}
</template>
</div>

### 1. Gather Context

Before the agent does anything, it needs to understand the situation. This might involve reading specific files you mentioned, searching the codebase for relevant code, checking git status for recent changes, looking at test output or error logs, or fetching documentation from the web.

The agent decides what to look at based on your prompt and what it discovers along the way. If you say "fix the login bug," it doesn't just open `login.js`. It might search for authentication-related files, read error logs, trace the session handling flow across multiple files, and build up a picture of how the pieces connect.

### 2. Take Action

With enough context, the agent starts making changes. It edits files, creates new ones, runs shell commands, installs dependencies, whatever the task requires. Each action produces output that feeds back into the loop. An edit might introduce a type error the agent notices immediately. A test run might reveal that the fix broke something else.

### 3. Verify Results

The agent checks its own work. It runs the test suite, reads compiler output, checks that the server still starts. If something's wrong, it goes back to gathering context and tries again. This self-correction is what makes agentic coding more than a fancy autocomplete. The agent doesn't just generate code and hope for the best. It checks.

## The Role of Tools

What makes an agent an agent, rather than just a chatbot, is tools. Without tools, a language model can only produce text. With tools, it can act on the world [^1].

The tools generally fall into a few categories:

| Category | Examples |
|----------|----------|
| **File operations** | Read files, edit code, create new files, rename and move things around |
| **Search** | Find files by name pattern, search content with regex, explore the codebase |
| **Execution** | Run shell commands, start servers, execute tests, use git |
| **Web access** | Search the internet, fetch documentation, look up error messages |
| **Code intelligence** | See type errors after edits, jump to definitions, find references |

The agent chooses which tools to use based on your prompt and what it learns as it goes. When you say "fix the failing tests," a typical sequence might look like this:

1. Run the test suite to see what's failing
2. Read the error output
3. Search for the relevant source files
4. Read those files to understand the code
5. Edit the files to fix the issue
6. Run the tests again to verify

Each tool use returns information that informs the next step. That's the loop in action.

## The Harness

The "harness" is the software that wraps around the language model and gives it tools, context management, and an execution environment [^1][^2]. Claude Code is a harness. Cursor is a harness. Codex is a harness. The model does the reasoning; the harness provides everything else.

Different harnesses make different trade-offs:

| Harness Type | Strengths | Examples |
|-------------|-----------|---------|
| **Terminal-based** | Full environment access, scriptable, low overhead | Claude Code, Codex CLI, OpenCode, Gemini CLI |
| **IDE-integrated** | Visual diffs, inline editing, familiar UI | Cursor, VS Code extensions, JetBrains plugins |
| **Cloud-based** | No local setup, works from a browser, parallel workers | Codex (cloud mode), Claude Code (cloud sessions) |

The concepts in this workshop apply regardless of which harness you pick. The agentic loop is the same everywhere [^1].

## You Are Part of the Loop

This is important: the agent works autonomously, but you're still in the loop. You can interrupt at any point to steer it in a different direction, give it additional information, or tell it to try something else [^1].

Think of it like delegating to a capable colleague. You describe what you want, they go figure out the details, and you review the result. If they're heading in the wrong direction, you course-correct. You don't need to specify every step. You don't need to wait for them to finish before giving feedback.

The best agentic coding sessions are conversational. You give an initial task, the agent makes progress, you refine the direction, it adjusts. It's a dialogue, not a command-and-response pattern.

## The Leverage Moved Upstream

When the agent writes the code, the quality of the result is decided *before* it types a single line. The expensive, high-leverage work moved upstream: into defining the problem, the design, and what "done" means. The typing, which used to be most of the job, is now the cheap part.

This has a blunt corollary: an agent amplifies whatever process you bring to it. Clear thinking in, clear output out. Vague thinking in, confident and wrong output out, at machine speed. The agent doesn't fix a muddled idea; it executes it faster.

So delegate the typing, not the judgment. It's tempting to "just start", because starting is now so cheap, but a fast start on an unclear problem mostly produces work you throw away once you realize what you actually needed. Think first. Much of the rest of this workshop, grilling the task, writing a spec, planning before executing, is machinery for doing that thinking deliberately instead of skipping it.

## What This Means in Practice

Here's a concrete example. Say you want to add pagination to an API endpoint.

**Old way (autocomplete):** You open the file, start typing the pagination logic, tab-complete bits of it, manually write the tests, run them yourself, fix errors yourself.

**Agentic way:** You tell the agent: "Add cursor-based pagination to the /api/users endpoint. Page size should be 25. The response needs a `next_cursor` field. Write tests."

The agent reads the existing endpoint code, looks at how other endpoints in the project handle pagination (if any), writes the implementation, adds tests following the project's existing test patterns, runs the tests, fixes any failures, and presents you with a diff to review.

You might have one follow-up: "Use the same cursor encoding we use in /api/orders." The agent finds that pattern, adjusts, reruns the tests, done.

The total time might be similar. The cognitive load on you is drastically lower. And the agent caught things you might have missed because it read more of the codebase than you would have bothered to for a single pagination feature.

## Key Takeaways

The agentic loop (gather, act, verify, repeat) is the universal pattern behind every AI coding agent.

Tools are what make agents agents. Without tools, it's just a chatbot.

The harness provides the tools and execution environment. The model provides the reasoning. Different harnesses, same underlying loop.

You remain in control. The agent works autonomously between your interventions, but you steer it, and you review the output before anything ships.

## References

[^1]: Anthropic, "How Claude Code Works," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works

[^2]: Anthropic, "Effective Harnesses for Long-Running Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
