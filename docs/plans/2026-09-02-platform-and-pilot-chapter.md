# Platform + Pilot Chapter Implementation Plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MkDocs and the Next.js slides app with one Astro site in `web/` that renders every chapter as a book page and as a deck from a single MDX file, proven end to end on Book 2 chapter 1.

**Architecture:** Chapters are MDX files in a content collection. A rehype plugin wraps each `##` section in a `<section class="slide">` at build time, so the book layout and the deck layout render the same HTML and differ only in CSS and a small client script. Quizzes are React islands; visuals are D3 renderers mounted by a vanilla script that redraws on theme change; everything else is plain Astro components. Static output, deployed to GitHub Pages from `main` only.

**Tech Stack:** Astro 7.2, @astrojs/mdx 8, @astrojs/react 6, React 19.2, D3 7.9, @dagrejs/dagre 1.1.8, Pagefind 1.5, Vitest 4, jsdom, Testing Library, TypeScript 7. Node 24, npm.

**Spec:** `docs/specs/2026-09-02-book-series-design.md`. Work happens on the `book-series` branch. All commands below run from the repo root unless the step says `cd web`.

---

## File structure

```
web/
  package.json                      scripts: dev, build (astro build + pagefind), check, test, check:links
  astro.config.mjs                  site/base for GitHub Pages, mdx + react, rehype plugins
  tsconfig.json                     strict + react-jsx
  vitest.config.ts                  getViteConfig from astro
  public/favicon.svg, logo.svg      moved from docs/assets
  scripts/check-links.mjs           post-build internal link check over dist/
  src/content.config.ts             three collections: books, chapters, pages
  src/content/books/<book>/book.yaml               book metadata
  src/content/books/<book>/NN-<slug>.mdx           chapters
  src/content/books/<book>/_components/*.tsx       chapter-specific demos
  src/content/pages/sources.md, about.md           series-level pages
  src/styles/global.css             tokens (light + dark), typography, prose, viz tokens
  src/lib/paths.ts                  withBase(), chapter/book URL helpers
  src/lib/chapters.ts               parseChapterId(), sortChapters(), neighbours()
  src/lib/rehype-slides.ts          the section-wrapping rehype plugin
  src/lib/storage.ts                readJSON()/writeJSON() over localStorage, never throws
  src/lib/viz/theme.ts              VizTheme read from CSS custom properties
  src/lib/viz/flow.ts               renderFlow()   (ported from docs/javascripts/visuals/flow-diagram.js)
  src/lib/viz/funnel.ts             renderFunnel() (ported from quality-funnel.js)
  src/lib/viz/graph.ts              renderGraph()  (ported from graph-diagram.js)
  src/lib/viz/index.ts              mountVisuals(): parse data-spec, render, redraw on theme change, reveal on scroll
  src/components/Quiz.tsx           React island
  src/components/Visual.astro       figure + data-spec + mount script
  src/components/Callout.astro      note | tension | supersedes
  src/components/Source.astro       quote card with provenance chip
  src/components/Notes.astro        speaker notes (hidden in book, toggled in deck)
  src/components/BookOnly.astro
  src/components/DeckOnly.astro
  src/components/ThemeToggle.astro
  src/layouts/Base.astro            <head>, fonts, theme bootstrap, global css
  src/layouts/Book.astro            top bar, sidebar TOC, main, on-page TOC, prev/next
  src/layouts/Deck.astro            slide stage, counter, notes panel, deck.ts
  src/scripts/deck.ts               keyboard navigation, notes, fullscreen, Esc to book
  src/pages/index.astro             series index
  src/pages/[book]/index.astro      book TOC
  src/pages/[book]/[chapter]/index.astro   book view
  src/pages/[book]/[chapter]/deck.astro    deck view
  src/pages/sources.astro, about.astro
docs/legacy/                        the 14 modules + index.md + about-syv.md, unbuilt
.github/workflows/site.yml          replaces docs.yml
```

Deleted on the branch: `mkdocs.yml`, `requirements-docs.txt`, `slides/`, `docs/javascripts/`, `docs/assets/`, `.github/workflows/docs.yml`.

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `web/package.json`
- Create: `web/astro.config.mjs`
- Create: `web/tsconfig.json`
- Create: `web/src/pages/index.astro` (placeholder, replaced in Task 12)
- Modify: `.gitignore`

- [ ] **Step 1: Write package.json with pinned versions**

```json
{
  "name": "agentic-coding-playbook-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "check:links": "node scripts/check-links.mjs"
  },
  "dependencies": {
    "@astrojs/mdx": "8.0.0",
    "@astrojs/react": "6.0.5",
    "@dagrejs/dagre": "1.1.8",
    "astro": "7.2.10",
    "d3": "7.9.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@testing-library/dom": "10.4.1",
    "@testing-library/react": "16.3.3",
    "@types/d3": "7.4.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "hastscript": "9.0.1",
    "hast-util-to-html": "9.0.5",
    "jsdom": "30.0.1",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  }
}
```

- [ ] **Step 2: Write astro.config.mjs**

```js
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import { rehypeSlides } from "./src/lib/rehype-slides.ts";

export default defineConfig({
  site: "https://syv-ai.github.io",
  base: "/agentic-coding-playbook",
  trailingSlash: "always",
  output: "static",
  integrations: [mdx(), react()],
  markdown: {
    // rehypeHeadingIds must run before rehypeSlides so sections can copy the h2 id.
    rehypePlugins: [rehypeHeadingIds, rehypeSlides],
  },
});
```

The rehype plugin does not exist yet; Task 6 creates it. Until then, the build in Step 6 uses a stub created in Step 4.

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["vitest/globals"]
  },
  "include": [".astro/types.d.ts", "src/**/*", "scripts/**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Write a stub rehype plugin and a placeholder page**

`web/src/lib/rehype-slides.ts`:

```ts
import type { Root } from "hast";

/** Stub; Task 6 replaces this with the real plugin. */
export function rehypeSlides() {
  return (_tree: Root) => {};
}
```

`web/src/pages/index.astro`:

```astro
---
---
<html lang="en"><body><h1>Agentic Coding Playbook</h1></body></html>
```

- [ ] **Step 5: Update .gitignore**

Replace the whole file with:

```
# macOS
.DS_Store

# Astro
web/node_modules/
web/dist/
web/.astro/

# Dash tooling
.dash/
docs/internal/VOICE.md
```

- [ ] **Step 6: Install and build**

Run:

```bash
cd web && npm install && npm run build
```

Expected: `npm install` completes without peer-dependency errors. `astro build` prints `Complete!` and `web/dist/index.html` exists. If `@astrojs/markdown-remark` cannot be resolved, run `npm install @astrojs/markdown-remark` and add it to `dependencies` at the version npm picked.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/astro.config.mjs web/tsconfig.json web/src .gitignore
git commit -m "feat(web): scaffold Astro project with mdx and react"
```

---

### Task 2: Vitest and a smoke test

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/src/lib/paths.ts`
- Test: `web/src/lib/paths.test.ts`

- [ ] **Step 1: Write vitest.config.ts**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 2: Write the failing test**

`web/src/lib/paths.test.ts`:

```ts
import { withBase, bookPath, chapterPath, deckPath } from "./paths";

describe("withBase", () => {
  it("joins base and path with exactly one slash and a trailing slash", () => {
    expect(withBase("/agentic-coding-playbook", "/working-well")).toBe("/agentic-coding-playbook/working-well/");
    expect(withBase("/agentic-coding-playbook/", "working-well/")).toBe("/agentic-coding-playbook/working-well/");
    expect(withBase("/", "/")).toBe("/");
  });
});

describe("chapter urls", () => {
  it("builds book, chapter and deck paths", () => {
    expect(bookPath("/b", "working-well")).toBe("/b/working-well/");
    expect(chapterPath("/b", "working-well", "measure-success-first")).toBe("/b/working-well/measure-success-first/");
    expect(deckPath("/b", "working-well", "measure-success-first")).toBe("/b/working-well/measure-success-first/deck/");
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd web && npm test`
Expected: FAIL with "Failed to resolve import "./paths"".

- [ ] **Step 4: Write paths.ts**

```ts
/** Join the site base and a path: one slash between, one trailing slash. */
export function withBase(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return p ? `${b}/${p}/` : `${b}/` || "/";
}

export const bookPath = (base: string, book: string) => withBase(base, book);
export const chapterPath = (base: string, book: string, chapter: string) => withBase(base, `${book}/${chapter}`);
export const deckPath = (base: string, book: string, chapter: string) => withBase(base, `${book}/${chapter}/deck`);

/** The site base at runtime (Astro injects it). */
export const BASE: string = import.meta.env.BASE_URL ?? "/";
```

- [ ] **Step 5: Run the tests**

Run: `cd web && npm test`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add web/vitest.config.ts web/src/lib/paths.ts web/src/lib/paths.test.ts
git commit -m "feat(web): vitest setup and url helpers"
```

---

### Task 3: Theme tokens and base layout

**Files:**
- Create: `web/src/styles/global.css`
- Create: `web/src/lib/storage.ts`
- Test: `web/src/lib/storage.test.ts`
- Create: `web/src/components/ThemeToggle.astro`
- Create: `web/src/layouts/Base.astro`
- Move: `docs/assets/favicon.svg` → `web/public/favicon.svg`, `docs/assets/logo.svg` → `web/public/logo.svg`

- [ ] **Step 1: Write the failing storage test**

`web/src/lib/storage.test.ts`:

```ts
// @vitest-environment jsdom
import { readJSON, writeJSON } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips JSON", () => {
    writeJSON("k", { a: 1 });
    expect(readJSON("k", null)).toEqual({ a: 1 });
  });

  it("returns the fallback for missing or corrupt values", () => {
    expect(readJSON("missing", "fb")).toBe("fb");
    localStorage.setItem("bad", "{not json");
    expect(readJSON("bad", "fb")).toBe("fb");
  });

  it("never throws when localStorage is unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    expect(() => writeJSON("k", 1)).not.toThrow();
    expect(readJSON("k", "fb")).toBe("fb");
    Object.defineProperty(window, "localStorage", original);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- storage`
Expected: FAIL, cannot resolve "./storage".

- [ ] **Step 3: Write storage.ts**

```ts
/** localStorage access that never throws: private windows, blocked storage and corrupt values all yield the fallback. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable; the page still works */
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd web && npm test -- storage`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write global.css**

Light tokens on bare `:root`, dark under both the media query and the explicit attribute. Colour rules from the spec: no same-hue text on its own fill, no dark grey on black.

```css
:root {
  color-scheme: light;
  --bg: #ffffff;
  --bg-raised: #f5f5f7;
  --bg-sunken: #ebebef;
  --text: #1a1a1e;
  --text-muted: #5c5c66;
  --text-faint: #8e8e98;
  --border: #d9d9df;
  --accent: #7c3aed;
  --accent-text: #ffffff;
  --link: #7e22ce;
  --good: #15803d;
  --warn: #b45309;
  --bad: #b91c1c;
  --code-bg: #f1f1f4;
  --font-sans: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  --measure: 70ch;

  /* Visual (D3) tokens: read by src/lib/viz/theme.ts */
  --viz-bg: var(--bg);
  --viz-fill: #ffffff;
  --viz-border: #1a1a1e;
  --viz-text: #1a1a1e;
  --viz-sub: #5c5c66;
  --viz-line: #1a1a1e;
  --viz-connector: #8e8e98;
  --viz-good: #15803d;
  --viz-defect: #e0857c;
  --viz-defect-text: #1a1a1e;
  --viz-accent: var(--accent);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0a0a0b;
    --bg-raised: #141417;
    --bg-sunken: #000000;
    --text: #e8e8ec;
    --text-muted: #b6b6bd;
    --text-faint: #7d7d86;
    --border: #2a2a30;
    --accent: #c084fc;
    --accent-text: #0a0a0b;
    --link: #d8b4fe;
    --good: #7ee787;
    --warn: #fbbf24;
    --bad: #f87171;
    --code-bg: #141417;
    --viz-fill: #000000;
    --viz-border: #ffffff;
    --viz-text: #ffffff;
    --viz-sub: #a1a1aa;
    --viz-line: #ffffff;
    --viz-connector: #8b8b93;
    --viz-good: #7ee787;
    --viz-defect: #e0857c;
    --viz-defect-text: #0a0a0b;
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0a0a0b;
  --bg-raised: #141417;
  --bg-sunken: #000000;
  --text: #e8e8ec;
  --text-muted: #b6b6bd;
  --text-faint: #7d7d86;
  --border: #2a2a30;
  --accent: #c084fc;
  --accent-text: #0a0a0b;
  --link: #d8b4fe;
  --good: #7ee787;
  --warn: #fbbf24;
  --bad: #f87171;
  --code-bg: #141417;
  --viz-fill: #000000;
  --viz-border: #ffffff;
  --viz-text: #ffffff;
  --viz-sub: #a1a1aa;
  --viz-line: #ffffff;
  --viz-connector: #8b8b93;
  --viz-good: #7ee787;
  --viz-defect: #e0857c;
  --viz-defect-text: #0a0a0b;
}

* { box-sizing: border-box; }
html { font-family: var(--font-sans); background: var(--bg); color: var(--text); line-height: 1.6; }
body { margin: 0; }
a { color: var(--link); }
a:hover { color: var(--accent); }
code, pre, kbd { font-family: var(--font-mono); font-size: 0.92em; }
pre { background: var(--code-bg); padding: 1rem; border-radius: 8px; overflow-x: auto; }
:not(pre) > code { background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
h1, h2, h3 { line-height: 1.2; letter-spacing: -0.01em; }
h1 { font-size: 2.2rem; margin: 0 0 0.5rem; }
h2 { font-size: 1.5rem; margin: 2.5rem 0 0.75rem; }
h3 { font-size: 1.15rem; margin: 1.75rem 0 0.5rem; }
hr { border: 0; border-top: 1px solid var(--border); margin: 2rem 0; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--border); vertical-align: top; }
img, svg { max-width: 100%; }
.prose { max-width: var(--measure); }
.prose p, .prose ul, .prose ol { margin: 0 0 1rem; }
.muted { color: var(--text-muted); }
.faint { color: var(--text-faint); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Rendering-specific visibility. Layouts set data-render on <html>. */
html[data-render="book"] [data-deck-only] { display: none; }
html[data-render="deck"] [data-book-only] { display: none; }
html[data-render="book"] [data-notes] { display: none; }
```

- [ ] **Step 6: Write ThemeToggle.astro**

```astro
---
---
<button class="theme-toggle" type="button" aria-label="Toggle colour theme" title="Toggle colour theme">
  <span data-when="light" aria-hidden="true">☾</span>
  <span data-when="dark" aria-hidden="true">☀</span>
</button>

<style>
  .theme-toggle { background: none; border: 1px solid var(--border); color: var(--text); border-radius: 999px; width: 2rem; height: 2rem; cursor: pointer; font-size: 1rem; line-height: 1; }
  .theme-toggle:hover { border-color: var(--accent); }
  :global(html[data-theme="dark"]) [data-when="light"] { display: none; }
  :global(html:not([data-theme="dark"])) [data-when="dark"] { display: none; }
  @media (prefers-color-scheme: dark) {
    :global(html:not([data-theme="light"])) [data-when="light"] { display: none; }
    :global(html:not([data-theme="light"])) [data-when="dark"] { display: inline; }
  }
</style>

<script>
  import { writeJSON } from "../lib/storage";
  // Base.astro applies the stored choice before first paint; this only handles the click.
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = () => root.dataset.theme ?? (systemDark() ? "dark" : "light");
  button?.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    writeJSON("theme", next);
  });
