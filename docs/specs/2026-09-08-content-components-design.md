# Content components and chrome fixes — design

**Date:** 2026-09-08 · **Status:** approved, implementing on `book-series`

Seven items agreed with the owner: three new content components (code walkthrough, video, collapsible), footnotes, a quiz checkmark, a warmer light theme, and a centred content column.

## 1. Code and the stepped walkthrough

**Highlighting.** Astro's built-in Shiki with two themes (`github-light`, `github-dark`) emitted as CSS variables, switched by the same `data-theme` and `prefers-color-scheme` rules as the rest of the site. Fenced blocks have no fill: the code sits on the page with a faint line-number gutter. Inline code keeps its small tint.

**`CodeSteps`.** A component for code that changes over several states. Authors pass steps as fenced blocks in the default slot, each preceded by a short description and followed by a note:

```mdx
<CodeSteps title="Stop on a check, not a feeling" lang="python">
  <Step desc="The loop stops when the agent thinks it is done." note="Nothing says stop except the agent's own judgment.">
    ```python
    ...
    ```
  </Step>
  ...
</CodeSteps>
```

Rendered in the Interactive layout: title · "step n of m" on the left, progress dots plus Previous and Next pills on the right, the code below, the step's note under it. Every step's highlighted HTML is server-rendered and shipped; the client script only moves lines.

**Motion** (sketch v4, approved). Lines are matched between steps by their text, so a moved line is a move. On a step change, in this order: removed lines lift out (0.35s, up 0.5rem, fade), kept lines glide to their new row (0.7s from 0.15s in), new lines rise in (0.5s from 0.45s in, from 0.5rem below, fade) carrying a 10% accent tint that stays until the next step. The block's height slides over 0.7s. Easing is the site's `cubic-bezier(0.2, 0.8, 0.2, 1)`. Reduced motion: states swap instantly, the tint still shows.

**Keys.** In the deck, ArrowRight and ArrowLeft step the block until it reaches its last or first state, then fall through to the deck. In the book, the buttons only. Two-step use covers before and after.

## 2. Video

`<Video id="…" title="…" />` embeds a YouTube video. It renders a facade: the video's thumbnail (from YouTube's image host), a centred play pill and the title below. On click, the facade is replaced by an iframe from `youtube-nocookie.com` with autoplay, so nothing loads or tracks until the reader chooses. 16:9, full column width, rounded like figures. Shown in the deck as well.

## 3. Collapsible section

`<Details title="…">` wraps the native `<details>`: a summary line with the title and a chevron that turns when open, the body slides open and closed with the site's height animation. No fill, no border. In the deck the section renders open with no summary.

## 4. Quiz checkmark

When every answer is correct, a green check (`--good`) precedes the quiz title on the landing view and the result view. A finished quiz with misses shows the score and no check. The state comes from the stored answers, so it survives a reload.

## 5. Footnotes

Authors write `[^1]` in prose and `[^1]: text` anywhere in the chapter. remark-gfm already renders the reference as a superscript link and the definitions as a list at the end of the chapter. Added: the list is styled as a small muted section under a hairline, with "Footnotes" as a muted label; each reference shows a popover on hover and on focus with the footnote's text, a flat outlined panel in `--bg` like the search dialog, under the reference, closing on mouse-out, blur or Esc. The list and the popover script are hidden in the deck.

## 6. Warmer light theme

`--bg` moves from `#ffffff` to a warm off-white; `--bg-raised`, `--bg-sunken`, `--code-bg` and the viz fills follow the same shift so figures and blocks keep their deltas. Text tokens stay; the contrast test must still pass. The owner judges the amount by eye and it is tuned once in the built site.

## 7. Content stays centred

The book shell grid becomes symmetric: `minmax(0, 1fr) <content> minmax(0, 1fr)`, with the sidebar in the left track aligned right and the on-page contents in the right track aligned left. Collapsing a panel changes nothing about the content column; the collapsed toggle stays in its track. The book contents page, which has no right panel, keeps the same grid and so centres too. Under 1000px the grid is a single column as today.

## Structure

- `web/astro.config.mjs` — Shiki dual themes.
- `web/src/components/CodeSteps.astro`, `Step.astro` — markup; `web/src/scripts/code-steps.ts` — diff, FLIP motion, keys; tests in jsdom.
- `web/src/components/Video.astro`, `Details.astro` — self-contained, with their scripts.
- `web/src/scripts/footnotes.ts` — popover; mounted from `Book.astro`.
- `web/src/components/Quiz.tsx` — checkmark.
- `web/src/styles/global.css` — code block styles, footnote styles, light tokens.
- `web/src/layouts/Book.astro` — grid.
- Chapter 1 of Book 2 gains one example of each new component where it genuinely helps, or a contributor page under `docs/internal/` shows them if it does not.
