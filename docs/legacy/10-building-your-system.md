# Module 10: Building Your Own Agentic System

## Putting It All Together

You've now covered the full stack: how agents work (Module 01), how to set them up (02), how to write instructions they follow (03), how to prompt effectively (04), how to extend with tools (05), how to verify quality (06), how to delegate and parallelize (07), how to manage long-running work (08), and how to operate in production (09).

This final module walks you through building a complete agentic coding setup from scratch, applying everything you've learned. The goal is a personalized system that matches your workflow, your team, and your tech stack.

## Step 1: Audit Your Current Workflow

Before configuring anything, spend 30 minutes observing how you actually work. Write down:

**What tasks do you do repeatedly?** Bug fixes, feature implementation, code review, documentation updates, test writing, dependency management. Be specific.

**Where do you lose time?** Searching for files, understanding unfamiliar code, writing boilerplate, running through checklists manually, waiting for builds.

**What decisions do you make routinely?** "This should follow the same pattern as X." "Check the tests before committing." "Validate inputs at the API boundary." These are candidates for your instruction file.

**What external systems do you touch?** Database, project tracker, Slack, monitoring dashboards, deployment tools. These are MCP candidates.

**What should always happen automatically?** Formatting, linting, type checking. These are hook candidates.

## Step 2: Create Your Instruction File

Start with the minimum viable instruction file from Module 03. Include only:

1. Tech stack
2. Build/test/lint commands
3. Project structure (one paragraph, not a directory listing)
4. Top five conventions the agent has gotten wrong or you want to enforce

```markdown
# Project: [name]

## Stack
[Languages, frameworks, database, key libraries]

## Commands
- Dev: `[command]`
- Test: `[command]`
- Build: `[command]`
- Lint: `[command]`

## Structure
[Brief description of where things live and how they connect]

## Conventions
1. [Convention]
2. [Convention]
3. [Convention]
4. [Convention]
5. [Convention]
```

Commit this. You'll evolve it over the coming weeks.

## Step 3: Set Up Verification

Before letting the agent write code, establish your quality gates (Module 06):

