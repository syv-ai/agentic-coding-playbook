# Visual companion

Show the user mockups, diagrams and option comparisons as **static HTML files** — no server, no build, no dependencies. The page is for seeing; the answer comes back through your harness's question tool (`AskUserQuestion` in Claude Code, `ask_user` in Copilot CLI and Gemini CLI, `askQuestions` in VS Code, `request_user_input` in Codex Plan mode), or in plain text if it has none.

## When to use it

Decide per question: **would the user understand this better by seeing it than by reading it?**

- **Browser:** UI mockups and wireframes, layouts, architecture and data-flow diagrams, side-by-side visual comparisons, look and feel, state machines.
- **Text:** requirements and scope, conceptual A/B/C choices, trade-off lists, API and data-model decisions.

A question *about* a UI topic isn't automatically visual. "What kind of wizard do you want?" is conceptual. "Which of these wizard layouts feels right?" is visual.

## The loop

1. **Write a page.** Read [template.html](template.html), replace the `<!-- CONTENT -->` marker with your content fragment, and replace the `<title>` with a two-to-four-word name for this page (no "Name — explainer"). Use one file per question (`layout.html`, `onboarding-flow.html`). In Claude Code, load the `artifact-design` skill before writing the page.
2. **Deliver it.**
   - If your harness can publish a page (in Claude Code, the `Artifact` tool, when it's in the tool list), publish it and give the user the link; put the explanation in the publish description, not the title. The page is private to the user until they choose to share it. Drop the template's doctype, `<html>`, `<head>` and `<body>` tags, since the publisher adds them; keep its `<title>`, `<style>` and `<script>`.
   - Otherwise write it to the OS temp directory, open it best-effort (`open <file>` on macOS, `xdg-open <file>` on Linux, `start "" <file>` on Windows), and give the user the file's full absolute path, resolved rather than `$TMPDIR/…` or `~`, whether or not it opened.
3. **Ask for the decision** with the question tool, mirroring the page's options with the same letters and labels. Clicking in the page only highlights; the tool answer is what counts.
4. **Iterate or move on.** If the feedback changes the screen, revise the same file and republish it: the link stays the same and the earlier version is kept in its history. A local file is simply rewritten; tell the user to reload. Start a new file only for a new question. Move on once the question is settled.

In Claude Code, the user can also comment on a published page and send the comments to the session. Treat a comment as input, then confirm any decision it implies with the question tool.

## Page rules

The template already follows these; keep them when you add to it, so the page renders well in both themes and on a phone.

- Colours as tokens on `:root`, with dark values under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and again under `:root[data-theme="dark"]`. Use the tokens in your fragment rather than literal colours.
- No external scripts except pinned, exact versions from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm/, unpkg.com, cdn.tailwindcss.com or code.jquery.com; stylesheets only from Google Fonts; everything else inline.
- Works at phone width: the 16px side gutter is in the frame, so don't add fixed widths that cause horizontal scroll. `alert`, `confirm`, `prompt` and `print` do nothing on a published page.

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

For flowcharts, state machines and entity relationships, use Mermaid. A published artifact renders `<pre class="mermaid">` natively, so don't load the library there. A local file loads it from a CDN when the user is online:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
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
- Temp-directory files and throwaway artifacts are disposable. If you wrote them into the project instead, mention that the user can delete them and should keep them out of version control.