</script>
```

- [ ] **Step 7: Write Base.astro**

```astro
---
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
  render: "book" | "deck";
}
const { title, description = "", render } = Astro.props;
---
<!doctype html>
<html lang="en" data-render={render}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · Agentic Coding Playbook</title>
    {description && <meta name="description" content={description} />}
    <link rel="icon" href={`${import.meta.env.BASE_URL}favicon.svg`} type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
    <script is:inline>
      // Apply the stored theme before first paint to avoid a flash. Mirrors src/lib/storage.ts, inlined on purpose.
      try {
        var t = JSON.parse(localStorage.getItem("theme"));
        if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
      } catch (e) {}
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 8: Move the assets and use the layout in the placeholder page**

```bash
mkdir -p web/public && git mv docs/assets/favicon.svg web/public/favicon.svg && git mv docs/assets/logo.svg web/public/logo.svg
```

Replace `web/src/pages/index.astro` with:

```astro
---
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
---
<Base title="Series" render="book">
  <main class="prose" style="padding:2rem">
    <ThemeToggle />
    <h1>Agentic Coding Playbook</h1>
  </main>
</Base>
```

- [ ] **Step 9: Build and check types**

Run: `cd web && npm run build && npm run check`
Expected: build completes; `astro check` reports 0 errors.

- [ ] **Step 10: Commit**

```bash
git add -A web docs/assets
git commit -m "feat(web): theme tokens, safe storage, base layout and theme toggle"
```

---

### Task 4: Content collections and chapter helpers

**Files:**
- Create: `web/src/content.config.ts`
- Create: `web/src/lib/chapters.ts`
- Test: `web/src/lib/chapters.test.ts`
- Create: `web/src/content/books/how-agentic-coding-works/book.yaml`
- Create: `web/src/content/books/working-well/book.yaml`
- Create: `web/src/content/books/agentic-sdlc/book.yaml`
- Create: `web/src/content/books/leading-the-shift/book.yaml`
- Create: `web/src/content/pages/about.md`
- Move: `docs/research-summary.md` → `web/src/content/pages/sources.md`

- [ ] **Step 1: Write the failing chapters test**

`web/src/lib/chapters.test.ts`:

```ts
import { parseChapterId, bookSlugFromId, sortChapters, neighbours } from "./chapters";

describe("parseChapterId", () => {
  it("splits the collection id into book and chapter slug, dropping the numeric prefix", () => {
    expect(parseChapterId("working-well/01-measure-success-first")).toEqual({
      book: "working-well",
      slug: "measure-success-first",
    });
  });
  it("throws on ids without a numeric prefix", () => {
    expect(() => parseChapterId("working-well/intro")).toThrow(/numeric prefix/);
  });
});

describe("bookSlugFromId", () => {
  it("takes the folder name from a book.yaml entry id", () => {
    expect(bookSlugFromId("working-well/book")).toBe("working-well");
  });
});

describe("sortChapters and neighbours", () => {
  const chapters = [
    { id: "b/03-c", data: { order: 3 } },
    { id: "b/01-a", data: { order: 1 } },
    { id: "b/02-b", data: { order: 2 } },
  ];
  it("sorts by order", () => {
    expect(sortChapters(chapters).map((c) => c.id)).toEqual(["b/01-a", "b/02-b", "b/03-c"]);
  });
  it("finds previous and next, with undefined at the ends", () => {
    const sorted = sortChapters(chapters);
    expect(neighbours(sorted, "b/01-a")).toEqual({ prev: undefined, next: sorted[1] });
    expect(neighbours(sorted, "b/02-b")).toEqual({ prev: sorted[0], next: sorted[2] });
    expect(neighbours(sorted, "b/03-c")).toEqual({ prev: sorted[1], next: undefined });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- chapters`
Expected: FAIL, cannot resolve "./chapters".

- [ ] **Step 3: Write chapters.ts**

```ts
export interface ChapterRef {
  book: string;
  slug: string;
}

/** "working-well/01-measure-success-first" → { book: "working-well", slug: "measure-success-first" } */
export function parseChapterId(id: string): ChapterRef {
  const [book, file] = id.split("/");
  const m = file?.match(/^\d{2}-(.+)$/);
  if (!book || !m) throw new Error(`Chapter id "${id}" must be "<book>/<NN>-<slug>" with a numeric prefix`);
  return { book, slug: m[1] };
}

/** "working-well/book" → "working-well" */
export function bookSlugFromId(id: string): string {
  return id.split("/")[0];
}

interface Ordered {
  id: string;
  data: { order: number };
}

export function sortChapters<T extends Ordered>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => a.data.order - b.data.order);
}

export function neighbours<T extends Ordered>(sorted: T[], id: string): { prev: T | undefined; next: T | undefined } {
  const i = sorted.findIndex((c) => c.id === id);
  return { prev: sorted[i - 1], next: sorted[i + 1] };
}
```

- [ ] **Step 4: Run the tests**

