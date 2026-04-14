# Module 08: Long-Running Agents and Memory

## The Context Window Problem

Every agent session has a finite context window. As you work, it fills up with conversation history, file contents, command output, tool results, and everything else the agent has seen. When it fills up, the agent starts losing information. Earlier instructions fade, detailed file contents get summarized, and the agent's understanding of your session degrades [^1].

For a quick bug fix, this isn't an issue. For a multi-hour feature implementation or a complex refactoring across many files, it absolutely is.

This module covers the strategies for working effectively across long sessions and multiple sessions.

## Compaction: Squeezing More Into Less

When context fills up, most agentic tools compact automatically [^2]. Compaction works by summarizing older parts of the conversation: clearing detailed tool outputs, condensing earlier exchanges, and preserving key decisions and recent work.

The agent tries to keep what matters and discard what doesn't. But "what matters" is a judgment call, and the agent doesn't always get it right. Specific instructions from early in the conversation might get lost. A design decision you explained in detail might be summarized away.

### Making Compaction Work Better

**Put persistent rules in your instruction file, not in conversation.** Anything you said early in the conversation is at risk of being compacted away. If it's a rule the agent should always follow, it belongs in CLAUDE.md or AGENTS.md, where it's reloaded every request [^2].

**Use focused compaction.** Some tools let you direct the compaction to preserve specific topics. In Claude Code, `/compact focus on the API changes` tells the compaction to prioritize retaining information about API changes [^2].

**Watch for signs of context loss.** If the agent starts forgetting conventions you mentioned earlier, or asks about something you already discussed, context has been compacted too aggressively. That's a signal to either move the lost instructions to your instruction file or start a fresh session.

## Structured Note-Taking: External Memory

The more sophisticated approach is to have the agent maintain notes outside the context window [^1]. Instead of relying on conversation history to remember everything, the agent writes down important information in files it can read back later.

This is the pattern Anthropic describes in their research on long-running agents [^3]:

1. Agent works on a task
2. At natural checkpoints, it writes progress notes to a file (e.g., `claude-progress.txt`)
3. When context fills up or a new session starts, it reads those notes to recover state
4. Agent continues where it left off

The notes typically include: what has been completed, what's still in progress, key decisions made, known issues, and what to work on next.

### Implementing This in Practice

Some tools handle this automatically. Claude Code's auto-memory feature saves learnings across sessions in a MEMORY.md file [^2]. Other tools use hooks to capture session state at specific moments.

You can also do it manually:

```
Before we wrap up, write a progress note to docs/progress.md.
Include: what you implemented, what tests pass, what's left to do,
and any decisions we made about the API design.
```

Then at the start of your next session:

```
Read docs/progress.md to see where we left off.
Continue with the next item.
```

This is low-tech but effective. The progress file bridges the gap between sessions.

## Multi-Session Workflows

For large features that span multiple sessions, you need a deliberate approach. Anthropic's research on long-running agents identified a two-agent pattern that works well [^3]:

### The Initializer / Worker Pattern

**Initializer session.** Run once at the start of the project. This session:

1. Reads the requirements or spec
2. Creates a detailed feature list (a JSON or Markdown file with each feature, acceptance criteria, and a completion flag)
3. Sets up the project scaffold
4. Creates an init script that starts the dev environment
5. Commits the baseline state

**Worker sessions.** Each subsequent session:

1. Reads git log and progress files to understand current state
2. Reads the feature list to find the next incomplete item
3. Runs the init script to start the dev environment
4. Implements one feature
5. Tests it
6. Commits with a descriptive message
7. Updates the progress file

The key insight: each worker session focuses on **one feature at a time** [^3]. Without this constraint, agents tend to do too much at once, leading to half-finished work across multiple features.

### Feature List as Contract

The feature list is the connective tissue between sessions. Using JSON rather than Markdown works better because agents are less likely to accidentally modify JSON structure [^3]:

```json
{
  "features": [
    {
      "id": "auth-login",
      "description": "User login with email and password",
      "acceptance_criteria": [
        "POST /api/auth/login accepts email and password",
        "Returns JWT token on success",
        "Returns 401 with error message on failure",
        "Rate-limited to 5 attempts per minute"
      ],
      "passes": false
    },
    {
      "id": "auth-register",
      "description": "User registration",
      "acceptance_criteria": [
        "POST /api/auth/register creates a new user",
        "Validates email format and password strength",
        "Returns 409 if email already exists"
      ],
      "passes": false
    }
  ]
}
```

Each session picks up the first `"passes": false` item, implements it, verifies it, marks it true, and commits. Clean, incremental progress.

## Session Management

Beyond multi-session patterns, day-to-day session management matters.

### When to Start Fresh

A new session starts with a clean context window. Start fresh when:

**The task changes.** If you were debugging a payment issue and now want to add a new feature, the payment debugging context is dead weight. Start a new session.

**Context feels degraded.** The agent is forgetting things, repeating itself, or making mistakes it wouldn't have made earlier. Compaction has probably lost important information.

**It's been a long session.** As a rule of thumb, a focused 20-minute session with clear instructions outperforms a sprawling 2-hour session where topics have drifted [^4].

### Resuming and Forking

Most tools let you resume a previous session:

```bash
# Continue the most recent session
claude --continue

# Pick from a list of previous sessions
claude --resume

# Resume a named session
claude --resume auth-refactor
```

When you resume, you get your full conversation history back. This is useful when you stepped away and want to continue the same thread of work.

Forking creates a new session that starts with the same history as an existing one, but diverges from that point. Useful when you want to try a different approach without losing the original session [^2].

### Naming Sessions

Get in the habit of naming sessions descriptively [^2]:

```bash
claude -n "payment-retry-logic"
claude -n "fix-auth-token-refresh"
```

When you have a dozen sessions from the past week, "payment-retry-logic" is much more findable than "explain this function."

## Memory Systems

Some tools maintain a persistent memory across all sessions. Claude Code's auto-memory, for example, learns patterns from your work and saves them to a MEMORY.md file that loads at the start of each session [^2].

This captures things like: your preferred coding patterns, project-specific conventions, feedback you've given ("don't mock the database in tests"), and workflow preferences.

The distinction from the instruction file: auto-memory evolves based on observed patterns. The instruction file is explicit rules you write. They complement each other.

For tools without built-in memory, you can approximate it with a persistent notes file that you reference at the start of each session.

## Practical Advice

**One task per session for complex work.** Don't try to implement an entire feature in one session. Break it into pieces. Each session tackles one piece, verifies it, and commits. The next session picks up where the last one left off.

**Git is your undo button.** Commit early and often during multi-session work. If a session goes sideways, you can revert to the last good commit and start a fresh session from there [^3].

**Progress files beat conversation history.** A written progress note is more reliable than relying on context compaction to preserve important details. When in doubt, write it down.

**Clean state at session boundaries.** At the end of each session, the code should be in a mergeable state: tests pass, no half-finished features, descriptive commit messages [^3]. If the next session has to start by cleaning up the previous session's mess, that's wasted work.

## Exercises

1. Start a multi-step task. After completing the first step, write a progress note and start a new session. Continue from the progress note.
2. Create a feature list for a small feature (3 to 5 items). Use the initializer/worker pattern across two sessions.
3. Name your next three sessions. At the end of the week, find and resume one by name.
4. Try focused compaction: tell the agent to compact while preserving specific information, then verify it retained what you asked for.

## References

[^1]: Anthropic, "Effective Context Engineering for AI Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

[^2]: Anthropic, "How Claude Code Works," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/how-claude-code-works

[^3]: Anthropic, "Effective Harnesses for Long-Running Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

[^4]: "Optimizing Agentic Coding: How to Use Claude Code in 2026," *AI Multiple*, 2026. https://aimultiple.com/agentic-coding
