// @vitest-environment jsdom
import { isSearchHotkey, move, mountSearch, rowsFrom, type PagefindData, type PagefindLike } from "./search";

// jsdom has no <dialog> behaviour; the parts mountSearch relies on are open/showModal/close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });

describe("isSearchHotkey", () => {
  it("is Cmd+K or Ctrl+K, either case, without Alt", () => {
    expect(isSearchHotkey(key({ key: "k", metaKey: true }))).toBe(true);
    expect(isSearchHotkey(key({ key: "K", ctrlKey: true }))).toBe(true);
    expect(isSearchHotkey(key({ key: "k" }))).toBe(false);
    expect(isSearchHotkey(key({ key: "k", metaKey: true, altKey: true }))).toBe(false);
    expect(isSearchHotkey(key({ key: "j", metaKey: true }))).toBe(false);
  });
});

describe("move", () => {
  it("wraps both ways and is -1 on an empty list", () => {
    expect(move(0, 1, 3)).toBe(1);
    expect(move(2, 1, 3)).toBe(0);
    expect(move(0, -1, 3)).toBe(2);
    expect(move(-1, 1, 3)).toBe(0);
    expect(move(-1, -1, 3)).toBe(2);
    expect(move(0, 1, 0)).toBe(-1);
  });
});

const page = (title: string, subs: { title: string; anchor?: boolean }[], book?: string): PagefindData => ({
  url: `/b/${title}/`,
  excerpt: `page <mark>x</mark>`,
  meta: book ? { title, book } : { title },
  sub_results: subs.map((s) => ({ title: s.title, url: s.anchor ? `/b/${title}/#${s.title}` : `/b/${title}/`, excerpt: `${s.title} <mark>x</mark>`, anchor: s.anchor ? { id: s.title } : undefined })),
});

describe("rowsFrom", () => {
  it("makes one row per sub-result, with the book and page as the kicker under a heading", () => {
    const rows = rowsFrom([page("Chapter", [{ title: "Chapter" }, { title: "Why", anchor: true }], "Book 2 · Working well")]);
    expect(rows).toEqual([
      { title: "Chapter", kicker: "Book 2 · Working well", excerpt: "Chapter <mark>x</mark>", href: "/b/Chapter/" },
      { title: "Why", kicker: "Book 2 · Working well · Chapter", excerpt: "Why <mark>x</mark>", href: "/b/Chapter/#Why" },
    ]);
  });
  it("has no kicker for a page outside the books, and falls back to the page when there are no sub-results", () => {
    expect(rowsFrom([page("Sources", [{ title: "Sources" }])])[0].kicker).toBe("");
    expect(rowsFrom([{ ...page("About", []), sub_results: [] }])).toEqual([{ title: "About", kicker: "", excerpt: "page <mark>x</mark>", href: "/b/About/" }]);
  });
  it("caps rows per page and in total", () => {
    const subs = Array.from({ length: 6 }, (_, i) => ({ title: `h${i}`, anchor: true }));
    const many = Array.from({ length: 6 }, (_, i) => page(`p${i}`, subs, "Book 1"));
    const rows = rowsFrom(many);
    expect(rows.filter((r) => r.kicker.endsWith("p0"))).toHaveLength(3);
    expect(rows).toHaveLength(12);
  });
});

describe("mountSearch", () => {
  const DATA = page("Chapter", [{ title: "Chapter" }, { title: "Why", anchor: true }], "Book 2 · Working well");
  function setup(load: () => Promise<PagefindLike> = async () => ({ search: async () => ({ results: [{ data: async () => DATA }] }) })) {
    document.body.innerHTML = `
      <button data-search-trigger><kbd data-search-hint>⌘K</kbd></button>
      <dialog data-search-dialog>
        <input data-search-input />
        <ul data-search-results></ul>
        <p data-search-status hidden></p>
      </dialog>`;
    const trigger = document.querySelector<HTMLElement>("[data-search-trigger]")!;
    const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]")!;
    const input = dialog.querySelector<HTMLInputElement>("input")!;
    const navigate = vi.fn();
    const search = mountSearch({ trigger, dialog, load, navigate, isMac: false });
    return { trigger, dialog, input, navigate, search };
  }
  const type = (input: HTMLInputElement, q: string) => { input.value = q; input.dispatchEvent(new Event("input", { bubbles: true })); };
  const rows = () => Array.from(document.querySelectorAll("[data-search-results] li")).map((li) => li.querySelector(".search-result-title")?.textContent);
  const flush = async () => { vi.runAllTimers(); await vi.waitFor(() => expect(rows().length).toBeGreaterThan(0)); };

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

  it("opens from the trigger and the hotkey, closes on Esc and a second hotkey, and labels the hint for the platform", () => {
    const { trigger, dialog } = setup();
    expect(trigger.querySelector("kbd")?.textContent).toBe("Ctrl K");
    trigger.click();
    expect(dialog.open).toBe(true);
    document.dispatchEvent(key({ key: "Escape" }));
    expect(dialog.open).toBe(false);
    document.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(dialog.open).toBe(true);
    document.dispatchEvent(key({ key: "k", metaKey: true }));
    expect(dialog.open).toBe(false);
  });

  it("renders rows for a query, moves the selection with arrows and opens the selected row on Enter", async () => {
    const { trigger, input, navigate } = setup();
    trigger.click();
    type(input, "why");
    await flush();
    expect(rows()).toEqual(["Chapter", "Why"]);
    expect(document.querySelector("li[aria-selected='true'] .search-result-title")?.textContent).toBe("Chapter");
    input.dispatchEvent(key({ key: "ArrowDown" }));
    expect(document.querySelector("li[aria-selected='true'] .search-result-title")?.textContent).toBe("Why");
    input.dispatchEvent(key({ key: "Enter" }));
    expect(navigate).toHaveBeenCalledWith("/b/Chapter/#Why");
  });

  it("clears the list when the query empties and reports no results", async () => {
    const load = async () => ({ search: async (q: string) => ({ results: q === "zzz" ? [] : [{ data: async () => DATA }] }) });
    const { trigger, input } = setup(load);
    trigger.click();
    type(input, "why");
    await flush();
    type(input, "zzz");
    vi.runAllTimers();
    await vi.waitFor(() => expect(rows()).toEqual([]));
    expect(document.querySelector("[data-search-status]")?.textContent).toContain("No results");
    type(input, "");
    vi.runAllTimers();
    expect(rows()).toEqual([]);
    expect((document.querySelector("[data-search-status]") as HTMLElement).hidden).toBe(true);
  });

  it("explains itself when the index cannot load", async () => {
    const { trigger, input } = setup(async () => { throw new Error("404"); });
    trigger.click();
    type(input, "why");
    vi.runAllTimers();
    await vi.waitFor(() => expect(document.querySelector("[data-search-status]")?.textContent).toContain("built site"));
  });
});
