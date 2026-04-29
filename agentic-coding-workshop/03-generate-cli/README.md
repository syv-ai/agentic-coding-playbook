# Task 3 — Generate a CLI

`market_data.py` is a small library with five public functions for fetching, filtering, and summarizing fake market data. It has no CLI. Your job: use your AI tool to wrap it in a small command-line interface.

## What to do

1. Read `market_data.py`. Understand what each function does.
2. **Decide the scope yourself before talking to the agent.** Which functions deserve a CLI command? Which don't? What flags should each command take? What's out of scope? Write it down.
3. Ask your AI tool to build the CLI. Pin the scope: tell it what's in, what's out, what library to use (`argparse`, `click`, `typer` — pick one and stick with it).
4. Run it: `python cli.py --help`.
5. Try a couple of commands. See whether what came out matches what you asked for.

## What success looks like

You are done when you can answer:

- **Did the agent stay inside the scope you set, or did it add features you didn't ask for?**
- **If the agent added something extra, was it worth it, or was it noise?**
- **Could you describe the CLI's behavior in one paragraph without re-reading the code?**

The CLI doesn't have to be polished. It has to do what you scoped it to do, and nothing more.

## What to notice

- Underspecifying scope means the agent fills the gaps with its own taste. Sometimes useful, sometimes not.
- The CLI output format (JSON? table? plain text?) is a place agents reliably overshoot. Did you specify it, or did you accept whatever they picked?
- Agents reliably add `--help`, `--version`, `--verbose` flags whether you asked or not. Are those a feature or scope creep here?

## Hint

A two-sentence scope ("wrap `fetch_quotes` and `summarize_quotes` as subcommands using argparse, JSON output only, no other flags") will get you a different result than "build a CLI." The skill is the constraint, again.
