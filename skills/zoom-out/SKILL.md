---
name: zoom-out
description: Maps an unfamiliar area of code one level of abstraction up — the relevant modules, their callers, and how data flows between them. Use when you're unfamiliar with an area of code, need to see how it fits into the bigger picture, or are about to change code whose surroundings you don't know.
---

# Zoom Out

Give a map of an area of code, one level up from the lines in front of you.

1. **Scope the area.** Take it from the arguments or the conversation: a file, a feature, a symbol. If it's unclear or too broad to map usefully ("the backend"), ask with your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot), or in plain text if it has none.
2. **Explore out of band.** Delegate the reading to an exploration subagent if your harness has one (the Explore agent in Claude Code), so the file reads stay out of this conversation. Give it the scoped area and ask for the map below. Otherwise keep the exploration narrow: entry points, direct callers and callees, not the whole tree.
3. **Return a compact map:**
   - The modules involved, each with the one job it does.
   - Who calls in, and what the area calls out to.
   - How data moves through it, in a few steps.
   - Where the seams are, and anything surprising.

Use the project's domain vocabulary, from its glossary or docs if it has them. Keep it short enough to hold in mind; cite `path:line` so the reader can jump in.
