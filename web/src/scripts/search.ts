/** The subset of a Pagefind result (`result.data()`) the dialog reads. */
export interface PagefindData {
  url: string;
  excerpt: string;
  meta: { title?: string; book?: string; [k: string]: string | undefined };
  sub_results: { title: string; url: string; excerpt: string; anchor?: { id: string } }[];
}
export interface PagefindLike {
  search(query: string): Promise<{ results: { data(): Promise<PagefindData> }[] }>;
}
export interface SearchRow { title: string; kicker: string; excerpt: string; href: string }

/** Cmd+K on macOS, Ctrl+K elsewhere; both accepted everywhere. */
export function isSearchHotkey(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k";
}

/** Next selection index, wrapping; -1 when there is nothing to select. */
export function move(index: number, delta: number, length: number): number {
  if (length === 0) return -1;
  if (index < 0) return delta > 0 ? 0 : length - 1;
  return (index + delta + length) % length;
}

/**
 * One row per sub-result (a heading inside a page), capped per page and in total.
 * A hit on the page itself keeps the page title and only the book as its kicker.
 */
export function rowsFrom(pages: PagefindData[], perPage = 3, max = 12): SearchRow[] {
  const rows: SearchRow[] = [];
  for (const page of pages) {
    const title = page.meta.title ?? "";
    const book = page.meta.book ?? "";
    const subs = page.sub_results.length ? page.sub_results : [{ title, url: page.url, excerpt: page.excerpt }];
    for (const sub of subs.slice(0, perPage)) {
      const heading = "anchor" in sub && sub.anchor;
      rows.push({
        title: heading ? sub.title : title,
        kicker: heading ? [book, title].filter(Boolean).join(" · ") : book,
        excerpt: sub.excerpt,
        href: sub.url,
      });
      if (rows.length >= max) return rows;
    }
  }
  return rows;
}

export interface MountOptions {
  trigger: HTMLElement;
  dialog: HTMLDialogElement;
  /** Loads the Pagefind runtime; called once, on first open. */
  load: () => Promise<PagefindLike>;
  navigate?: (href: string) => void;
  isMac?: boolean;
  /** Milliseconds to wait after the last keystroke before searching. */
  wait?: number;
}
export interface Search { open(): void; close(): void; toggle(): void }

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Wire the trigger, the hotkey and the dialog's input, list and status line. */
export function mountSearch({ trigger, dialog, load, navigate = (href) => window.location.assign(href), isMac = /Mac|iPhone|iPad/.test(navigator.platform), wait = 150 }: MountOptions): Search {
  const input = dialog.querySelector<HTMLInputElement>("[data-search-input]")!;
  const list = dialog.querySelector<HTMLElement>("[data-search-results]")!;
  const status = dialog.querySelector<HTMLElement>("[data-search-status]")!;
  const hint = trigger.querySelector<HTMLElement>("[data-search-hint]");
  if (hint) hint.textContent = isMac ? "⌘K" : "Ctrl K";

  let rows: SearchRow[] = [];
  let selected = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;
  let pagefind: Promise<PagefindLike> | undefined;

  const say = (text: string) => { status.textContent = text; status.hidden = !text; };
  const select = (i: number) => {
    selected = i;
    list.querySelectorAll("li").forEach((li, j) => li.setAttribute("aria-selected", String(j === i)));
    const id = list.children[i]?.id;
    if (id) input.setAttribute("aria-activedescendant", id); else input.removeAttribute("aria-activedescendant");
    (list.children[i] as HTMLElement | undefined)?.scrollIntoView?.({ block: "nearest" });
  };
  const render = (next: SearchRow[]) => {
    rows = next;
    list.innerHTML = rows.map((r, i) => `<li id="search-row-${i}" role="option" aria-selected="false"><a href="${escapeHtml(r.href)}"><span class="search-result-title">${escapeHtml(r.title)}</span>${r.kicker ? `<span class="search-result-kicker">${escapeHtml(r.kicker)}</span>` : ""}<span class="search-result-excerpt">${r.excerpt}</span></a></li>`).join("");
    list.querySelectorAll("li").forEach((li, i) => li.addEventListener("mousemove", () => { if (selected !== i) select(i); }));
    select(rows.length ? 0 : -1);
  };
  const clear = () => { render([]); say(""); };

  const run = async (query: string) => {
    const mine = ++seq;
    try {
      const pf = await (pagefind ??= load());
      const res = await pf.search(query);
      const data = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
      if (mine !== seq) return; // a newer query has been typed
      render(rowsFrom(data));
      say(rows.length ? "" : `No results for “${query}”`);
    } catch {
      if (mine !== seq) return;
      render([]);
      say("Search needs the built site: run npm run build, then npm run preview.");
    }
  };

  const open = () => { if (!dialog.open) dialog.showModal(); input.focus(); input.select(); };
  const close = () => { if (dialog.open) dialog.close(); };
  const toggle = () => (dialog.open ? close() : open());

  trigger.addEventListener("click", open);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  document.addEventListener("keydown", (e) => {
    if (isSearchHotkey(e)) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && dialog.open) { e.preventDefault(); close(); }
  });
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { seq++; clear(); return; }
    timer = setTimeout(() => run(q), wait);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); select(move(selected, e.key === "ArrowDown" ? 1 : -1, rows.length)); }
    else if (e.key === "Enter" && rows[selected]) { e.preventDefault(); navigate(rows[selected].href); close(); }
  });

  return { open, close, toggle };
}
