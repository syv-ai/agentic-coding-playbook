# Task 1 — Scaffold tests

A function exists in `parse_volume.py`. It parses messy human-entered volume strings ("1.2k", "3,500", "2 million", "  1500 ") into integers. It has zero tests.

Use your AI tool to scaffold a test suite for it.

## What to do

1. Read `parse_volume.py` yourself first. **Do not skip this.** You need a baseline opinion before you ask the agent.
2. Write down two or three edge cases you think the function might mishandle. Don't run it yet.
3. Ask your AI tool to scaffold tests. Use whatever prompting style you prefer.
4. Run the tests: `pytest`.
5. Look at what the agent generated. Compare to your list from step 2.

## What success looks like

You are done when you can answer:

- **Which of your edge cases did the agent cover, and which did it miss?**
- **Did the agent test anything you wouldn't have thought of? Was it actually a real edge case, or hallucinated cleverness?**
- **If the function has a real bug (it does), did the test suite catch it? Did the agent notice?**

Don't tell the agent there's a bug. The point is to see whether scaffolded tests actually catch real problems, or just confirm the implementation matches itself.

## What to notice

- How specific did your prompt need to be before the tests were useful?
- Did you read every test the agent wrote, or did you skim and trust?
- If you found a bug, what kind of follow-up did the agent suggest? Did it propose a fix you'd actually merge?

## Hint

The function makes one assumption that's wrong for at least one realistic input. Your job is not to find it; the agent's job is to make you notice it. If the agent doesn't, that's the lesson.