Run: `cd web && npm test -- chapters`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write content.config.ts**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const books = defineCollection({
  loader: glob({ pattern: "*/book.yaml", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    audience: z.string(),
    order: z.number().int(),
    gated: z.boolean().default(false),
    parts: z.array(z.object({ key: z.string(), title: z.string() })).default([]),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: "*/[0-9][0-9]-*.mdx", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    summary: z.string(),
    status: z.enum(["draft", "review", "published"]),
    part: z.string().optional(),
    sources: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: z.object({ title: z.string() }),
});

export const collections = { books, chapters, pages };
```

If `astro/zod` does not resolve, use `import { z } from "astro:content";` instead.

- [ ] **Step 6: Write the four book.yaml files**

`web/src/content/books/how-agentic-coding-works/book.yaml`:

```yaml
title: How agentic coding works
audience: Developers new to agents. Table stakes, told once, short.
order: 1
```

`web/src/content/books/working-well/book.yaml`:

```yaml
title: Working well with agents
audience: Developers who already use agents. Where the playbook says what only Syv can say.
order: 2
parts:
  - key: A
    title: Verification makes speed safe
  - key: B
    title: Craft raises the ceiling
```

`web/src/content/books/agentic-sdlc/book.yaml`:

```yaml
title: The agentic SDLC
audience: Tech leads and engineering managers running agentic delivery across teams.
order: 3
```

`web/src/content/books/leading-the-shift/book.yaml`:

```yaml
title: Leading the shift
audience: CTOs, heads of engineering and business leaders. No code.
order: 4
gated: true
```

- [ ] **Step 7: Move the sources page and write about.md**

```bash
mkdir -p web/src/content/pages && git mv docs/research-summary.md web/src/content/pages/sources.md
```

Then prepend front matter to `web/src/content/pages/sources.md` (the file starts with a `# ...` heading; keep everything below it, remove that first heading line since the page template renders the title):

```md
---
title: Sources
---
```

`web/src/content/pages/about.md` (content from `docs/about-syv.md`, which moves to legacy in Task 15; copy its body under this front matter):

```md
---
title: About Syv.ai
---
```

- [ ] **Step 8: Sync types and check**

Run: `cd web && npx astro sync && npm run check`
Expected: `astro sync` generates `.astro/types.d.ts`; check reports 0 errors. If the glob loader rejects `book.yaml`, rename the four files to `book.json` with the same keys and change the pattern to `*/book.json`.

- [ ] **Step 9: Commit**

```bash
git add -A web docs/research-summary.md
git commit -m "feat(web): content collections for books, chapters and pages"
```

---

### Task 5: Static components (Callout, Source, Notes, BookOnly, DeckOnly)

**Files:**
- Create: `web/src/components/Callout.astro`
- Create: `web/src/components/Source.astro`
- Create: `web/src/components/Notes.astro`
- Create: `web/src/components/BookOnly.astro`
- Create: `web/src/components/DeckOnly.astro`
- Test: `web/src/components/static.test.ts`

- [ ] **Step 1: Write the failing Container API test**

`web/src/components/static.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Callout from "./Callout.astro";
import Source from "./Source.astro";
import Notes from "./Notes.astro";
import BookOnly from "./BookOnly.astro";
import DeckOnly from "./DeckOnly.astro";

describe("static components", () => {
  it("Callout renders its kind and label", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Callout, { props: { kind: "tension" }, slots: { default: "Both hold." } });
    expect(html).toContain('data-kind="tension"');
    expect(html).toContain("Active tension");
    expect(html).toContain("Both hold.");
  });

  it("Source renders the provenance chip", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Source, {
      props: { who: "Fred Brooks", work: "No Silver Bullet", year: 1986, href: "https://example.org", provenance: "read" },
      slots: { default: "<q>quoted</q>" },
    });
    expect(html).toContain("Read in full");
    expect(html).toContain("Fred Brooks");
    expect(html).toContain('href="https://example.org"');
  });

  it("Notes, BookOnly and DeckOnly carry their data attributes", async () => {
    const c = await AstroContainer.create();
    expect(await c.renderToString(Notes, { slots: { default: "n" } })).toContain("data-notes");
    expect(await c.renderToString(BookOnly, { slots: { default: "b" } })).toContain("data-book-only");
    expect(await c.renderToString(DeckOnly, { slots: { default: "d" } })).toContain("data-deck-only");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- static`
Expected: FAIL, cannot resolve "./Callout.astro".

- [ ] **Step 3: Write Callout.astro**

```astro
---
interface Props {
  kind?: "note" | "tension" | "supersedes";
  title?: string;
}
const { kind = "note", title } = Astro.props;
const labels = { note: "Note", tension: "Active tension", supersedes: "Superseded" } as const;
---
<aside class="callout" data-kind={kind}>
  <div class="callout-label">{title ?? labels[kind]}</div>
  <div class="callout-body"><slot /></div>
</aside>

<style>
  .callout { border-radius: 10px; padding: 0.9rem 1.1rem; margin: 1.25rem 0; background: var(--bg-raised); border-left: 3px solid var(--accent); }
  .callout[data-kind="tension"] { border-left-color: var(--warn); }
  .callout[data-kind="supersedes"] { border-left-color: var(--text-faint); }
  .callout-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.3rem; }
  .callout-body :global(p:last-child) { margin-bottom: 0; }
</style>
```

- [ ] **Step 4: Write Source.astro**

```astro
---
interface Props {
  who: string;
  work: string;
  year?: number | string;
  href?: string;
  provenance: "read" | "stated";
}
const { who, work, year, href, provenance } = Astro.props;
const chip = provenance === "read" ? "Read in full" : "Stated, not quoted";
---
<figure class="source" data-provenance={provenance}>
  <div class="source-year">{year}<small>{chip}</small></div>
  <div class="source-body">
    <slot />
    <p class="source-attr"><b>{who}</b>, <cite>{work}</cite>.</p>
    <p class="source-ref">
      <span class="chip">{chip}</span>
      {href && <a href={href} rel="noopener">{href.replace(/^https?:\/\//, "")}</a>}
    </p>
  </div>
</figure>

<style>
  .source { display: grid; grid-template-columns: 5.5rem 1fr; gap: 1rem; margin: 1.5rem 0; padding: 1rem 1.1rem; background: var(--bg-raised); border-radius: 10px; }
  .source-year { font-weight: 600; color: var(--text-muted); }
  .source-year small { display: block; font-weight: 400; font-size: 0.7rem; color: var(--text-faint); }
  .source-body :global(q) { display: block; font-style: italic; margin: 0 0 0.6rem; }
  .source-body :global(q)::before, .source-body :global(q)::after { content: none; }
  .source-attr { margin: 0.4rem 0 0.2rem; }
  .source-ref { margin: 0; font-size: 0.85rem; }
  .chip { display: inline-block; font-size: 0.72rem; padding: 0.05rem 0.5rem; border-radius: 999px; margin-right: 0.5rem; background: var(--bg-sunken); color: var(--text-muted); }
  .source[data-provenance="read"] .chip { color: var(--good); }
  .source[data-provenance="stated"] .chip { color: var(--warn); }
  @media (max-width: 600px) { .source { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 5: Write Notes.astro, BookOnly.astro, DeckOnly.astro**

`Notes.astro`:

```astro
---
---
<aside class="notes" data-notes>
  <div class="notes-label">Notes</div>
  <slot />
</aside>

<style>
  .notes { font-size: 0.9rem; color: var(--text-muted); }
  .notes-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
</style>
```

`BookOnly.astro`:

```astro
---
---
<div data-book-only><slot /></div>
```

`DeckOnly.astro`:

```astro
---
---
<div data-deck-only><slot /></div>
```

- [ ] **Step 6: Run the tests**

Run: `cd web && npm test -- static`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add web/src/components
git commit -m "feat(web): Callout, Source, Notes, BookOnly and DeckOnly components"
```

---

### Task 6: The rehype-slides plugin

**Files:**
- Modify: `web/src/lib/rehype-slides.ts` (replace the stub)
- Test: `web/src/lib/rehype-slides.test.ts`

Rules from the spec: one `##` section = one slide; a `---` (`<hr>`) inside a section forces a break; content before the first `##` is its own "intro" section if non-empty; the title slide is added by the deck layout, not here.

- [ ] **Step 1: Write the failing test**

`web/src/lib/rehype-slides.test.ts`:

```ts
import { h } from "hastscript";
import { toHtml } from "hast-util-to-html";
import type { Root } from "hast";
import { rehypeSlides } from "./rehype-slides";

function run(tree: Root): string {
  rehypeSlides()(tree);
  return toHtml(tree);
}

describe("rehypeSlides", () => {
  it("wraps each h2 and what follows in a section, and puts leading content in an intro section", () => {
    const tree = h(null, [
      h("p", "lead"),
      h("h2", { id: "why-it-holds" }, "Why it holds"),
      h("p", "one"),
      h("h2", { id: "what-it-changes" }, "What it changes"),
      h("ul", [h("li", "do")]),
    ]) as Root;
    expect(run(tree)).toBe(
      '<section class="slide" data-slide="intro"><p>lead</p></section>' +
        '<section class="slide" data-slide="why-it-holds" data-title="Why it holds" data-anchor="why-it-holds"><h2 id="why-it-holds">Why it holds</h2><p>one</p></section>' +
        '<section class="slide" data-slide="what-it-changes" data-title="What it changes" data-anchor="what-it-changes"><h2 id="what-it-changes">What it changes</h2><ul><li>do</li></ul></section>'
    );
  });

  it("splits a section at an hr and marks the continuation", () => {
    const tree = h(null, [h("h2", { id: "a" }, "A"), h("p", "1"), h("hr"), h("p", "2")]) as Root;
    expect(run(tree)).toBe(
      '<section class="slide" data-slide="a" data-title="A" data-anchor="a"><h2 id="a">A</h2><p>1</p></section>' +
        '<section class="slide" data-slide="a-2" data-title="A" data-anchor="a" data-continued><p>2</p></section>'
    );
  });

  it("drops an empty intro (whitespace only)", () => {
    const tree = h(null, [{ type: "text", value: "\n" }, h("h2", { id: "a" }, "A"), h("p", "1")]) as Root;
    expect(run(tree)).not.toContain('data-slide="intro"');
  });

  it("keeps non-element top-level nodes (MDX components) inside the current section", () => {
    const tree = {
      type: "root",
      children: [
        h("h2", { id: "a" }, "A"),
        { type: "mdxJsxFlowElement", name: "Quiz", attributes: [], children: [] },
      ],
    } as unknown as Root;
    rehypeSlides()(tree);
    const section = tree.children[0] as any;
    expect(section.tagName).toBe("section");
    expect(section.children.map((c: any) => c.type ?? c.tagName)).toEqual(["element", "mdxJsxFlowElement"]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- rehype-slides`
Expected: FAIL; the stub leaves the tree unchanged so the first assertion fails.

- [ ] **Step 3: Write the plugin**

```ts
import type { Element, Root, RootContent } from "hast";
import { toString } from "hast-util-to-string";

/**
 * Wrap a chapter's top-level nodes into <section class="slide"> groups:
 * one per h2, split again at each hr, plus an "intro" section for content before the first h2.
 * Both the book layout and the deck layout consume these sections.
 */
export function rehypeSlides() {
  return (tree: Root) => {
    const out: RootContent[] = [];
    let current: Element | null = null;
    let title = "";
    let anchor = "";
    let splitCount = 0;

    const open = (props: Record<string, unknown>): Element => {
      const section: Element = { type: "element", tagName: "section", properties: { className: ["slide"], ...props }, children: [] };
      out.push(section);
      return section;
    };
    const isBlank = (n: RootContent) => n.type === "text" && n.value.trim() === "";

    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        title = toString(node);
        anchor = String(node.properties?.id ?? "");
        splitCount = 0;
        current = open({ dataSlide: anchor || title, dataTitle: title, dataAnchor: anchor });
        current.children.push(node);
        continue;
      }
      if (node.type === "element" && node.tagName === "hr" && current) {
        splitCount += 1;
        current = open({ dataSlide: `${anchor || title}-${splitCount + 1}`, dataTitle: title, dataAnchor: anchor, dataContinued: true });
        continue;
      }
      if (!current) {
        if (isBlank(node)) continue;
        current = open({ dataSlide: "intro" });
      }
      current.children.push(node);
    }
    tree.children = out;
  };
}
```

Add the dependency the plugin uses:

```bash
cd web && npm install hast-util-to-string@4.0.0
```

(If npm reports a newer 4.x as the only available version, take it and pin what it installed.)

- [ ] **Step 4: Run the tests**

Run: `cd web && npm test -- rehype-slides`
Expected: PASS, 4 tests. If `data-continued` serialises as `data-continued=""`, change the expected string in the test to match; both forms are valid HTML.

- [ ] **Step 5: Build to confirm the plugin loads through astro.config**

Run: `cd web && npm run build`
Expected: `Complete!`.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/rehype-slides.ts web/src/lib/rehype-slides.test.ts web/package.json web/package-lock.json
git commit -m "feat(web): rehype plugin that wraps h2 sections into slides"
```

---

### Task 7: Quiz island

**Files:**
- Create: `web/src/components/Quiz.tsx`
- Test: `web/src/components/Quiz.test.tsx`

- [ ] **Step 1: Write the failing test**

`web/src/components/Quiz.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Quiz from "./Quiz";

const questions = [
  {
    prompt: "When do you write the check?",
    choices: [
      { text: "After the agent says it is done", explain: "Then the check only confirms what you already believe." },
      { text: "Before the agent starts", correct: true, explain: "The check is the target the loop optimises for." },
    ],
  },
];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Quiz", () => {
  it("shows the explanation and marks a wrong answer", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("After the agent says it is done"));
    expect(screen.getByText(/only confirms/)).toBeTruthy();
    expect(screen.getByText("After the agent says it is done").closest("button")?.dataset.state).toBe("wrong");
  });

  it("marks a correct answer and disables further choices for that question", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    expect(screen.getByText("After the agent says it is done").closest("button")?.disabled).toBe(true);
  });

  it("restores answers from storage and resets", () => {
    localStorage.setItem("quiz:t", JSON.stringify({ 0: 1 }));
    render(<Quiz id="t" questions={questions} />);
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("idle");
  });

  it("works when storage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    Object.defineProperty(window, "localStorage", original);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- Quiz`
Expected: FAIL, cannot resolve "./Quiz".

- [ ] **Step 3: Write Quiz.tsx**

```tsx
import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";

export interface Choice {
  text: string;
  correct?: boolean;
  explain: string;
}
export interface Question {
  prompt: string;
  choices: Choice[];
}
interface Props {
  id: string;
  questions: Question[];
}

type Answers = Record<number, number>;

export default function Quiz({ id, questions }: Props) {
  const key = `quiz:${id}`;
  const [answers, setAnswers] = useState<Answers>(() => readJSON<Answers>(key, {}));

  useEffect(() => {
    writeJSON(key, answers);
  }, [key, answers]);

  const choose = (q: number, c: number) => {
    if (answers[q] !== undefined) return;
    setAnswers({ ...answers, [q]: c });
  };
  const reset = () => setAnswers({});
  const score = questions.filter((q, i) => q.choices[answers[i]]?.correct).length;
  const done = Object.keys(answers).length === questions.length;

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span className="quiz-label">Check yourself</span>
        {done && <span className="quiz-score">{score} / {questions.length}</span>}
      </div>
      {questions.map((q, qi) => {
        const picked = answers[qi];
        return (
          <fieldset key={qi} className="quiz-q">
            <legend>{q.prompt}</legend>
            {q.choices.map((c, ci) => {
              const state = picked === undefined ? "idle" : ci === picked ? (c.correct ? "correct" : "wrong") : c.correct && picked !== undefined ? "reveal" : "idle";
              return (
                <button key={ci} type="button" data-state={state} disabled={picked !== undefined} onClick={() => choose(qi, ci)}>
                  {c.text}
                </button>
              );
            })}
            {picked !== undefined && <p className="quiz-explain">{q.choices[picked].explain}</p>}
          </fieldset>
        );
      })}
      {Object.keys(answers).length > 0 && (
        <button type="button" className="quiz-reset" onClick={reset}>
          Reset
        </button>
      )}
      <style>{`
        .quiz { border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.2rem; margin: 1.5rem 0; background: var(--bg-raised); }
        .quiz-head { display: flex; justify-content: space-between; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.5rem; }
        .quiz-q { border: 0; padding: 0; margin: 0 0 1rem; }
        .quiz-q legend { font-weight: 600; margin-bottom: 0.5rem; padding: 0; }
        .quiz-q button { display: block; width: 100%; text-align: left; margin: 0.3rem 0; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; cursor: pointer; }
        .quiz-q button:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-q button:disabled { cursor: default; }
        .quiz-q button[data-state="correct"] { background: var(--good); color: var(--bg); border-color: var(--good); }
        .quiz-q button[data-state="wrong"] { background: var(--bad); color: var(--bg); border-color: var(--bad); }
        .quiz-q button[data-state="reveal"] { border-color: var(--good); }
        .quiz-explain { margin: 0.5rem 0 0; color: var(--text-muted); }
        .quiz-reset { font: inherit; font-size: 0.85rem; background: none; border: 0; color: var(--link); cursor: pointer; padding: 0; }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `cd web && npm test -- Quiz`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Quiz.tsx web/src/components/Quiz.test.tsx
git commit -m "feat(web): stateless Quiz island with browser-local answers"
```

---

### Task 8: Port the D3 visual system

**Files:**
- Create: `web/src/lib/viz/theme.ts`
- Create: `web/src/lib/viz/flow.ts` (from `docs/javascripts/visuals/flow-diagram.js`)
- Create: `web/src/lib/viz/funnel.ts` (from `docs/javascripts/visuals/quality-funnel.js`)
- Create: `web/src/lib/viz/graph.ts` (from `docs/javascripts/visuals/graph-diagram.js`)
- Create: `web/src/lib/viz/index.ts`
- Create: `web/src/components/Visual.astro`
- Test: `web/src/lib/viz/flow.test.ts`, `web/src/lib/viz/graph.test.ts`

The old renderers read config from a `<template>` and style from `window.VIZ`; both were workarounds for MkDocs. The port turns each IIFE into an exported function taking `(container, spec, options)`, with the theme passed in, D3 imported, and no DOM discovery.

- [ ] **Step 1: Write theme.ts**

```ts
import type { Selection } from "d3";

export interface VizColors {
  bg: string; fill: string; border: string; text: string; sub: string; line: string;
  chipBorder: string; good: string; defect: string; defectText: string; accent: string;
}

export interface VizTheme {
  colors: VizColors;
  space: { gap: number; spacing: number; margin: number };
  fonts: { label: string; sub: string; chip: string };
  /** Append a shared arrowhead marker and return its url(#id). */
  arrow(svg: Selection<SVGSVGElement, unknown, null, undefined>, id: string, color: string): string;
  /** Text width in px for the given CSS font. */
  measure(text: string, font: string): number;
}

const FONTS = {
  label: '600 14px "IBM Plex Sans", sans-serif',
  sub: '11.5px "IBM Plex Sans", sans-serif',
  chip: '12px "IBM Plex Sans", sans-serif',
};

/** Read the viz tokens from CSS custom properties on <html>, so light/dark and any palette change apply. */
export function readTheme(root: HTMLElement = document.documentElement): VizTheme {
  const css = getComputedStyle(root);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  return {
    colors: {
      bg: v("--viz-bg", "#ffffff"),
      fill: v("--viz-fill", "#ffffff"),
      border: v("--viz-border", "#1a1a1e"),
      text: v("--viz-text", "#1a1a1e"),
      sub: v("--viz-sub", "#5c5c66"),
      line: v("--viz-line", "#1a1a1e"),
      chipBorder: v("--viz-connector", "#8e8e98"),
      good: v("--viz-good", "#15803d"),
      defect: v("--viz-defect", "#e0857c"),
      defectText: v("--viz-defect-text", "#1a1a1e"),
      accent: v("--viz-accent", "#7c3aed"),
    },
    space: { gap: 12, spacing: 46, margin: 16 },
    fonts: FONTS,
    arrow(svg, id, color) {
      let defs = svg.select<SVGDefsElement>("defs");
      if (defs.empty()) defs = svg.append("defs");
      defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5)
        .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", color);
      return `url(#${id})`;
    },
    measure(text, font) {
      if (!ctx) return text.length * 8; // jsdom has no canvas; a rough width keeps layout deterministic in tests
      ctx.font = font;
      return ctx.measureText(text).width;
    },
  };
}
```

- [ ] **Step 2: Write the failing flow test**

`web/src/lib/viz/flow.test.ts`:

```ts
// @vitest-environment jsdom
import { renderFlow } from "./flow";
import { readTheme } from "./theme";

