# Logic Prototype

A single self-contained HTML page that lets the user drive a state model by clicking buttons. Use this when the question is about **business logic, state transitions, or data shape** — the kind of thing that looks reasonable on paper but only feels wrong once you push it through real cases.

Because it's one file with nothing to install, the user can pass it to someone who doesn't read code (a designer, a product owner, a domain expert) and let them try the model themselves. So it uses their language, not the code's.

Keep a terminal app instead only when the logic needs real I/O the browser can't give it — reading the project's files, calling a local service, talking to hardware. Then the same pure module sits behind a small TUI; see the note at the end.

## When this is the right shape

- "I'm not sure if this state machine handles the edge case where X then Y."
- "Does this data model actually let me represent the case where..."
- "I want to feel out what the API should look like before writing it."
- Anything where someone wants to **press buttons and watch state change**.

If the question is "what should this look like" — wrong branch. Use [UI.md](UI.md).

## Process

### 1. State the question

Before writing code, write down what state model and what question you're prototyping. One paragraph, shown at the top of the page (visible, not just a comment). A logic prototype that answers the wrong question is pure waste — make the question explicit so it can be checked later, whether the user is watching now or returning to it AFK.

### 2. Isolate the logic in a pure module

Put the actual logic — the bit that's answering the question — in one `<script>` block written as a small, pure module that could be lifted out and dropped into the real codebase later. The page around it is throwaway; the logic module shouldn't be. If the real code is in another language, keep the module plain enough to port by hand.

The right shape depends on the question:

- **A pure reducer** — `(state, action) => state`. Good when actions are discrete events and state is a single value.
- **A state machine** — explicit states and transitions. Good when "which actions are even legal right now" is part of the question.
- **A small set of pure functions** over a plain data type. Good when there's no implicit current state — just transformations.
- **A class or module with a clear method surface** when the logic genuinely owns ongoing internal state.

Pick whichever shape best fits the question being asked, *not* whichever is easiest to wire to a page. Keep it pure: no DOM, no `document`, no button handlers reaching into it. The page calls into it; nothing flows the other direction.

This is what makes the prototype useful past its own lifetime. When the question's been answered, the validated reducer / machine / function set can be lifted into the real module, and the page stays behind with the prototype.

### 3. Build the page

One file, plain HTML, CSS and JavaScript: no framework, no bundler, no server, everything inline so it opens by double-click. Label everything in **domain language** — buttons and fields read like the business, not the reducer.

Top to bottom:

1. **Title and the question** being settled (from step 1), in a line or two.
2. **State panel**: the full relevant state as labelled fields, not a raw JSON dump, re-rendered after every click. Highlight what just changed.
3. **Free-play buttons**: one per action, always available, so the user can poke at the model in any order. An action that's illegal right now should say why rather than silently do nothing.
4. **Guided walkthroughs**: scenarios as tabs. Each tab has a short plain-language description (what it sets up, what to watch for) and the ordered steps as real buttons; clicking a step performs it and moves to the next. Opening a scenario resets to a known starting state, so it runs the same way every time. Include at least the happy path, a tricky edge case, and an attempt at something that should be illegal.

Keep the styling restrained: readable type, generous spacing, one accent colour, no animation competing with the state.

Follow the page contract so it renders well wherever it's opened. In Claude Code, load the `artifact-design` skill before writing it.

- `<title>`: a two-to-four-word name.
- Colours as tokens on `:root`, with dark values under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and again under `:root[data-theme="dark"]`; give `body` an explicit background.
- No external scripts unless they're pinned to an exact version from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm/, unpkg.com, cdn.tailwindcss.com or code.jquery.com; usually you need none.
- When publishing, leave out the doctype, `<html>`, `<head>` and `<body>` tags: the publisher adds them. A local file keeps them.
- Works at phone width: 16px side gutter, no horizontal scroll. Don't rely on `alert`, `confirm` or `prompt`; published pages ignore them.

### 4. Hand it over

Write the file next to the code it's prototyping for. If your harness can publish a page (in Claude Code, the `Artifact` tool), publish it and give the user the link; the page is private to them until they share it, and republishing the same file after a change keeps the link. Otherwise open the file if you can and give its full absolute path.

The interesting moments are when the user says "wait, that shouldn't be possible" or "huh, I assumed X would be different" — those are the bugs in the _idea_, which is the whole point. If they want new actions or another scenario, add them. Prototypes evolve.

### 5. Capture the answer

When the prototype has done its job, capture the answer and the prototype as [SKILL.md](SKILL.md) describes. For logic, the validated module lifts into the real code; the HTML page goes to the throwaway branch, where it stays runnable by double-click.

### When the logic needs real I/O

Build a small terminal app around the same pure module, in the host project's language and tooling. On every action, clear the screen and re-render one frame: the current state (one field per line, bold field names, dim secondary detail with plain ANSI codes) and the keyboard shortcuts at the bottom (`[a] add user  [t] tick clock  [q] quit`). Add one command for it to the project's task runner, or put the command at the top of the file if there is none.

## Anti-patterns

- **Don't add tests.** A prototype that needs tests is no longer a prototype.
- **Don't wire it to the real database.** Use an in-memory store unless the question is specifically about persistence.
- **Don't generalise.** No "what if we wanted to support X later." The prototype answers one question.
- **Don't blur the logic and the page together.** If the pure module touches the DOM, `document` or button handlers, it's no longer liftable. Keep the page a thin shell over the module.
- **Don't reach for a framework, bundler or server.** One file the user opens; a dev server defeats the point.
- **Don't ship the page into production.** It's built for clicking through by hand. The logic module behind it is the bit worth keeping.
