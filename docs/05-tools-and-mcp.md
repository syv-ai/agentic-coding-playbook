# Module 05: Tools, MCP, and External Connections

## Why Tools Matter

In Module 01 we established that tools are what turn a language model into an agent. Without tools, the model can only produce text. With tools, it can read files, edit code, run commands, search the web, and interact with external services [^1].

But your agent's built-in tools only cover what's local to your development environment: files, terminals, and web search. Real development involves external systems: databases, deployment platforms, monitoring dashboards, project management tools, communication channels. This module covers how to extend your agent's reach.

## Built-In Tool Categories

Every agentic coding harness ships with a core set of tools. The specifics vary by tool, but they generally cover the same ground [^1]:

**File operations.** Read, edit, create, rename, and move files. This is the bread and butter. The agent reads your code, makes changes, creates new files when needed.

**Search.** Find files by name pattern (globbing), search file contents with regex, explore directory structure. This is how the agent navigates unfamiliar codebases.

**Execution.** Run shell commands, start dev servers, execute test suites, use git. Anything you can do from a terminal, the agent can do too.

**Web access.** Search the internet, fetch web pages and documentation, look up error messages. Useful when the agent needs information that isn't in your codebase.

**Code intelligence.** Some tools support language-server features like go-to-definition, find-references, and real-time type checking. This gives the agent richer understanding of code structure beyond text search.

These built-in tools handle most coding tasks. You don't need to configure anything for the agent to read your files, run your tests, and edit your code. Where things get interesting is when you need to connect to systems outside your local environment.

## Model Context Protocol (MCP)

MCP is a standard protocol for connecting AI agents to external services [^2]. Think of it as USB for AI tools: it provides a standard interface that any service can implement, and any agent can consume.

The architecture is straightforward:

```
Your Agent  <-->  MCP Client  <-->  MCP Server  <-->  External Service
                  (built into        (you install      (Slack, DB, 
                   your tool)         or run)           Jira, etc.)
```

An MCP server exposes capabilities (called "tools") that the agent can discover and use. For example, a Slack MCP server might expose tools like `send_message`, `search_messages`, and `list_channels`. A database MCP server might expose `query` and `list_tables`.

### When to Use MCP

The trigger is simple [^3]: you find yourself repeatedly copying data from a browser tab or another application into the agent's chat. That's a sign the agent needs direct access.

Common examples:

| External System | What MCP Enables |
|----------------|-----------------|
| Database (Postgres, MySQL) | Query data, inspect schemas, run migrations |
| Project management (Jira, Linear) | Read tickets, update status, create issues |
| Communication (Slack, email) | Send notifications, search conversations |
| Browser | Navigate pages, click elements, take screenshots |
| Monitoring (Grafana, Datadog) | Check dashboards, query metrics |
| Cloud providers (AWS, GCP) | Manage resources, check deployments |

### Setting Up MCP Servers

The setup depends on your tool, but the pattern is consistent:

1. Install or run the MCP server (often a Docker container or npm package)
2. Register it in your tool's configuration
3. The agent discovers available tools at session start

Example configuration for Claude Code:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/mydb"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-..."
      }
    }
  }
}
```

For Cursor, the configuration goes in `.cursor/mcp.json`. For OpenCode, in its configuration file. The format differs; the concept is the same.

### Context Cost of MCP

MCP servers add to your context budget. Tool names load at session start, but full tool schemas are deferred until the agent actually uses a specific tool [^3]. This means idle MCP connections are cheap, but the cost grows as the agent uses more external tools in a session.

Practical advice: connect only the MCP servers you actively need. If you're not using the Slack integration for a particular task, don't load it. You can enable and disable servers between sessions.

## Hooks: Automation Outside the Loop

Hooks are a different kind of extension. Where MCP connects the agent to external services it can call, hooks are scripts that run automatically on specific events, without the agent deciding anything [^3].

The distinction matters:

| | MCP | Hooks |
|---|-----|-------|
| **Who decides to use it** | The agent | The harness, deterministically |
| **When it runs** | When the agent chooses to invoke a tool | On a specific event (file edit, session start, etc.) |
| **LLM involved** | Yes, the agent reasons about what to call | No, pure script execution |
| **Use case** | External data and actions the agent needs | Automation you always want to happen |

Common hook patterns:

**Post-edit linting.** Run ESLint or your formatter after every file edit, so the agent's changes are always style-compliant.

**Pre-commit checks.** Run type checking or tests before the agent creates a commit.

**Session start/end.** Load project state at the beginning of a session, save progress notes at the end.

**Notifications.** Send a desktop notification when the agent finishes a long task or needs your input.

Hooks run as external scripts. They add zero context cost unless they return output that gets injected into the conversation [^3].

### Example: Auto-Format on Edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "edit|write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write $CLAUDE_FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

This runs Prettier on any file the agent edits. The agent doesn't know or care about Prettier; the hook handles it silently.

## Combining Tools, MCP, and Hooks

These three extension points work together. A practical setup might look like:

1. **Built-in tools** handle day-to-day file editing, search, and command execution
2. **MCP** connects to your database so the agent can check schemas and test queries
3. **A hook** runs your linter after every edit to keep code style consistent
4. **Another MCP server** connects to your project management tool so the agent can read ticket details
5. **A notification hook** pings you when the agent is waiting for approval

Each piece does one thing. They compose cleanly because they operate at different layers.

## Practical Advice

**Start with zero external connections.** The built-in tools are enough for most coding tasks. Add MCP servers only when you find yourself repeatedly copying data into the agent's chat.

**Be mindful of credentials.** MCP servers often need API tokens or database credentials. Store these in environment variables, not in version-controlled config files. Use `.env` files that are gitignored.

**Test MCP connections before relying on them.** MCP servers can fail silently mid-session. If the agent suddenly can't use a tool it was using before, the server may have disconnected.

**Keep hooks simple.** A hook that runs `prettier` is great. A hook that runs a 30-second build process after every edit is going to make the agent painfully slow.

## Exercises

1. Identify one external system you regularly copy data from during development. Research whether an MCP server exists for it.
2. Set up one MCP server (a database connection is a good first choice) and ask the agent to query it.
3. Create a post-edit hook that runs your project's formatter or linter.
4. If you use notifications, set up a notification hook so you know when the agent needs your attention.

## References

[^1]: Anthropic, "How Claude Code Works," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works

[^2]: "5 Key Trends Shaping Agentic Development in 2026," *The New Stack*, 2026. https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/

[^3]: Anthropic, "Extend Claude Code (Features Overview)," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/features-overview
