# Agentic coding workshop — starter tasks

Four small, self-contained tasks designed for a 20-minute hands-on block in a workshop on agentic coding. Each task is real enough to feel meaningful and small enough to actually finish.

The tasks are written to be **tool-agnostic** — pick whatever AI tool you have available (Copilot in your IDE, Claude Code, Cursor, ChatGPT/Claude.ai with copy-paste, Cline, Aider, anything). The point is not to learn a tool; it is to notice how *you* work with one.

The tasks are written in **Python** so they're approachable regardless of your day-to-day language, but the lessons are language-agnostic.

## Setup

```bash
git clone <this-repo>
cd agentic-coding-workshop
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Each task lives in its own directory and is independent. Pick one task for the 20-minute block. Don't try to do all four — the goal is depth on one, not coverage of all.

## Tasks

1. **`01-scaffold-tests/`** — A function exists. Use your AI tool to scaffold a test suite that catches both happy path and edge cases. Practice prompting for coverage and reading what the agent generated critically.
2. **`02-refactor-module/`** — A messy module exists with mixed concerns. Use your AI tool to refactor it without changing behavior. Practice scoping the refactor and keeping the agent honest about what it actually changed.
3. **`03-generate-cli/`** — A small library exists. Use your AI tool to build a CLI wrapper for it. Practice articulating what's in and out of scope before the agent starts.
4. **`04-process-log/`** — A sample log file exists. Use your AI tool to build a script that extracts a specific signal from it. Practice working with messy real-world data and defending the parsing assumptions the agent (and you) made.

Each task's `README.md` says what success looks like and what to notice. The point of every task is the **noticing**, not the finishing.

## What "done" means

For all four tasks, you are done when you can answer these three questions out loud:

1. **What did the agent get right that you didn't expect?**
2. **What did the agent get wrong (or skip, or assume) that mattered?**
3. **What would you do differently next time you scope this kind of task?**

If the code works but you can't answer those, you finished the task and missed the point. If the code is half-done but you have sharp answers, you got more out of the workshop than someone who shipped a polished but unexamined solution.

## What this workshop is *not*

- Not a tool comparison. Use whatever you have; we're not crowning a winner.
- Not a benchmark. The tasks aren't calibrated for cross-person comparison.
- Not a productivity demo. The point is to surface where agents help, where they don't, and where you need to be more careful than feels natural.

## Running tests

Most tasks come with starter tests:

```bash
pytest 01-scaffold-tests/
```