**Hook: auto-format on edit.** The agent's code should always match your project's style without you thinking about it.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "edit|write",
        "hooks": [
          {
            "type": "command",
            "command": "your-formatter --write $FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

**Pre-commit check.** Run type checking and linting on staged files before commits go through. This can be a standard git hook or an agent-specific hook, depending on your tool.

**Review discipline.** Commit to reviewing every diff before merging. Make it a habit from day one.

## Step 4: Run Your First Real Task

Pick something small and concrete. Not "build the new feature." Something like "add input validation to the registration endpoint" or "fix the flaky test in user.test.ts."

Walk through the agentic loop consciously:

1. Give the agent the task with acceptance criteria
2. Watch it gather context (which files does it read?)
3. Watch it take action (what changes does it make?)
4. Watch it verify (does it run tests? check output?)
5. Review the result yourself

Note what went well and what the agent got wrong. If it got a convention wrong, add it to your instruction file. If it struggled to find the right files, your project structure might need clarification. If it produced correct but inconsistent code, you need a pattern reference.

## Step 5: Add Complexity Incrementally

Follow the trigger-based approach from the features overview [^1]:

| When This Happens | Add This |
|-------------------|----------|
| Agent gets a convention wrong twice | Rule in instruction file |
| You type the same starting prompt repeatedly | A saved skill or command |
| You paste the same reference material repeatedly | A reference skill |
| You keep copying data from an external system | MCP connection |
| A research task floods your context | Route it through a subagent |
| Something should always happen without asking | A hook |
| Another repo needs the same setup | Package as a plugin |

Resist the urge to set up everything at once. Each addition should be a response to an observed need, not speculation about what you might need someday.

## Step 6: Define Specialized Agents

After a few weeks of use, you'll notice patterns in the subagent tasks you run. Common ones:

**Code reviewer.** Read-only access, focused on your team's specific quality criteria.

**Test writer.** Access to read code and write test files, with your project's testing conventions preloaded.

**Documentation updater.** Reads code changes and updates relevant docs.

**Security auditor.** Checks for common vulnerabilities in the changed code.

Define these as custom subagents in your project so the whole team benefits (Module 07).

## Step 7: Establish Multi-Session Patterns

For work that spans multiple sessions (Module 08):

**Create a progress file convention.** Decide where progress notes go (e.g., `docs/progress/` or `.claude/progress.md`) and what they contain.

**Name your sessions.** Make it a habit. "auth-token-refresh" not "fix bug."

**One feature per session for complex work.** Break large features into a feature list and tackle one item per session.

**Git commits as checkpoints.** Commit after each completed step. The commit history becomes your progress record.

## Step 8: Scale to the Team

When you're comfortable with your personal setup:

**Share the instruction file.** It's already in version control. Make sure it reflects team conventions, not just your personal preferences.

**Document the agent workflow.** A brief section in your project's README or contributing guide explaining how the team uses agentic tools: what's in the instruction file, what subagents are available, what hooks are configured.

**Pair on agent usage.** The fastest way to spread agentic coding skills on a team is to work through a task together. One person drives the agent, the other watches and asks questions.

**Review agent-specific config in PRs.** Changes to AGENTS.md, CLAUDE.md, subagent definitions, and hooks should be reviewed like any other code change. These files shape every agent interaction for the entire team.

## A Complete Example Setup

Here's what a mature agentic setup looks like in practice:

```
project/
  AGENTS.md                    # Cross-tool instruction file
  CLAUDE.md                    # Tool-specific instruction file (if needed)
  .claude/
    settings.json              # Permissions, allowed commands
    agents/
      code-reviewer.md         # Security + quality review subagent
      test-writer.md           # Test generation subagent
    skills/
      deploy.md                # Deployment workflow
      api-patterns.md          # API design reference
      migration-guide.md       # Database migration procedure
    rules/
      typescript.md            # TS conventions (loaded for .ts files)
      testing.md               # Test patterns
  .cursor/
    rules/
      general.mdc              # Cursor-specific rules (if using Cursor)
  .github/
    workflows/
      ai-review.yml            # CI: agent reviews PRs
      ai-stale-prs.yml         # Scheduled: weekly stale PR cleanup
```

This doesn't appear overnight. It's built up over weeks and months, one piece at a time, each addressing an observed need.

## The Evolution Loop

Your agentic setup is never finished. It evolves through a cycle:

1. **Use the agent** for real work
2. **Notice friction** where the agent produces wrong or inconsistent results
3. **Diagnose** whether it's a missing convention, missing context, missing tool, or missing verification
4. **Add the minimum fix** (a rule, a skill, a hook, an MCP connection)
5. **Return to step 1**

This is the same evolutionary approach that produced the most successful agentic setups in the community [^2][^3]. The everything-claude-code project, for example, evolved over 10+ months of daily use, adding capabilities in response to real needs, not theoretical ones [^2].

## What's Next

Agentic coding is moving fast. A few things to keep an eye on:

**Agent teams.** Multiple agents collaborating on a task through peer-to-peer communication and shared task lists. Still experimental, but promising for complex work [^1].

**Standardization.** AGENTS.md as a cross-tool standard is still maturing. Expect convergence on instruction formats, tool interfaces, and permission models [^4].

**Autonomous loops.** Agents that run continuously, monitoring systems, maintaining code quality, and handling routine tasks without human initiation [^2].

**Cost efficiency.** As models get cheaper and context windows grow, the economics of agentic coding will shift. Patterns that are expensive today may become trivially cheap.

The fundamentals you've learned in this workshop will remain stable even as the tools evolve. The agentic loop, context engineering, verification practices, and delegation patterns are architectural concepts, not product features. They apply regardless of which tool you're using or which model is running under the hood.

## Final Exercises

1. Build a complete agentic setup for one of your projects following the steps in this module.
2. Run a real task through the full pipeline: prompt, agent work, verification, review, commit.
3. After one week of use, audit your instruction file. What did you add? What did you remove? What surprised you?
4. If you work on a team, pair with a colleague on an agent-assisted task. Compare approaches and share what you've learned.

## References

[^1]: Anthropic, "Extend Claude Code (Features Overview)," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/features-overview

[^2]: "Everything Claude Code," *GitHub (affaan-m)*, 2026. https://github.com/affaan-m/everything-claude-code

[^3]: "Awesome Claude Code," *GitHub (hesreallyhim)*, 2026. https://github.com/hesreallyhim/awesome-claude-code

[^4]: "AGENTS.md: The Open Standard," *Agentic AI Foundation*, 2026. https://agents.md/
