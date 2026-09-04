# Site search — design

**Date:** 2026-09-04 · **Status:** implemented on `book-series`

## What it is

A command-palette search over every published page, opened from a pill in the header or with Cmd+K (macOS) / Ctrl+K (elsewhere), closed with Esc. It replaces the Pagefind default UI that sat in the Book header and was hidden under 1000px and absent from the series index, Sources and About.

## Decisions

**Index.** Pagefind stays as the indexer (`astro build && pagefind --site dist`). Its bundled UI goes; our dialog talks to the Pagefind JS API (`pagefind.js` in the built site) and renders results with the site's own tokens and typography.

**Scope of the index.** Chapter bodies, Sources and About. The series index and book contents pages are not indexed: they hold nothing that a chapter or book title does not already answer, and indexing them would duplicate every chapter title in the results. Inside a body, these are excluded with `data-pagefind-ignore`: speaker notes (`<Notes>`), deck-only content, interactive blocks (their server-rendered header is all that exists, and quiz text should not be a search hit) and the previous/next chapter footer. Chapters carry `data-pagefind-meta="book:Book n · Title"` so a result can say where it lives.

**Trigger.** A pill in the header's right column, next to the theme toggle: a search glyph, the word "Search" and a muted `⌘K` / `Ctrl K` hint (decided at runtime from the platform). Under 1000px the pill shrinks to the glyph alone, the same size as the theme toggle. Every page with a header gets it: Book layout (chapter and contents pages), the series index, Sources, About and the deck HUD.

**Dialog.** One native `<dialog>` per page, mounted from the trigger component, following the figure lightbox: flat panel in `--bg`, `--border` outline, 16px radius, no shadow, dark backdrop, backdrop click and Esc close, focus returns to the trigger. It sits in the top third of the viewport, `min(40rem, 92vw)` wide. Inside: an input row (glyph, text input, an `Esc` hint pill), then a result list. A short fade on open; none under reduced motion.

**Result row.** One row per Pagefind sub-result, at most three per page and twelve in total: the heading (or page title) in `--text-strong`, a muted kicker "Book 2 · Chapter title" (only the book label when the hit is the page itself, nothing for Sources/About), and the excerpt in the standard text colour with matches in bold strong text, not a coloured fill. The selected row takes `--bg-raised`, the same as the book menu hover.

**Keys.** Cmd/Ctrl+K toggles the dialog from anywhere, including inside inputs. Esc closes. In the input, ArrowDown/ArrowUp move the selection (wrapping), Enter opens the selected result, and typing searches after Pagefind's own 200ms debounce. The deck's global handler already ignores keys whose target is an input, so the two do not fight.

**States.** Empty input: no rows. No hits: one muted line, "No results for “…”". Bundle missing (astro dev, where `pagefind.js` 404s): one muted line saying search needs the built site.

## Structure

- `web/src/scripts/search.ts` — pure parts (`isSearchHotkey`, `rowsFrom`, `move`) and `mountSearch({ trigger, dialog, base, load, navigate })`. Tested in jsdom (`search.test.ts`), with a fake loader in place of Pagefind.
- `web/src/components/Search.astro` — the trigger pill, the dialog markup, the styles (global, since the dialog lives at body level) and the mounting script.
- `Book.astro`, `index.astro`, `sources.astro`, `about.astro`, `Deck.astro` — render `<Search />` in their header.
- `Interactive.tsx`, `Notes.astro`, `DeckOnly.astro`, chapter nav in `Book.astro` — gain `data-pagefind-ignore`.

## Verified

Built site under `npm run preview`, Chrome, dark theme: Cmd+K opens the dialog with the input focused, "measure" lists the chapter and its "Why it holds" heading with the book kicker, ArrowDown then Enter lands on `#why-it-holds`, an unknown term shows the no-results line, result links carry the site base. Light-theme colours checked as computed tokens. The narrow-width layout (glyph-only trigger under 1000px) follows the same media query as the old search slot and was not checked by eye.
