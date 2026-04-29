# Task 2 — Refactor a small module

`config_loader.py` is a working but messy module. It has six different concerns tangled into 80 lines: file IO, env-var lookups, type coercion, validation, defaults, and side effects (it mutates a global). It works — `pytest` passes — but reading it makes you wince.

Use your AI tool to refactor it.

## What to do

1. Read `config_loader.py` yourself. Identify the concerns. Form an opinion on what the cleaner version should look like *before* talking to the agent.
2. Write down what you would and would not change. Be specific: "I'd extract validation into its own function" is good; "make it cleaner" isn't.
3. Ask your AI tool to refactor. Tell it what to keep, what to extract, and what to leave alone.
4. Run the tests: `pytest`. They must still pass.
5. Read the diff. Don't trust that "tests pass" means the refactor was good.

## What success looks like

You are done when you can answer:

- **Did the agent's refactor match what you asked for, or did it slip in changes you didn't ask for (renamed variables, extra "improvements", restructured tests)?**
- **Are the tests still testing the same behavior, or did the agent quietly weaken them to make the refactor work?**
- **Could you defend the new structure to a colleague who'd never seen the old one?**

## What to notice

- How explicit did you have to be about scope? "Refactor this" produces different results than "extract validation into a separate function, leave everything else alone."
- Did the agent change anything in `tests_config_loader.py` that you didn't approve? Why?
- The original module has a real design flaw (the global mutation). Did the agent point it out unprompted, or did you have to notice it yourself?

## Hint

If you tell the agent "improve this," you'll get a different artifact than if you tell it "extract one specific concern and stop." The skill is in the constraint, not the request.
