---
name: prototype
description: Builds a throwaway prototype that settles a design question before committing to it — a self-contained HTML demo for state and business logic, or several radically different UI variations on one route. Use when the user wants to prototype, sanity-check a data model or state machine, mock up a UI, explore design options, or says "prototype this", "let me play with it", "try a few designs".
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a single self-contained HTML page — free-play buttons plus guided walkthroughs — that pushes the state model through cases that are hard to reason about on paper, and that someone who doesn't read code can drive.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

**brainstorming** or **visual-plan** may route here when a design question needs something runnable rather than a static picture.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **Trivial to run.** A logic demo is one HTML file the user opens (or a published page they click). A UI prototype, or a terminal app for logic that needs real I/O, starts with one command from the project's task runner — `pnpm <name>`, `python <path>`, `bun <path>`, etc. Either way, the user can start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed. For UI, look at the rendered result yourself before handing it over.
6. **Fold the decision in, move the prototype off main.** When the prototype has answered its question, fold the validated decision into the real code. Main keeps only that decision; the prototype code moves to a throwaway branch (see below) rather than staying in main to rot.

## When done

Capture two things:

- **The answer**, with the question it settled, wherever the project records decisions (a commit message, an ADR, a work item), or in a `NOTES.md` next to the prototype. If the user is around, that's a quick conversation; if not, leave the placeholder so they (or you, on the next pass) can fill in the verdict.
- **The prototype itself.** It's the evidence behind the decision, so don't throw it away. Where the project uses git, commit it to a throwaway branch (for example `prototype/<name>`), off main, and leave a pointer to that branch next to the recorded answer. Without git, ask where to keep it.
