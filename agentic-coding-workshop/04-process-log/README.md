# Task 4 — Process a log file

`sample.log` is a 5,000-line synthetic application log. Mostly INFO lines, some WARN, a handful of ERRORs. Each line has a timestamp, a level, a request ID, and a message. The format is *almost* but not *quite* consistent — there are a few malformed lines, mixed timezone formats, and one thing that looks like an error but isn't.

Use your AI tool to build a small Python script that pulls out a useful signal from this log.

Pick **one** of these signals to extract — don't try to do all three:

1. **Error rate per minute.** Output: a list of (minute, error_count) pairs sorted by count.
2. **Slowest 10 requests.** Each request has a "completed in Xms" line somewhere in its output. Output: top 10 by latency, with request ID.
3. **Errors clustered by message pattern.** Group similar error messages (e.g. "DB connection refused" and "DB connection refused (retry 1)" should cluster), output the top 5 clusters.

## What to do

1. **Open `sample.log` first.** Skim 50–100 lines yourself before writing a single prompt. You need a baseline opinion about what's regular and what isn't.
2. Pick your signal. Tell the agent what you want, including the output format.
3. Watch what assumptions the agent makes. Do not let it run wild.
4. Run the script. Spot-check a few outputs against the log file by hand.

## What success looks like

You are done when you can answer:

- **What parsing assumption did the agent make that you didn't explicitly ask for?**
- **Did the agent's script handle malformed lines gracefully, or silently drop them, or crash?**
- **Are the numbers your script is producing actually right? How would you check?**

If the script produces a clean output but you can't defend the numbers, you've built something that *looks* correct without being correct. That's the most expensive kind of bug.

## What to notice

- Real-world logs are messier than the agent expects. Watch how it handles edge cases — does it ask, assume, or fail loudly?
- "Top 10 slowest" sounds simple. The agent will probably define "slowest" in a way that matches some lines and not others. Did it tell you what definition it picked?
- Did the agent write any tests? If not, how would you verify its output is right?

## Hint

If you can't articulate the parsing rules in a sentence, the agent will pick rules for you. The skill is to articulate them first, even if briefly. "Lines starting with `[ERROR]` are errors; ignore lines that contain the word 'error' but don't start with `[ERROR]`" is a real instruction; "find the errors" is not.
