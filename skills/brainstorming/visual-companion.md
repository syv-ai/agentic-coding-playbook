# Visual companion

Show the user mockups, diagrams and option comparisons as **static HTML files** — no server, no build, no dependencies. The page is for seeing; the answer comes back through your harness's question tool (`AskUserQuestion` in Claude Code, `askQuestions` in VS Code Copilot), or in plain text if it has none.

## When to use it

Decide per question: **would the user understand this better by seeing it than by reading it?**

- **Browser:** UI mockups and wireframes, layouts, architecture and data-flow diagrams, side-by-side visual comparisons, look and feel, state machines.
- **Text:** requirements and scope, conceptual A/B/C choices, trade-off lists, API and data-model decisions.

A question *about* a UI topic isn't automatically visual. "What kind of wizard do you want?" is conceptual. "Which of these wizard layouts feels right?" is visual.

## The loop

1. **Write a page.** Read [template.html](template.html), replace the `<!-- CONTENT -->` marker with your content fragment, and write the result to a new file in the OS temp directory (e.g. `<tmpdir>/brainstorm-<slug>.html`). Use a new filename for every screen and version (`layout.html`, `layout-v2.html`) so earlier versions stay comparable.
2. **Open it** best-effort: `open <file>` on macOS, `xdg-open <file>` on Linux, `start "" <file>` on Windows. If that fails (remote or headless), print the absolute `file://` path and ask the user to open it.
3. **Ask for the decision** with the question tool, mirroring the page's options with the same letters and labels. Clicking in the page only highlights; the tool answer is what counts.
4. **Iterate or move on.** If the feedback changes the screen, write a new version and open it. Move on once the question is settled.

## Content fragments

Inject only what goes inside `#content`; the template provides the frame, theme and CSS.

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

Then ask "Which layout?" with options **A — Single column** and **B — Two column**.

## Classes in the template

- **Options (A/B/C):** `.options > .option[data-choice] > .letter + .content`. Add `data-multiselect` to `.options` to allow several.
- **Cards (visual designs):** `.cards > .card[data-choice] > .card-image + .card-body`
- **Mockup container:** `.mockup > .mockup-header + .mockup-body`
- **Split view:** `.split > .mockup + .mockup`
- **Pros/cons:** `.pros-cons > .pros + .cons`
- **Wireframe blocks:** `.mock-nav`, `.mock-sidebar`, `.mock-content`, `.mock-button`, `.mock-input`, `.placeholder`
- **Typography:** `h2`, `h3`, `.subtitle`, `.section`, `.label`

## Diagrams

For flowcharts, state machines and entity relationships, Mermaid from a CDN works when the user is online:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral" });
</script>
<pre class="mermaid">graph TD; A--&gt;B; A--&gt;C;</pre>
```

Offline, build diagrams from plain HTML and CSS (`.mockup`, `.placeholder`).

## Tips

- Scale fidelity to the question: wireframes for layout, polish for polish.
- Put the question on the page ("Which feels more professional?"), not just "Pick one".
- Two to four options per screen.
- Use real content when it matters; placeholders hide design problems.
- Files in the temp directory are disposable. If you wrote them into the project instead, mention that the user can delete them and should keep them out of version control.
