# Visual Companion Guide (static)

A lightweight way to show the user mockups, diagrams, and option comparisons
during brainstorming. **Static HTML files — no server, no Node, no build.** You
write a self-contained HTML file, open it in the user's browser, and immediately
capture their decision in the terminal with your ask-the-user tool
(`AskUserQuestion`). The page is for *seeing*; the answer comes back through the
tool.

## When to use

Decide per-question, not per-session. The test: **would the user understand this
better by seeing it than reading it?**

**Use the browser** when the content itself is visual:
- UI mockups — wireframes, layouts, navigation, component designs
- Architecture diagrams — components, data flow, relationship maps
- Side-by-side visual comparisons — two layouts, two color schemes, two directions
- Design polish — look and feel, spacing, visual hierarchy
- Spatial relationships — state machines, flowcharts, entity relationships

**Use the terminal** when the content is text or tabular:
- Requirements and scope questions — "what does X mean?", "which features?"
- Conceptual A/B/C choices described in words
- Tradeoff lists, comparison tables
- Technical decisions — API design, data modeling, approach selection

A question *about* a UI topic isn't automatically a visual question. "What kind of
wizard do you want?" is conceptual — terminal. "Which of these wizard layouts feels
right?" is visual — browser.

## The loop

1. **Write a self-contained HTML file.** Read [template.html](template.html),
   replace the `<!-- CONTENT -->` marker with your content fragment (see classes
   below), and write the result to a fresh file — e.g.
   `<tmpdir>/brainstorm-<slug>.html` in the OS temp dir, or a `.brainstorm/`
   scratch dir in the project (remind the user to gitignore it). The template
   inlines all CSS and a cosmetic select script, so the output file opens anywhere
   with no dependencies. **Never reuse a filename** — each screen/version gets a
   new file (`layout.html`, `layout-v2.html`, …).

2. **Open it for the user**, best-effort, platform-detected:
   - macOS: `open <file>`
   - Linux: `xdg-open <file>`
   - Windows: `start "" <file>` (cmd) or `Start-Process <file>` (PowerShell)
   - If opening fails (remote/headless/unknown), print the absolute `file://` path
     and ask the user to open it. The flow still works — the answer is captured in
     the terminal regardless.

3. **Immediately ask for the decision** with `AskUserQuestion` (if your harness
   lacks it, ask in plain text). Mirror the options shown in the HTML as the answer
   choices, with the same letters/labels, so the page and the prompt line up. The
   browser selection is cosmetic; the tool answer is the source of truth.

4. **Iterate or advance.** If the feedback changes the current screen, write a new
   version file and open it again. Only move on once the current question is
   settled.

## Writing content fragments

Inject just the content that goes inside `#content`. The template provides the
header, theme, and CSS. Minimal example:

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content"><h3>Single column</h3><p>Clean, focused reading</p></div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content"><h3>Two column</h3><p>Sidebar nav + main content</p></div>
  </div>
</div>
```

Then ask with `AskUserQuestion`: "Which layout?" → options **A — Single column**,
**B — Two column**.

## CSS classes available (from the template)

- **Options (A/B/C):** `.options > .option[data-choice] > .letter + .content`.
  Add `data-multiselect` to `.options` to allow multiple selections.
- **Cards (visual designs):** `.cards > .card[data-choice] > .card-image + .card-body`
- **Mockup container:** `.mockup > .mockup-header + .mockup-body`
- **Split view (side-by-side):** `.split > .mockup + .mockup`
- **Pros/Cons:** `.pros-cons > .pros + .cons`
- **Wireframe blocks:** `.mock-nav`, `.mock-sidebar`, `.mock-content`,
  `.mock-button`, `.mock-input`, `.placeholder`
- **Typography/sections:** `h2`, `h3`, `.subtitle`, `.section`, `.label`

## Diagrams

For flowcharts / state machines / entity relationships, you can embed Mermaid from
a CDN when online:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral" });
</script>
<pre class="mermaid">graph TD; A--&gt;B; A--&gt;C;</pre>
```

Offline, keep diagrams as plain HTML/CSS (boxes via `.mockup`/`.placeholder`).

## Design tips

- Scale fidelity to the question — wireframes for layout, polish for polish.
- Explain the question on the page ("Which feels more professional?"), not just "Pick one".
- 2–4 options per screen.
- Iterate before advancing; new file per version.
- Use real content when it matters (real images for a portfolio); placeholders hide design issues.

## Cleanup

Temp-dir files are disposable — the OS clears them. If you wrote into a project
`.brainstorm/` dir, mention the user can delete it (and should gitignore it).