describe("renderFlow", () => {
  const spec = {
    nodes: [{ id: "a", label: "Define the check" }, { id: "b", label: "Agent acts", sub: "one step" }, { id: "c", label: "Run the check" }],
    links: [{ source: "a", target: "b" }, { source: "b", target: "c", dir: "both" as const }],
  };

  it("draws one rect per node and one line per link", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelectorAll("rect").length).toBe(3);
    expect(el.querySelectorAll("line").length).toBe(2);
    expect(el.querySelector("line[marker-start]")).toBeTruthy();
  });

  it("is idempotent: re-rendering replaces the svg", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd web && npm test -- viz/flow`
Expected: FAIL, cannot resolve "./flow".

- [ ] **Step 4: Write flow.ts**

This is the full port of `flow-diagram.js`; the layout and drawing code are unchanged apart from the wrapper.

```ts
import * as d3 from "d3";
import type { VizTheme } from "./theme";

export interface FlowNode { id: string; label: string; sub?: string }
export interface FlowLink { source: string; target: string; dir?: "both" }
export interface FlowSpec { nodes: FlowNode[]; links: FlowLink[] }
export interface FlowOptions { orientation?: "LR" | "TD"; theme: VizTheme }

interface Sized extends FlowNode { w: number; h: number; pill: boolean; x: number; y: number }

/** Linear pill/rounded-rect flow. Single-line nodes are pills; nodes with a subtitle are rounded rectangles. */
export function renderFlow(container: HTMLElement, spec: FlowSpec, { orientation = "LR", theme }: FlowOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());
  const horizontal = orientation === "LR";
  const COL = theme.colors;
  const { gap: GAP, spacing: SPACING, margin: MARGIN } = theme.space;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const PAD_X = 14;

  const nodes: Sized[] = spec.nodes.map((n) => {
    const w = Math.max(96, Math.max(theme.measure(n.label, FONT), n.sub ? theme.measure(n.sub, SUBFONT) : 0) + PAD_X * 2);
    return { ...n, w, h: n.sub ? 62 : 44, pill: !n.sub, x: 0, y: 0 };
  });
  const maxW = Math.max(...nodes.map((n) => n.w));
  const maxH = Math.max(...nodes.map((n) => n.h));

  let cursor = 0;
  nodes.forEach((n) => {
    if (horizontal) { n.x = cursor; n.y = (maxH - n.h) / 2; cursor += n.w + SPACING; }
    else { n.x = (maxW - n.w) / 2; n.y = cursor; cursor += n.h + SPACING; }
  });
  const totalW = horizontal ? cursor - SPACING : maxW;
  const totalH = horizontal ? maxH : cursor - SPACING;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `${-MARGIN} ${-MARGIN} ${totalW + 2 * MARGIN} ${totalH + 2 * MARGIN}`)
    .attr("width", totalW + 2 * MARGIN).attr("height", totalH + 2 * MARGIN)
    .style("display", "inline-block");
  const ARROW = theme.arrow(svg, `flow-arrow-${Math.random().toString(36).slice(2, 8)}`, COL.line);

  const links = svg.append("g").selectAll("line").data(spec.links).join("line")
    .each(function (l) {
      const s = byId[l.source], t = byId[l.target];
      const [x1, y1, x2, y2] = horizontal
        ? [s.x + s.w + GAP, s.y + s.h / 2, t.x - GAP, t.y + t.h / 2]
        : [s.x + s.w / 2, s.y + s.h + GAP, t.x + t.w / 2, t.y - GAP];
      d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
    })
    .attr("stroke", COL.line).attr("stroke-width", 1.4).attr("marker-end", ARROW)
    .attr("marker-start", (l) => (l.dir === "both" ? ARROW : null));

  const g = svg.append("g").selectAll("g").data(nodes).join("g").attr("transform", (d) => `translate(${d.x},${d.y})`);
  g.append("rect").attr("width", (d) => d.w).attr("height", (d) => d.h)
    .attr("rx", (d) => (d.pill ? d.h / 2 : 10)).attr("ry", (d) => (d.pill ? d.h / 2 : 10))
    .attr("fill", COL.fill).attr("stroke", COL.border).attr("stroke-width", 1);
  g.append("text").attr("x", (d) => d.w / 2).attr("y", (d) => (d.sub ? d.h / 2 - 7 : d.h / 2))
    .attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("fill", COL.text).style("font", FONT).text((d) => d.label);
  g.filter((d) => Boolean(d.sub)).append("text").attr("x", (d) => d.w / 2).attr("y", (d) => d.h / 2 + 12)
    .attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("fill", COL.sub).style("font", SUBFONT).text((d) => d.sub ?? "");

  const adj: Record<string, Set<string>> = {};
  spec.links.forEach((l) => {
    (adj[l.source] ??= new Set()).add(l.target);
    (adj[l.target] ??= new Set()).add(l.source);
  });
  g.style("cursor", "pointer")
    .on("pointerenter", function (_ev, d) {
      const near = (id: string) => id === d.id || adj[d.id]?.has(id);
      g.style("opacity", (n) => (near(n.id) ? 1 : 0.3));
      d3.select(this).select("rect").attr("stroke", COL.accent).attr("stroke-width", 2);
      links.attr("stroke", (l) => (l.source === d.id || l.target === d.id ? COL.accent : COL.line))
        .attr("opacity", (l) => (l.source === d.id || l.target === d.id ? 1 : 0.25));
    })
    .on("pointerleave", function () {
      g.style("opacity", 1);
      g.select("rect").attr("stroke", COL.border).attr("stroke-width", 1);
      links.attr("stroke", COL.line).attr("opacity", 1);
    });
}
```

- [ ] **Step 5: Run the flow tests**

Run: `cd web && npm test -- viz/flow`
Expected: PASS, 2 tests.

- [ ] **Step 6: Port funnel.ts**

Copy `docs/javascripts/visuals/quality-funnel.js` to `web/src/lib/viz/funnel.ts` and make exactly these changes:

1. Replace the header comment and the opening `(function () { function render(container) { ... spec parsing ... }` with:

```ts
import * as d3 from "d3";
import type { VizTheme } from "./theme";

export interface FunnelSpec {
  entry?: { label?: string; defects?: string[] };
  layers: { label: string; catches: string }[];
  exit?: { label?: string };
}
export interface FunnelOptions { theme: VizTheme }

/** Defence-in-depth funnel: code enters wide, each layer sheds the defect class it catches. */
export function renderFunnel(container: HTMLElement, spec: FunnelSpec, { theme }: FunnelOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());
```

2. Replace the block that reads `window.VIZ` with:

```ts
  const COL = theme.colors;
  const GAP = theme.space.gap;
  const M = theme.space.margin;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const CHIPFONT = theme.fonts.chip;
```

3. Delete the `ctx`/`measure` canvas helper and replace every `measure(` call with `theme.measure(`.
4. Replace `window.VIZ.arrow(svg, "funnel-arrow", COL.border)` with `theme.arrow(svg, \`funnel-arrow-${Math.random().toString(36).slice(2, 8)}\`, COL.border)`.
5. Delete everything from `function renderAll()` to the end of the file, and the closing `})();`. The function now ends with the `bands.style(...)` / `chips.style(...)` lines followed by `}`.
6. Add types where TypeScript complains: `(d: any)` on the `focus(i: number)` callbacks is acceptable here; do not spend time typing D3 selections beyond what `astro check` requires.

Run: `cd web && npm run check`
Expected: 0 errors in `funnel.ts`.

- [ ] **Step 7: Write the failing graph test**

`web/src/lib/viz/graph.test.ts`:

```ts
// @vitest-environment jsdom
import { renderGraph } from "./graph";
import { readTheme } from "./theme";

describe("renderGraph", () => {
  it("lays out a loop with a decision node and edge labels", () => {
    const el = document.createElement("div");
    renderGraph(
      el,
      {
        nodes: [
          { id: "check", label: "Write the check" },
          { id: "act", label: "Agent acts" },
          { id: "run", label: "Run the check" },
          { id: "pass", label: "Passes?", kind: "decision" },
          { id: "done", label: "Done" },
        ],
        links: [
          { source: "check", target: "act" },
          { source: "act", target: "run" },
          { source: "run", target: "pass" },
          { source: "pass", target: "done", label: "yes" },
          { source: "pass", target: "act", label: "no" },
        ],
      },
      { orientation: "LR", theme: readTheme() }
    );
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelectorAll(".node").length).toBe(5);
    expect(el.querySelectorAll(".edge").length).toBe(5);
    expect(Array.from(el.querySelectorAll("text")).some((t) => t.textContent === "no")).toBe(true);
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `cd web && npm test -- viz/graph`
Expected: FAIL, cannot resolve "./graph".

- [ ] **Step 9: Port graph.ts**

Copy `docs/javascripts/visuals/graph-diagram.js` to `web/src/lib/viz/graph.ts` and make exactly these changes:

1. Replace the header comment and `(function () { function render(container) { ... spec parsing ... }` with:

```ts
import * as d3 from "d3";
import * as dagre from "@dagrejs/dagre";
import type { VizTheme } from "./theme";

export interface GraphNode { id: string; label: string; sub?: string; kind?: "decision" }
export interface GraphLink { source: string; target: string; label?: string; dir?: "both" }
export interface GraphSpec { nodes: GraphNode[]; links: GraphLink[] }
export interface GraphOptions { orientation?: "LR" | "TD"; theme: VizTheme }

/** Branching/looping flow: dagre for layout, our primitives for drawing. */
export function renderGraph(container: HTMLElement, spec: GraphSpec, { orientation = "LR", theme }: GraphOptions): void {
  container.querySelectorAll("svg").forEach((s) => s.remove());
```

2. Replace the block that reads `window.VIZ` with:

```ts
  const COL = theme.colors;
  const GAP = theme.space.gap;
  const M = theme.space.margin;
  const FONT = theme.fonts.label;
  const SUBFONT = theme.fonts.sub;
  const EDGEFONT = theme.fonts.sub;
  const PAD_X = 14;
```
3. Replace `const rankdir = (container.dataset.orientation || "LR").toUpperCase() === "TD" ? "TB" : "LR";` with `const rankdir = orientation === "TD" ? "TB" : "LR";`.
4. Delete the canvas `measure` helper; replace `measure(` with `theme.measure(`.
5. Replace `window.VIZ.arrow(svg, "graph-arrow", ...)` with `theme.arrow(svg, \`graph-arrow-${Math.random().toString(36).slice(2, 8)}\`, ...)`.
6. Ensure each node `<g>` gets `.attr("class", "node")` and each edge element (path or line, whichever the original draws) gets `.attr("class", "edge")`; add those two attrs if the original lacks them (the test relies on them).
7. Delete `renderAll` and the `document$` subscription and the closing `})();`.
8. `new dagre.graphlib.Graph()` and `dagre.layout(g)` are unchanged; the npm package at 1.1.8 exposes the same API as the CDN build the site used.

Run: `cd web && npm test -- viz/graph && npm run check`
Expected: PASS, 1 test; check reports 0 errors. If `@dagrejs/dagre` has no bundled types, add `web/src/types/dagre.d.ts` containing `declare module "@dagrejs/dagre";`.

- [ ] **Step 10: Write index.ts (mounting, theme redraw, scroll reveal)**

```ts
import { readTheme } from "./theme";
import { renderFlow, type FlowSpec } from "./flow";
import { renderFunnel, type FunnelSpec } from "./funnel";
import { renderGraph, type GraphSpec } from "./graph";

type Kind = "flow" | "funnel" | "graph";

function draw(fig: HTMLElement): void {
  const canvas = fig.querySelector<HTMLElement>(".visual-canvas");
  const raw = fig.dataset.spec;
  if (!canvas || !raw) return;
  let spec: unknown;
  try { spec = JSON.parse(raw); } catch { return; }
  const kind = fig.dataset.visual as Kind;
  const orientation = (fig.dataset.orientation as "LR" | "TD") ?? "LR";
  const theme = readTheme();
  if (kind === "flow") renderFlow(canvas, spec as FlowSpec, { orientation, theme });
  else if (kind === "funnel") renderFunnel(canvas, spec as FunnelSpec, { theme });
  else if (kind === "graph") renderGraph(canvas, spec as GraphSpec, { orientation, theme });
}

let mounted = false;

/** Render every <figure data-visual> on the page; redraw on theme change; reveal on scroll. Safe to call more than once. */
export function mountVisuals(): void {
  if (mounted) return;
  mounted = true;
  const figures = Array.from(document.querySelectorAll<HTMLElement>("figure[data-visual]"));
  figures.forEach(draw);

  const redraw = () => figures.forEach(draw);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    figures.forEach((f) => io.observe(f));
  } else {
    figures.forEach((f) => f.classList.add("is-visible"));
  }
}
```

- [ ] **Step 11: Write Visual.astro**

```astro
---
interface Props {
  kind: "flow" | "funnel" | "graph";
  spec: unknown;
  orientation?: "LR" | "TD";
  caption?: string;
}
const { kind, spec, orientation = "LR", caption } = Astro.props;
---
<figure class="visual" data-visual={kind} data-orientation={orientation} data-spec={JSON.stringify(spec)}>
  <div class="visual-canvas"></div>
  {caption && <figcaption>{caption}</figcaption>}
</figure>

<style>
  .visual { margin: 1.5rem 0; text-align: center; opacity: 0; transform: translateY(8px); transition: opacity 0.5s ease, transform 0.5s ease; }
  .visual.is-visible { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .visual { opacity: 1; transform: none; transition: none; } }
  .visual-canvas { overflow-x: auto; }
  figcaption { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; }
</style>

<script>
  import { mountVisuals } from "../lib/viz";
  mountVisuals();
</script>
```

- [ ] **Step 12: Run everything and commit**

Run: `cd web && npm test && npm run check`
Expected: all tests pass; 0 type errors.

```bash
git add web/src/lib/viz web/src/components/Visual.astro web/src/types 2>/dev/null; git add web/src/lib/viz web/src/components/Visual.astro
git commit -m "feat(web): port D3 visual system as theme-aware renderers with a Visual component"
```

---

### Task 9: Book layout and pages

**Files:**
- Create: `web/src/lib/site.ts`
- Create: `web/src/layouts/Book.astro`
- Modify: `web/src/pages/index.astro`
- Create: `web/src/pages/[book]/index.astro`
- Create: `web/src/pages/[book]/[chapter]/index.astro`
- Create: `web/src/pages/sources.astro`, `web/src/pages/about.astro`

- [ ] **Step 1: Write site.ts (the one place that queries collections)**

```ts
import { getCollection, type CollectionEntry } from "astro:content";
import { bookSlugFromId, parseChapterId, sortChapters } from "./chapters";

export type Book = CollectionEntry<"books"> & { slug: string };
/** A chapter entry plus its routing parts. `entry` is the untouched collection entry: pass that to render(), never the spread copy. */
export type Chapter = CollectionEntry<"chapters"> & { entry: CollectionEntry<"chapters">; book: string; slug: string };

export async function getBooks(): Promise<Book[]> {
  const books = await getCollection("books");
  return books.map((b) => ({ ...b, slug: bookSlugFromId(b.id) })).sort((a, b) => a.data.order - b.data.order);
}

/** Published chapters only; drafts and chapters in review are neither built nor listed. */
export async function getPublishedChapters(book?: string): Promise<Chapter[]> {
  const all = await getCollection("chapters", (c) => c.data.status === "published");
  const withRefs: Chapter[] = all.map((c) => ({ ...c, entry: c, ...parseChapterId(c.id) }));
  return sortChapters(book ? withRefs.filter((c) => c.book === book) : withRefs);
}

export async function getBook(slug: string): Promise<Book | undefined> {
  return (await getBooks()).find((b) => b.slug === slug);
}
```

- [ ] **Step 2: Write Book.astro**

```astro
---
import Base from "./Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import { BASE, bookPath, chapterPath, deckPath } from "../lib/paths";
import { getBooks, type Book, type Chapter } from "../lib/site";
import { neighbours } from "../lib/chapters";

interface Props {
  book: Book;
  chapters: Chapter[];          // published chapters of this book, sorted
  current?: Chapter;            // undefined on the book TOC page
  headings?: { depth: number; slug: string; text: string }[];
}
const { book, chapters, current, headings = [] } = Astro.props;
const books = await getBooks();
const nav = current ? neighbours(chapters, current.id) : { prev: undefined, next: undefined };
const parts = book.data.parts.length ? book.data.parts : [{ key: "", title: "" }];
const chaptersIn = (key: string) => chapters.filter((c) => (c.data.part ?? "") === key);
const h2s = headings.filter((h) => h.depth === 2);
---
<Base title={current ? current.data.title : book.data.title} description={current?.data.summary} render="book">
  <header class="bar">
    <a class="brand" href={BASE}>Agentic Coding Playbook</a>
    <nav class="switch" aria-label="Books">
      {books.map((b) => (
        <a href={bookPath(BASE, b.slug)} aria-current={b.slug === book.slug ? "true" : undefined} title={b.data.title}>{b.data.order}</a>
      ))}
      <span class="switch-title">{book.data.title}</span>
    </nav>
    <div id="search" class="search"></div>
    <ThemeToggle />
  </header>
  <div class="shell">
    <nav class="sidebar" aria-label="Book contents">
      {parts.map((p) => (
        <div class="part">
          {p.title && <div class="part-title">{p.key} · {p.title}</div>}
          <ol>
            {chaptersIn(p.key).map((c) => (
              <li aria-current={current?.id === c.id ? "page" : undefined}>
                <a href={chapterPath(BASE, book.slug, c.slug)}>{c.data.order}. {c.data.title}</a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
    <main class="main prose" data-pagefind-body={current ? "" : undefined}>
      <slot />
      {current && (
        <footer class="chapter-nav">
          <span>{nav.prev ? <a href={chapterPath(BASE, book.slug, nav.prev.slug)}>← {nav.prev.data.title}</a> : <a href={bookPath(BASE, book.slug)}>← Book contents</a>}</span>
          <span>{nav.next && <a href={chapterPath(BASE, book.slug, nav.next.slug)}>{nav.next.data.title} →</a>}</span>
        </footer>
      )}
    </main>
    {current && (
      <aside class="toc" aria-label="On this page">
        <div class="toc-title">On this page</div>
        <ul>{h2s.map((h) => <li><a href={`#${h.slug}`}>{h.text}</a></li>)}</ul>
        <a class="deck-link" href={deckPath(BASE, book.slug, current.slug)}>Open as deck →</a>
      </aside>
    )}
  </div>
</Base>

<style>
  .bar { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 1.25rem; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 2; }
  .brand { font-weight: 600; color: var(--text); text-decoration: none; }
  .switch { flex: 1; display: flex; align-items: center; gap: 0.3rem; font-size: 0.9rem; color: var(--text-muted); }
  .switch a { display: inline-flex; width: 1.6rem; height: 1.6rem; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border); color: var(--text-muted); text-decoration: none; font-size: 0.8rem; }
  .switch a[aria-current] { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .switch-title { margin-left: 0.5rem; }
  .search { min-width: 14rem; }
  .shell { display: grid; grid-template-columns: 16rem minmax(0, 1fr) 14rem; gap: 2.5rem; padding: 1.5rem 1.25rem; max-width: 80rem; margin: 0 auto; }
  .sidebar, .toc { font-size: 0.88rem; position: sticky; top: 4rem; align-self: start; max-height: calc(100vh - 5rem); overflow-y: auto; }
  .part-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); margin: 1rem 0 0.3rem; }
  .sidebar ol, .toc ul { list-style: none; margin: 0; padding: 0; }
  .sidebar li a, .toc li a { display: block; padding: 0.25rem 0; color: var(--text-muted); text-decoration: none; }
  .sidebar li[aria-current] a { color: var(--accent); font-weight: 600; }
  .sidebar li a:hover, .toc li a:hover { color: var(--text); }
  .toc-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 0.3rem; }
  .deck-link { display: inline-block; margin-top: 1rem; }
  .chapter-nav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  @media (max-width: 1000px) { .shell { grid-template-columns: 1fr; } .sidebar, .toc { position: static; max-height: none; } }
</style>
```

The `#search` element and `data-pagefind-body` are wired up in Task 13; until then the search box is an empty div.

- [ ] **Step 3: Write the series index**

Replace `web/src/pages/index.astro`:

```astro
---
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import { BASE, bookPath, withBase } from "../lib/paths";
import { getBooks, getPublishedChapters } from "../lib/site";

const books = await getBooks();
const chapters = await getPublishedChapters();
const count = (slug: string) => chapters.filter((c) => c.book === slug).length;
---
<Base title="Series" render="book">
  <header class="bar"><span class="brand">Agentic Coding Playbook</span><ThemeToggle /></header>
  <main class="wrap prose">
    <h1>Agentic coding, in four short books</h1>
    <p class="muted">Each book answers one question. Read them in order or start where your question is.</p>
    <ol class="books">
      {books.map((b) => (
        <li>
          <a href={bookPath(BASE, b.slug)}>
            <span class="num">Book {b.data.order}</span>
            <span class="title">{b.data.title}</span>
            <span class="who">{b.data.audience}</span>
            <span class="count">{count(b.slug) === 0 ? "In preparation" : `${count(b.slug)} chapter${count(b.slug) === 1 ? "" : "s"}`}{b.data.gated ? " · planned" : ""}</span>
          </a>
        </li>
      ))}
    </ol>
    <p><a href={withBase(BASE, "sources")}>Sources</a> · <a href={withBase(BASE, "about")}>About Syv.ai</a></p>
  </main>
</Base>

<style>
  .bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.25rem; border-bottom: 1px solid var(--border); }
  .brand { font-weight: 600; }
  .wrap { max-width: 44rem; margin: 0 auto; padding: 2rem 1.25rem; }
  .books { list-style: none; padding: 0; margin: 2rem 0; display: grid; gap: 0.75rem; }
  .books a { display: grid; grid-template-columns: 5rem 1fr; gap: 0.2rem 1rem; padding: 1rem 1.2rem; border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: var(--text); }
  .books a:hover { border-color: var(--accent); }
  .num { grid-row: span 3; color: var(--text-faint); font-size: 0.8rem; }
  .title { font-weight: 600; font-size: 1.1rem; }
  .who, .count { color: var(--text-muted); font-size: 0.9rem; }
</style>
```

- [ ] **Step 4: Write the book TOC page**

`web/src/pages/[book]/index.astro`:

```astro
---
import Book from "../../layouts/Book.astro";
import { BASE, chapterPath } from "../../lib/paths";
import { getBooks, getPublishedChapters } from "../../lib/site";

export async function getStaticPaths() {
  const books = await getBooks();
  return books.map((book) => ({ params: { book: book.slug }, props: { book } }));
}
const { book } = Astro.props;
const chapters = await getPublishedChapters(book.slug);
---
<Book book={book} chapters={chapters}>
  <p class="faint">Book {book.data.order}</p>
  <h1>{book.data.title}</h1>
  <p class="muted">{book.data.audience}</p>
  {chapters.length === 0 ? (
    <p>This book is in preparation.</p>
  ) : (
    <ol class="chapters">
      {chapters.map((c) => (
        <li>
          <a href={chapterPath(BASE, book.slug, c.slug)}>{c.data.title}</a>
          <span class="muted"> — {c.data.summary}</span>
        </li>
      ))}
    </ol>
  )}
</Book>
```

- [ ] **Step 5: Write the chapter page**

`web/src/pages/[book]/[chapter]/index.astro`:

```astro
---
import { render } from "astro:content";
import Book from "../../../layouts/Book.astro";
import { getBook, getPublishedChapters } from "../../../lib/site";

export async function getStaticPaths() {
  const chapters = await getPublishedChapters();
  return chapters.map((chapter) => ({ params: { book: chapter.book, chapter: chapter.slug }, props: { chapter } }));
}
const { chapter } = Astro.props;
const book = (await getBook(chapter.book))!;
const chapters = await getPublishedChapters(book.slug);
const { Content, headings } = await render(chapter.entry);
---
<Book book={book} chapters={chapters} current={chapter} headings={headings}>
  <p class="faint">{chapter.data.part ? `Part ${chapter.data.part} · ` : ""}Chapter {chapter.data.order}</p>
  <h1>{chapter.data.title}</h1>
  <p class="summary">{chapter.data.summary}</p>
  <Content />
</Book>

<style>
  .summary { font-size: 1.15rem; color: var(--text-muted); margin-bottom: 2rem; }
</style>
```

- [ ] **Step 6: Write sources.astro and about.astro**

`web/src/pages/sources.astro`:

```astro
---
import { getEntry, render } from "astro:content";
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import { BASE } from "../lib/paths";
const entry = (await getEntry("pages", "sources"))!;
const { Content } = await render(entry);
---
<Base title={entry.data.title} render="book">
  <header class="bar"><a href={BASE}>Agentic Coding Playbook</a><ThemeToggle /></header>
  <main class="wrap prose"><h1>{entry.data.title}</h1><Content /></main>
</Base>
<style>
  .bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.25rem; border-bottom: 1px solid var(--border); }
  .bar a { color: var(--text); text-decoration: none; font-weight: 600; }
  .wrap { max-width: 44rem; margin: 0 auto; padding: 2rem 1.25rem; }
</style>
```

`web/src/pages/about.astro`:

```astro
---
import { getEntry, render } from "astro:content";
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import { BASE } from "../lib/paths";
const entry = (await getEntry("pages", "about"))!;
const { Content } = await render(entry);
---
<Base title={entry.data.title} render="book">
  <header class="bar"><a href={BASE}>Agentic Coding Playbook</a><ThemeToggle /></header>
  <main class="wrap prose"><h1>{entry.data.title}</h1><Content /></main>
</Base>
<style>
  .bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.25rem; border-bottom: 1px solid var(--border); }
  .bar a { color: var(--text); text-decoration: none; font-weight: 600; }
  .wrap { max-width: 44rem; margin: 0 auto; padding: 2rem 1.25rem; }
</style>
```

- [ ] **Step 7: Build and check**

Run: `cd web && npm run build && npm run check`
Expected: build completes with `index.html`, four `<book>/index.html` pages, `sources/index.html`, `about/index.html`; no chapter pages yet (none published). 0 type errors.

- [ ] **Step 8: Commit**

```bash
git add web/src
git commit -m "feat(web): book layout, series index, book and chapter pages"
```

---

### Task 10: Deck layout and page

**Files:**
- Create: `web/src/scripts/deck.ts`
- Create: `web/src/layouts/Deck.astro`
- Create: `web/src/pages/[book]/[chapter]/deck.astro`
- Test: `web/src/scripts/deck.test.ts`

The deck script works on the sections the rehype plugin produced plus a title section the layout adds. It is written as a pure `createDeck(root)` so the keyboard logic is testable in jsdom.

- [ ] **Step 1: Write the failing test**

`web/src/scripts/deck.test.ts`:

```ts
// @vitest-environment jsdom
import { createDeck } from "./deck";

function stage(): HTMLElement {
  document.body.innerHTML = `
    <div class="deck" data-book-url="/b/w/c/">
      <section class="slide" data-slide="title"></section>
      <section class="slide" data-slide="why" data-anchor="why"><h2>Why</h2><p>x</p></section>
      <section class="slide" data-slide="book-only"><div data-book-only>hidden</div></section>
      <section class="slide" data-slide="what" data-anchor="what"><h2>What</h2><aside data-notes>n</aside></section>
      <span class="counter"></span>
    </div>`;
  return document.querySelector(".deck")!;
}

describe("createDeck", () => {
  it("skips slides with no visible content and moves with arrow keys", () => {
    const deck = createDeck(stage());
    expect(deck.count).toBe(3);
    expect(deck.index).toBe(0);
    deck.next();
    expect(document.querySelector("[data-active]")?.getAttribute("data-slide")).toBe("why");
    deck.next();
    expect(document.querySelector("[data-active]")?.getAttribute("data-slide")).toBe("what");
    deck.next();
    expect(deck.index).toBe(2);
    deck.prev(); deck.prev(); deck.prev();
    expect(deck.index).toBe(0);
    expect(document.querySelector(".counter")?.textContent).toBe("1 / 3");
  });

  it("toggles notes and reports the book url with the current anchor", () => {
    const root = stage();
    const deck = createDeck(root);
    deck.next();
    deck.toggleNotes();
    expect(root.classList.contains("notes-open")).toBe(true);
    expect(deck.bookUrl()).toBe("/b/w/c/#why");
    deck.prev();
    expect(deck.bookUrl()).toBe("/b/w/c/");
  });

  it("restores position from the hash", () => {
    window.location.hash = "#2";
    const deck = createDeck(stage());
    expect(deck.index).toBe(2);
    window.location.hash = "";
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web && npm test -- deck`
Expected: FAIL, cannot resolve "./deck".

- [ ] **Step 3: Write deck.ts**

```ts
export interface Deck {
  readonly count: number;
  readonly index: number;
  next(): void;
  prev(): void;
  go(i: number): void;
  toggleNotes(): void;
  bookUrl(): string;
}

const VISIBLE = ":scope > :not([data-book-only]):not([data-notes])";

/** Drive a deck: one active section at a time, hash-synced index, notes toggle, Esc target. */
export function createDeck(root: HTMLElement): Deck {
  const all = Array.from(root.querySelectorAll<HTMLElement>("section.slide"));
  const slides = all.filter((s) => s.dataset.slide === "title" || s.querySelector(VISIBLE));
  const counter = root.querySelector<HTMLElement>(".counter");
  let index = 0;

  const show = (i: number) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, j) => (j === index ? s.setAttribute("data-active", "") : s.removeAttribute("data-active")));
    all.filter((s) => !slides.includes(s)).forEach((s) => s.removeAttribute("data-active"));
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    if (typeof history !== "undefined" && history.replaceState) history.replaceState(null, "", `#${index}`);
  };

  const fromHash = parseInt(window.location.hash.replace("#", ""), 10);
  show(Number.isFinite(fromHash) ? fromHash : 0);

  return {
    get count() { return slides.length; },
    get index() { return index; },
    next: () => show(index + 1),
    prev: () => show(index - 1),
    go: show,
    toggleNotes: () => root.classList.toggle("notes-open"),
    bookUrl() {
      const anchor = slides[index]?.dataset.anchor;
      return `${root.dataset.bookUrl ?? "/"}${anchor ? `#${anchor}` : ""}`;
    },
  };
}

/** Wire keyboard and buttons; called from Deck.astro. */
export function mountDeck(root: HTMLElement): Deck {
  const deck = createDeck(root);
  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|BUTTON)$/.test(e.target.tagName)) return;
    switch (e.key) {
      case "ArrowRight": case " ": case "PageDown": e.preventDefault(); deck.next(); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); deck.prev(); break;
      case "n": case "N": deck.toggleNotes(); break;
      case "f": case "F": (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.()); break;
      case "Escape": window.location.href = deck.bookUrl(); break;
    }
  });
  root.querySelector("[data-deck-next]")?.addEventListener("click", () => deck.next());
  root.querySelector("[data-deck-prev]")?.addEventListener("click", () => deck.prev());
  root.querySelector("[data-deck-notes]")?.addEventListener("click", () => deck.toggleNotes());
  return deck;
}
```

- [ ] **Step 4: Run the tests**

Run: `cd web && npm test -- deck`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write Deck.astro**

```astro
---
import Base from "./Base.astro";
import { BASE, chapterPath } from "../lib/paths";
import type { Book, Chapter } from "../lib/site";

