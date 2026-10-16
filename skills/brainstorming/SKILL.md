---
name: brainstorming
description: Turns an idea into an agreed design through collaborative dialogue — purpose, constraints, approaches and trade-offs — before any code is written. Use when a feature, component or behaviour change is underspecified, when several approaches are plausible, or when the user wants to think a design through before building.
---

# Brainstorming

Turn an idea into a design the user has agreed to, then hand over to planning. The point is to catch wrong assumptions while they are cheap to change. Your picture of what the user wants is usually thinner than it feels; once you understand why they want it, you can make the many small decisions they never mention the way they would.

## Scale to the task

Before you reply, ask yourself privately: what do I actually know about what they want, and why?

- **Everything that matters is in the request** ("make the error banner red"). Do it, and say what you did.
- **Something that matters is missing.** Start the conversation below.

Until the user has agreed to the design, don't write code, scaffold, install dependencies or create projects. Reading and exploring are fine. Building on an unagreed design is the expensive mistake this skill exists to prevent. If your harness has a plan mode, brainstorming fits inside it: in Claude Code, plan mode keeps the session read-only until you leave it.

## Process

1. **Explore the context.** Look at the relevant files, docs and recent commits. Delegate to an exploration subagent if your harness has one (`Explore` in Claude Code and Cursor, the `explorer` role in Codex, `codebase_investigator` in Gemini CLI); otherwise keep the exploration narrow and targeted.
2. **Open the conversation.** In your first message, offer in one line that they can skip the questions and have you just start. If they take it, state any significant how-it-gets-made choice (platform, language, medium) in one line, then proceed. Otherwise ask your first questions, starting with what they want this for.
3. **Find the intent first.** Learn why they want it, what success looks like, what would make it a failure even if it technically works, and what exists already, before you propose features. A guess they can correct ("I'm guessing this is because X keeps breaking?") often works better than an abstract question.
4. **Settle how it gets made.** Early on, find out which choices they want to make themselves (platform, language, libraries, hosting), which they hand to you, and what they already have to build on. Where there's existing work, build on what it uses. A choice you make goes in the design as your call, never as something they agreed to. A session that designs an iOS app without asking about platform can end up building a web app.
5. **Play back as you go** (see below).
6. **Size the work** once the intent is clear (see below).
7. **Check the scope.** If this is really several independent projects ("a platform with chat, billing and analytics"), say so, agree on an order, and brainstorm the first one; each gets its own design → plan → build cycle.
8. **Choose an approach.** Privately come up with several ideas and drop the weak ones, including any that work against the why they gave you. Show 2–3 approaches with trade-offs, recommendation first, only when the comparison helps them decide; if one approach is clearly right, present it and say why.
9. **Present the design** in sections scaled to their complexity, covering what applies: architecture, components, data flow, error handling, testing. Check each section with the user before moving on.
10. **Record the spec**, if the size calls for one, and run the builder check (see below).
11. **Choose the next step** with the user.

Approval covers what you showed them. A default they never heard is one they couldn't reject, so say your defaults out loud.

## Asking questions

Ask with your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode); if it has none, ask in plain text. Prefer multiple choice with your recommended option first, and leave room for an answer in their own words. Questions that don't depend on each other can go together; most tools take three or four per call, so split larger batches. Ask dependent questions in sequence, since each answer changes the next question. If the codebase can answer a question, look instead of asking.

## Play it back

As soon as you understand one part well enough to describe it (what it's for and who it serves, or how one piece behaves), describe it back in about 200–300 words, then return to questions about the next part. Mark anything you're guessing as your guess; only what they said goes in as theirs. End each chunk by asking what's wrong or missing.

## Size the work

Once the intent is clear, pick a size and say it in plain words. The user can override it.

| Size | Where the design lives | Then |
|------|------------------------|------|
| Quick task | the request itself | do it |
| Small change | agreed in chat | build it |
| Project | a written spec | plan it with **writing-plans** |

If the work grows mid-task, stop, say so, and step up a size.

## Designing

- **Isolation and clarity.** Break the system into units that each have one purpose, a clear interface, and can be understood and tested on their own. For each unit you should be able to say what it does, how it is used and what it depends on.
- **Focused files.** Smaller, well-bounded files are easier to reason about and edit reliably; a file that keeps growing is usually doing too much.
- **Existing codebases.** Follow the established patterns. Include targeted improvements where existing problems get in the way of the work, but don't propose unrelated refactoring.
- **YAGNI.** Remove features nobody asked for.

If a design question can only be settled by running something — does this state model hold up, which of these layouts feels right — use the **prototype** skill to answer it, then return here with the result.

## The spec

Where the spec goes, and whether it is kept at all, comes from the project's instructions file (AGENTS.md or CLAUDE.md). If it says nothing, look for an existing convention in the repo (a specs folder, design docs attached to issues). If that is still unclear, ask — and offer to record the answer as a short section in the instructions file so the next session doesn't have to ask. A spec can live only in the conversation when nothing needs to persist; only commit it if the project commits specs.

Write it so a capable builder in the domain could plan from it without going back to the user: the intent and the why; goals and non-goals; constraints; the parts of the how the user decided, as they decided them; your calls, marked as yours; what's out of scope; and how to verify the feature end to end. Reread it once for placeholders ("TBD"), contradictions and requirements that could be read two ways, and fix them inline.

**Builder check.** Have a fresh reader, acting as that builder, list the questions they'd still need answered, using [builder-check-prompt.md](builder-check-prompt.md). Without subagents, read the spec as that builder yourself. Sort what comes back:

- **Already answered** by the conversation or the project: write the answer into the spec.
- **Minor**, a sensible builder could settle it without changing what gets built: decide it and mark it in the spec as your call.
- **Theirs**, only the user can answer it and the answer changes what gets built: bring these to the user in one batched set of questions, most important first.

Then ask the user to review the spec, pointing out the calls you made so they can check those while reading.

## Next step

Once the design is agreed, ask the user how to continue:

- **Continue in this session** (default) with the **writing-plans** skill.
- **Start fresh** — use the **handoff** skill so a new session picks up with clean context.

For a small change agreed in chat, going straight to implementation is fine.

## Visual companion

Some questions are easier to answer by seeing than by reading: a screen or page, a layout, a flow or sequence of steps, options that would look different from each other, or a structure such as a diagram, timeline or map. For those you can show static HTML pages (published where your harness can, otherwise local files in their browser) and capture the answer with the question tool. Offer it the first time such a question comes up, as its own message. If they accept, decide per question: conceptual choices, requirements and trade-offs stay in text. See [visual-companion.md](visual-companion.md) for the loop and the template's classes.