interface Props { book: Book; chapter: Chapter }
const { book, chapter } = Astro.props;
const bookUrl = chapterPath(BASE, book.slug, chapter.slug);
---
<Base title={`${chapter.data.title} (deck)`} render="deck">
  <div class="deck" data-book-url={bookUrl}>
    <div class="stage">
      <section class="slide" data-slide="title">
        <p class="kicker">Book {book.data.order} · {book.data.title}</p>
        <h1>{chapter.data.title}</h1>
        <p class="summary">{chapter.data.summary}</p>
      </section>
      <slot />
    </div>
    <div class="hud">
      <span class="meta">Book {book.data.order} · {chapter.data.title}</span>
      <span class="controls">
        <button type="button" data-deck-prev aria-label="Previous slide">←</button>
        <span class="counter"></span>
        <button type="button" data-deck-next aria-label="Next slide">→</button>
        <button type="button" data-deck-notes aria-label="Toggle notes">N</button>
        <a href={bookUrl} aria-label="Back to book">Esc</a>
      </span>
    </div>
  </div>
</Base>

<style is:global>
  html[data-render="deck"] { background: #101014; color: #e8e8ec; }
  html[data-render="deck"] body { min-height: 100vh; }
  .deck { display: flex; flex-direction: column; min-height: 100vh; }
  .stage { flex: 1; display: grid; place-items: center; padding: 2rem; }
  .stage section.slide { display: none; width: min(100%, 64rem); aspect-ratio: 16 / 9; padding: 2.5rem 3rem; font-size: 1.25rem; overflow: auto; }
  .stage section.slide[data-active] { display: block; }
  .stage h1 { font-size: 2.6rem; }
  .stage h2 { font-size: 2rem; margin-top: 0; }
  .kicker { color: #9a9aa6; font-size: 0.9rem; }
  .summary { color: #b8b8c2; }
  .stage [data-notes] { display: none; margin-top: 1.5rem; padding: 1rem; border-top: 1px solid #2a2a33; font-size: 0.95rem; color: #b8b8c2; }
  .deck.notes-open .stage [data-active] [data-notes] { display: block; }
  .hud { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.25rem; font-size: 0.8rem; color: #7a7a86; border-top: 1px solid #2a2a33; }
  .controls { display: flex; gap: 0.5rem; align-items: center; }
  .controls button, .controls a { background: none; border: 1px solid #2a2a33; color: #b8b8c2; border-radius: 6px; padding: 0.2rem 0.5rem; font: inherit; cursor: pointer; text-decoration: none; }
  /* Visual tokens in the deck are always dark, whatever the reader's theme. */
  html[data-render="deck"] { --viz-bg: #101014; --viz-fill: #1c1c24; --viz-border: #ffffff; --viz-text: #ffffff; --viz-sub: #a1a1aa; --viz-line: #ffffff; --viz-connector: #8b8b93; --viz-good: #7ee787; --viz-defect: #e0857c; --viz-defect-text: #0a0a0b; --viz-accent: #c084fc; --bg: #101014; --bg-raised: #1c1c24; --text: #e8e8ec; --text-muted: #b8b8c2; --border: #2a2a33; --accent: #c084fc; --good: #7ee787; --bad: #f87171; --link: #d8b4fe; }
</style>

<script>
  import { mountDeck } from "../scripts/deck";
  const root = document.querySelector<HTMLElement>(".deck");
  if (root) mountDeck(root);
</script>
```

- [ ] **Step 6: Write the deck page**

`web/src/pages/[book]/[chapter]/deck.astro`:

```astro
---
import { render } from "astro:content";
import Deck from "../../../layouts/Deck.astro";
import { getBook, getPublishedChapters } from "../../../lib/site";

export async function getStaticPaths() {
  const chapters = await getPublishedChapters();
  return chapters.map((chapter) => ({ params: { book: chapter.book, chapter: chapter.slug }, props: { chapter } }));
}
const { chapter } = Astro.props;
const book = (await getBook(chapter.book))!;
const { Content } = await render(chapter.entry);
---
<Deck book={book} chapter={chapter}>
  <Content />
</Deck>
```

- [ ] **Step 7: Build, check, commit**

Run: `cd web && npm run build && npm run check`
Expected: build completes; still no chapter or deck pages because nothing is published yet.

```bash
git add web/src
git commit -m "feat(web): deck layout, page and keyboard-driven deck script"
```

---

### Task 11: The pilot chapter

**Files:**
- Create: `web/src/content/books/working-well/_components/VerifiableLoopDemo.tsx`
- Create: `web/src/content/books/working-well/01-measure-success-first.mdx`

Voice: plain, short, declarative, no slogans, no seniority framing. Mold: the title is the perspective; then why it holds; then what it changes; then one pointer to the basics. The Syv anchor is stated at the level the June note approved: the verifiable-loop principle and the model-builder analogy. No client specifics are invented; Task 17 asks the owner whether to add one.

- [ ] **Step 1: Write the demo island**

```tsx
import { useState } from "react";

/**
 * Two loops side by side. Left: the agent iterates with no check and reports "done" each round;
 * defects accumulate unseen and surface at review. Right: the check exists first, so each round
 * either passes or names what failed. Same five rounds, same work; only the target differs.
 */
const ROUNDS = [
  { work: "Adds the endpoint", hidden: "returns 200 on invalid input", check: "fails: rejects invalid input" },
  { work: "Adds validation", hidden: "error body is not JSON", check: "fails: error body is JSON" },
  { work: "Fixes error body", hidden: "pagination off by one", check: "fails: last page has the right count" },
  { work: "Fixes pagination", hidden: "", check: "passes" },
  { work: "Refactors names", hidden: "", check: "passes" },
];

export default function VerifiableLoopDemo() {
  const [n, setN] = useState(0);
  const done = n >= ROUNDS.length;
  const hiddenSoFar = ROUNDS.slice(0, n).filter((r) => r.hidden).length;

  return (
    <div className="vl">
      <div className="vl-cols">
        <div className="vl-col">
          <div className="vl-head">No check</div>
          <ol>
            {ROUNDS.slice(0, n).map((r, i) => (
              <li key={i}>{r.work} <span className="vl-claim">“done”</span></li>
            ))}
          </ol>
          {done && <p className="vl-verdict vl-bad">At review: {ROUNDS.filter((r) => r.hidden).length} defects, all found late.</p>}
        </div>
        <div className="vl-col">
          <div className="vl-head">Check written first</div>
          <ol>
            {ROUNDS.slice(0, n).map((r, i) => (
              <li key={i}>{r.work} <span className={r.check === "passes" ? "vl-good" : "vl-warn"}>{r.check}</span></li>
            ))}
          </ol>
          {done && <p className="vl-verdict vl-good">At review: nothing the check didn't already say.</p>}
        </div>
      </div>
      <div className="vl-controls">
        <button type="button" onClick={() => setN(Math.min(ROUNDS.length, n + 1))} disabled={done}>Run one round</button>
        <button type="button" onClick={() => setN(0)} disabled={n === 0}>Reset</button>
        <span className="vl-status">{done ? "Five rounds run." : n === 0 ? "Same agent, same five rounds of work." : `${hiddenSoFar} defect${hiddenSoFar === 1 ? "" : "s"} hidden on the left so far.`}</span>
      </div>
      <style>{`
        .vl { border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.2rem; margin: 1.5rem 0; background: var(--bg-raised); }
        .vl-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .vl-head { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.4rem; }
        .vl ol { margin: 0; padding-left: 1.2rem; min-height: 8rem; }
        .vl li { margin-bottom: 0.3rem; }
        .vl-claim { color: var(--text-faint); }
        .vl-good { color: var(--good); }
        .vl-warn { color: var(--warn); }
        .vl-bad { color: var(--bad); }
        .vl-verdict { font-weight: 600; margin: 0.5rem 0 0; }
        .vl-controls { display: flex; gap: 0.6rem; align-items: center; margin-top: 1rem; flex-wrap: wrap; }
        .vl-controls button { font: inherit; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); cursor: pointer; }
        .vl-controls button:disabled { opacity: 0.5; cursor: default; }
        .vl-status { font-size: 0.9rem; color: var(--text-muted); }
        @media (max-width: 600px) { .vl-cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Write the chapter**

`web/src/content/books/working-well/01-measure-success-first.mdx`:

````mdx
---
title: Decide how you'll measure success before you build
order: 1
part: A
summary: A loop without a checkable target is an automated way to make errors you find too late.
status: published
sources: []
---
import Quiz from "../../../components/Quiz";
import Visual from "../../../components/Visual.astro";
import Callout from "../../../components/Callout.astro";
import Source from "../../../components/Source.astro";
import Notes from "../../../components/Notes.astro";
import BookOnly from "../../../components/BookOnly.astro";
import VerifiableLoopDemo from "./_components/VerifiableLoopDemo";

An agent working on a task is a loop: look at the state, act, look again. The loop runs until something says stop. If the only thing that says stop is the agent's own judgment that it is done, the loop optimises for *looking* done. If a check says stop, the loop optimises for *being* done. Nothing else about the agent has to change for that difference to show up in every line it writes.

So the first decision on any task is not what to build. It is what will count as built.

<Notes>
Open with the loop drawing, not the claim. Ask the room what stops the loop in their setup today. Most answers are "I read the diff" — which is a check, but a late and expensive one.
</Notes>

## The loop only optimises for what can stop it

<Visual
  kind="graph"
  orientation="LR"
  caption="The loop with a check in it. Remove the check and the only exit is the agent deciding it is finished."
  spec={{
    nodes: [
      { id: "check", label: "Write the check" },
      { id: "act", label: "Agent acts" },
      { id: "run", label: "Run the check" },
      { id: "pass", label: "Passes?", kind: "decision" },
      { id: "done", label: "Done" },
    ],
    links: [
      { source: "check", target: "act" },
      { source: "act", target: "run" },
      { source: "run", target: "pass" },
      { source: "pass", target: "done", label: "yes" },
      { source: "pass", target: "act", label: "no" },
    ],
  }}
/>

A check is anything that can fail on its own, without a person reading: a test, a type error, a lint rule, a script that hits the endpoint and compares the body, a build. What it is not is a description of what good looks like. Descriptions steer the agent's first attempt. Checks steer every attempt after that.

## Why it holds

We train models and we build harnesses for them. From that side of the table the point is not subtle: a model gets better at whatever the loss function measures, and at nothing else. An agent loop is the same shape at a slower speed. Whatever can stop the loop is its loss function. If that is "the agent reports success", the agent gets very good at reporting success.

The June review of our own practice put it this way: write the check before the loop. A loop without a checkable target is just an automated way to make errors you find too late. Late here means at review, or in production, where the cost of a defect is highest and the context that produced it is gone.

Test-driven development said the same thing about people twenty-five years ago, and it was a hard sell then for a reason that no longer applies: writing the check first cost a person real time. With an agent doing the work, the check is the cheapest part of the task and the only part that has to be right.

<Source who="Anthropic" work="Effective harnesses for long-running agents" year={2025} href="https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents" provenance="stated">
<q>The post's argument, paraphrased: long-running agents drift unless the harness gives them an external signal of progress, and the most reliable signal is a test the agent can run itself.</q>
</Source>

<Notes>
The loss-function analogy is the one model-builder point in this chapter. Use it once, do not lean on it. If someone asks for the experiment behind "trained together", that is chapter 8.
</Notes>

## Try it

<VerifiableLoopDemo client:visible />

Both columns do the same five rounds of work. The left column has no check, so every round ends with the agent's claim. The right column has a check written before round one, so every round ends with a fact. The defects on the left were always there. The only thing the check changed is when they became visible.

## What it changes

Before you let the agent loose:

- **Write the failing check first.** A test, a script, a type. If you cannot write one, you do not yet know what done means, and neither will the agent.
- **Make the check runnable by the agent.** A check only a human can run is a review, not a check. Put it in a command the agent can call.
- **Let the check be the stop condition.** Tell the agent to iterate until it passes, and not to report done before it does.
- **Keep the check outside the agent's reach.** If the agent can edit the test, the loop can optimise the test instead of the code. Protect it, or review changes to it before anything else.

What to stop doing:

- Accepting "done" as an outcome. It is a claim.
- Writing the check after the code. It then confirms what you already believe.
- Substituting a description of quality for a check of it. Descriptions help the first attempt; only checks help the tenth.

<Callout kind="tension">
Thinking before you code and checking before you build are the same discipline seen from two sides. The next chapter covers the thinking side: closing the gap between what you meant and what the agent understood, before any code exists.
</Callout>

## Check yourself

<Quiz
  client:visible
  id="working-well-01"
  questions={[
    {
      prompt: "What does an agent loop optimise for?",
      choices: [
        { text: "The task as described in the prompt", explain: "The description steers the first attempt. After that, the loop optimises for whatever can stop it." },
        { text: "Whatever condition stops the loop", correct: true, explain: "If the stop condition is a check, the loop optimises for passing it. If it is the agent's own judgment, the loop optimises for looking done." },
        { text: "The shortest path to a diff", explain: "Agents are not lazy in that sense. They stop when something tells them they are done." },
      ],
    },
    {
      prompt: "Which of these is a check, in the sense used here?",
      choices: [
        { text: "A paragraph in the task brief describing the expected behaviour", explain: "That is a description. It cannot fail on its own." },
        { text: "A script the agent can run that calls the endpoint and compares the response", correct: true, explain: "It fails without a person reading, and the agent can run it every round." },
        { text: "Your own read of the final diff", explain: "That is a review. It matters, but it is late and it does not run inside the loop." },
      ],
    },
    {
      prompt: "The agent can edit the test file. What is the risk?",
      choices: [
        { text: "None; the agent needs to keep tests up to date", explain: "It sometimes does. But if the test is the stop condition, changing it changes the target, and the loop will take the easier target." },
        { text: "The loop can pass by changing the check instead of the code", correct: true, explain: "Protect the check, or review changes to it before anything else." },
        { text: "The test will become slower", explain: "Speed is not the issue. The target is." },
      ],
    },
  ]}
/>

## For the basics

<BookOnly>
If the three layers of verification (the agent's own check, automated gates, human review) are new to you, Book 1 chapter 5 covers them. This chapter assumes them and argues about where the first layer goes: before the work, not after.
</BookOnly>
````

- [ ] **Step 3: Build**

Run: `cd web && npm run build && npm run check`
Expected: `dist/working-well/measure-success-first/index.html` and `dist/working-well/measure-success-first/deck/index.html` exist. 0 type errors.

If the MDX build fails on `import Quiz from "../../../components/Quiz"`, the relative depth is wrong for where Astro copies the file; use `@/components/Quiz` after adding `"paths": { "@/*": ["./src/*"] }` and `"baseUrl": "."` to `tsconfig.json` compilerOptions, and use the same alias for the other five imports.

- [ ] **Step 4: Inspect the built HTML**

Run:

```bash
cd web && grep -c '<section class="slide"' dist/working-well/measure-success-first/index.html && grep -o 'data-slide="[^"]*"' dist/working-well/measure-success-first/deck/index.html
```

Expected: 7 sections in the book page (intro plus six `##`), and the deck page lists `title`, `intro`, `the-loop-only-optimises-for-what-can-stop-it`, `why-it-holds`, `try-it`, `what-it-changes`, `check-yourself`, `for-the-basics`.

- [ ] **Step 5: Commit**

```bash
git add web/src/content/books/working-well
git commit -m "feat(content): pilot chapter, decide how you'll measure success before you build"
```

---

### Task 12: Link check script

**Files:**
- Create: `web/scripts/check-links.mjs`

- [ ] **Step 1: Write the script**

```js
// Post-build internal link check. Walks dist/**/*.html, resolves every href/src that points into the site,
// and fails if the target file does not exist. External links are not fetched.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const DIST = resolve("dist");
const BASE = "/agentic-coding-playbook";

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function targetExists(file, href) {
  let path = href.split("#")[0].split("?")[0];
  if (!path) return true; // same-page anchor
  if (path.startsWith(BASE)) path = path.slice(BASE.length);
  const abs = path.startsWith("/") ? join(DIST, path) : resolve(dirname(file), path);
  if (await exists(abs)) return true;
  return exists(join(abs, "index.html"));
}

const files = await walk(DIST);
const broken = [];
for (const file of files) {
  const html = await readFile(file, "utf8");
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|\/\/)/.test(href)) continue;
    if (!(await targetExists(file, href))) broken.push(`${file.replace(DIST, "dist")} → ${href}`);
  }
}
if (broken.length) {
  console.error(`${broken.length} broken internal link(s):\n` + broken.join("\n"));
  process.exit(1);
}
console.log(`checked ${files.length} pages, no broken internal links`);
```

- [ ] **Step 2: Run it**

Run: `cd web && npm run build && npm run check:links`
Expected: `checked N pages, no broken internal links`. If it reports the font stylesheet or `favicon.svg`, those are bugs in the script's skip rules or in Base.astro's base handling; fix the cause, not the check.

- [ ] **Step 3: Commit**

```bash
git add web/scripts/check-links.mjs
git commit -m "feat(web): post-build internal link check"
```

---

### Task 13: Search with Pagefind

**Files:**
- Modify: `web/package.json` (build script, devDependency)
- Modify: `web/src/layouts/Book.astro` (search UI script)

Pagefind indexes the built `dist/` after `astro build` and ships a static search bundle; nothing runs at request time. Only chapter bodies are indexed, because Task 9 put `data-pagefind-body` on the chapter `<main>` and Pagefind indexes only marked bodies when any page has one.

- [ ] **Step 1: Add Pagefind and run it after the build**

```bash
cd web && npm install --save-dev pagefind@1.5.2
```

In `web/package.json`, change the build script to:

```json
"build": "astro build && pagefind --site dist"
```

- [ ] **Step 2: Add the search UI to Book.astro**

Append to the bottom of `web/src/layouts/Book.astro`:

```astro
<link rel="stylesheet" href={`${BASE}pagefind/pagefind-ui.css`} />
<script is:inline define:vars={{ base: BASE }}>
  // The bundle exists only after `npm run build`; in `astro dev` the script 404s and the box stays empty.
  var s = document.createElement("script");
  s.src = base + "pagefind/pagefind-ui.js";
  s.onload = function () {
    new PagefindUI({ element: "#search", bundlePath: base + "pagefind/", showSubResults: true, showImages: false });
  };
  document.head.appendChild(s);
</script>

<style is:global>
  .search { --pagefind-ui-scale: 0.8; --pagefind-ui-primary: var(--accent); --pagefind-ui-text: var(--text); --pagefind-ui-background: var(--bg); --pagefind-ui-border: var(--border); --pagefind-ui-font: var(--font-sans); }
</style>
```

- [ ] **Step 3: Build and check**

Run: `cd web && npm run build && ls dist/pagefind && npm run check:links`
Expected: `dist/pagefind/` contains `pagefind-ui.js`, `pagefind-ui.css` and the index fragments; Pagefind's log says it indexed 1 page; the link check is still clean.

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/package-lock.json web/src/layouts/Book.astro
git commit -m "feat(web): static search over chapter bodies with Pagefind"
```

---

### Task 14: CI workflow

**Files:**
- Create: `.github/workflows/site.yml`
- Delete: `.github/workflows/docs.yml`

- [ ] **Step 1: Write site.yml**

```yaml
name: Site

on:
  push:
    paths:
      - "web/**"
      - ".github/workflows/site.yml"
  workflow_dispatch:

concurrency:
  group: pages
  cancel-in-progress: false

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
      - run: npm run check:links

  build-pages:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
        with:
          path: web
          node-version: 24

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build-pages
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Remove the MkDocs workflow and commit**

```bash
git rm .github/workflows/docs.yml
git add .github/workflows/site.yml
git commit -m "ci: build and test the Astro site on every branch, deploy from main"
```

- [ ] **Step 3: Push and watch the run**

```bash
git push -u origin book-series
gh run watch --exit-status
```

Expected: the `test` job passes; `build-pages` and `deploy` are skipped on this branch. If `actions/setup-node@v6` does not exist yet, use `@v5`.

---

### Task 15: Retire MkDocs and the slides app; move the modules to legacy

**Files:**
- Delete: `mkdocs.yml`, `requirements-docs.txt`, `slides/`, `docs/javascripts/`, `docs/assets/stylesheets/`
- Move: `docs/00-*.md` … `docs/14-*.md`, `docs/index.md`, `docs/about-syv.md` → `docs/legacy/`
- Create: `docs/legacy/README.md`

- [ ] **Step 1: Move and delete**

```bash
mkdir -p docs/legacy
git mv docs/0*.md docs/1*.md docs/index.md docs/about-syv.md docs/legacy/
git rm -r -q mkdocs.yml requirements-docs.txt slides docs/javascripts docs/assets
```

`docs/assets` should now contain only `stylesheets/`; if `git rm` complains the directory is gone already, that is fine.

- [ ] **Step 2: Write docs/legacy/README.md**

```md
# Legacy modules

The 14-module playbook as it stood before the move to the four-book series
(`docs/specs/2026-09-02-book-series-design.md`). Not built, not published. Kept as
mining material: the spec's module-to-book table says where each module's sharp
parts go. Delete a file here once its book chapters have landed.
```

- [ ] **Step 3: Confirm the About page still has its content**

Task 4 created `web/src/content/pages/about.md` with front matter only. Copy the body of `docs/legacy/about-syv.md` (everything after its first heading) under the front matter now, and check the page:

Run: `cd web && npm run build && grep -c 'Syv' dist/about/index.html`
Expected: a count greater than 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: retire MkDocs and the slides app, move the 14 modules to docs/legacy"
```

---

### Task 16: Documentation updates

**Files:**
- Modify: `CLAUDE.md` (full rewrite)
- Modify: `docs/internal/2026-06-21-perspectives-section-design.md:3`
- Modify: `docs/internal/README.md`
- Modify: `.claude/commands/knowledge.md:12` and `:108`
- Modify: `.claude/skills/add-visual/SKILL.md` (full rewrite)
- Modify: `README.md` (only if it mentions MkDocs or `mkdocs serve`)

- [ ] **Step 1: Rewrite CLAUDE.md**

```md
# Agentic Coding Playbook — agent guide

A four-book series on agentic coding, published as one Astro site with a book view and a deck view per chapter. Design: `docs/specs/2026-09-02-book-series-design.md`. The repo also ships the `syv-skills` Claude Code plugin.

## Repo layout

- `web/` — the site. `src/content/books/<book>/NN-<slug>.mdx` are chapters; `book.yaml` per book; `src/content/pages/` holds Sources and About. Components in `src/components/`, D3 renderers in `src/lib/viz/`. `npm run dev`, `npm test`, `npm run build`, `npm run check:links` from `web/`.
- `docs/specs/` — design specs. `docs/plans/` — implementation plans.
- `docs/internal/` — working notes: knowledge base (`sources.md`, `further-reading.md`), coverage plans, editorial decisions.
- `docs/legacy/` — the retired 14-module playbook, kept as mining material. Not built.
- `skills/`, `agents/`, `.claude-plugin/` — the `syv-skills` plugin. Do not touch when working on the site.
- `.claude/skills/add-visual/` — how to add a D3 visual to a chapter. `.claude/commands/knowledge.md` — the `/knowledge` source-intake command.

## Writing chapters

- One MDX file per chapter; `##` headings are sections in the book and slides in the deck. A `---` inside a section forces a slide break. `<Notes>` are speaker notes (hidden in the book). `<BookOnly>` / `<DeckOnly>` scope content to one rendering.
- Front matter: `title`, `order`, `summary`, `status` (`draft` | `review` | `published`; only published chapters build), optional `part`, optional `sources`.
- Book 2 chapters follow the mold: the title is the perspective; then why it holds (grounded in real Syv work); then what it changes (copyable do's and don'ts); then at most one pointer to Book 1 for the basics.

## Adding or updating sources, citations, or knowledge

**Use the `/knowledge` slash command.** Do not hand-edit `docs/internal/sources.md` or `docs/internal/further-reading.md` unless the user explicitly asks for a manual change. The pipeline is `further-reading.md` → `sources.md` → the Sources page at `web/src/content/pages/sources.md`. Promotion to the Sources page is a manual editorial step.

## Editing principles

- **Tool stance.** Principles are agnostic because tomorrow's harness is unknown; the evidence is honestly Claude-Code-sourced. Label Claude Code specifics as such; do not present another tool's method as portable.
- **Posture.** Craft raises the ceiling; verification makes speed safe. Every Book 2 chapter sits under one half.
- **Authority, stated honestly.** Production at scale and model-builder depth. No fabricated client specifics.
- **Voice.** Plain, short, declarative. Claim-style headers that are the point itself. No slogans, no seniority framing.
- **Visual language.** Custom D3 via the `<Visual>` component, no Mermaid. See `.claude/skills/add-visual/`. No same-hue text on its own fill; colour deltas rather than borders when a fill differs from the background; no dark grey on black.
- **Internal vs published.** Anything a reader should see goes in `web/src/content/`. Working notes go in `docs/internal/`.
```

- [ ] **Step 2: Mark the June note superseded**

Change line 3 of `docs/internal/2026-06-21-perspectives-section-design.md` from

```
**Date:** 2026-06-21 · **Status:** approved in brainstorm, pending spec review · **Owner:** nicolai@syv.ai
```

to

```
**Date:** 2026-06-21 · **Status:** superseded on 2026-09-02 by `docs/specs/2026-09-02-book-series-design.md` (posture, authority framing and the ten perspectives carry over as Book 2) · **Owner:** nicolai@syv.ai
```

- [ ] **Step 3: Fix docs/internal/README.md**

Replace the paragraph starting "The published modules live one level up" with:

```md
The published content lives in `web/src/content/`. The retired 14 modules are in `docs/legacy/`. Design specs are in `docs/specs/` and implementation plans in `docs/plans/`. Anything in this folder is for contributors deciding *what* to write, not readers.
```

Replace the "Current contents" list with:

```md
- [2026-06-21-perspectives-section-design.md](2026-06-21-perspectives-section-design.md) — superseded by the book-series spec; kept for the reasoning.
- [issue-coverage-plan.md](issue-coverage-plan.md) — how the open GitHub issues mapped onto the old 14-module spine. Re-map against the four books when picking issues up.
- [sources.md](sources.md) — working knowledge base. Promote entries to the Sources page (`web/src/content/pages/sources.md`) once they back a landed chapter.
- [further-reading.md](further-reading.md) — backlog of resources flagged but not processed. Promote to `sources.md` once drawn from.
```

- [ ] **Step 4: Update the knowledge command**

In `.claude/commands/knowledge.md`, replace both occurrences of `docs/research-summary.md` with `web/src/content/pages/sources.md` (lines 12 and 108). Keep the surrounding wording.

- [ ] **Step 5: Rewrite the add-visual skill**

`.claude/skills/add-visual/SKILL.md`:

```md
---
name: add-visual
description: How to add or restyle a D3 diagram in a playbook chapter (Astro, web/). Use for any flowchart, diagram, chart, or graphic in a chapter.
---

# add-visual

## What

All diagrams are custom **D3** (no Mermaid), rendered client-side by `web/src/lib/viz/` and placed with the `<Visual>` component:

- `flow` — linear chain of pill/rounded nodes. `orientation` `LR` | `TD`.
- `graph` — branching/looping flows with edge labels and decision diamonds; layout via dagre. Node `kind: "decision"` → diamond; link `label` → edge label; `dir: "both"` → arrowheads at both ends.
- `funnel` — defence-in-depth funnel: entry, layers that each shed a defect class, exit.

Pick `flow` for a chain, `graph` when there are branches, loops, decisions or edge labels. One-offs → inline SVG in the MDX. App-like interactives → a React island in the chapter's `_components/` folder.

## How

In a chapter `.mdx`:

```mdx
import Visual from "../../../components/Visual.astro";

<Visual kind="graph" orientation="LR" caption="One line under the figure."
  spec={{ nodes: [{ id: "a", label: "Title", sub: "optional" }], links: [{ source: "a", target: "b", label: "yes" }] }} />
```

The spec is serialised into `data-spec`; `mountVisuals()` renders every figure on load, redraws when the theme changes, and reveals on scroll.

New renderer: add `web/src/lib/viz/<kind>.ts` exporting `render<Kind>(container, spec, { theme, ... })`, register it in `index.ts`, add the kind to `Visual.astro`'s prop type, and write a jsdom test like `flow.test.ts`. It must:

1. Clear any previous `svg` in the container first (idempotent).
2. Read every colour, font and spacing value from the `VizTheme` passed in (never hardcode).
3. Measure text with `theme.measure`, not a canvas of its own.
4. Render at natural pixel size; the container scrolls horizontally if the diagram is wider than the column.

## Theme

Colours come from CSS custom properties (`--viz-*` in `web/src/styles/global.css`), one set for light and one for dark. The deck forces the dark set. Rules: no same-hue text on its own fill; boundary by colour delta when fill ≠ background, a thin border only when fill = background; no dark grey on black; a visible gap between arrowheads and targets (`theme.space.gap`).

## Verify

`npm test` and `npm run build` in `web/` are clean. Then ask the user to look at the chapter in both the book and deck views and in both themes. Do not headless-screenshot.
```

- [ ] **Step 6: Check README.md**

Run: `grep -n -i 'mkdocs\|slidev\|slides/' README.md`
If it prints anything, replace those lines with the `web/` commands from CLAUDE.md's repo layout section.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md README.md docs/internal .claude
git commit -m "docs: rewrite CLAUDE.md and add-visual for the Astro site, mark the June note superseded"
```

---

### Task 17: Final verification and owner review

**Files:** none new.

- [ ] **Step 1: Full local run**

```bash
cd web && npm ci && npm run check && npm test && npm run build && npm run check:links
```

Expected: 0 type errors; all tests pass (paths 2, storage 3, chapters 5, static 3, rehype-slides 4, Quiz 4, viz 3, deck 3); build completes; link check clean.

- [ ] **Step 2: Start the dev server for the owner**

```bash
cd web && npm run dev
```

Ask the owner to open, in both light and dark:

- `http://localhost:4321/agentic-coding-playbook/` — series index, four books, Book 2 shows 1 chapter.
- `http://localhost:4321/agentic-coding-playbook/working-well/` — book TOC with parts A and B, one chapter listed.
- `http://localhost:4321/agentic-coding-playbook/working-well/measure-success-first/` — chapter: sidebar, on-page TOC, the graph visual animates in and redraws on theme toggle, the demo steps through five rounds, the quiz gives feedback and survives a reload, notes are hidden, prev/next footer, "Open as deck" link.
- `http://localhost:4321/agentic-coding-playbook/working-well/measure-success-first/deck/` — title slide, arrows move, counter counts, `N` shows notes on the slides that have them, `F` goes fullscreen, `Esc` returns to the book at the current section.

Do not headless-screenshot any of this.

- [ ] **Step 3: Ask the owner two content questions**

1. Whether to add a named, shareable production example to the "Why it holds" section. The draft uses only the principle and the model-builder analogy, on purpose.
2. Whether the Source card's paraphrase of the Anthropic harness post is accurate enough to keep, or should be replaced with a direct quote and the chip changed to "Read in full".

Apply the answers, rebuild, and commit:

```bash
git add web/src/content
git commit -m "content: pilot chapter revisions after owner review"
```

- [ ] **Step 4: Push**

```bash
git push
gh run watch --exit-status
```

Expected: the `test` job is green on `book-series`. The site is not deployed until the branch merges to `main` (sub-project 7 in the spec).
