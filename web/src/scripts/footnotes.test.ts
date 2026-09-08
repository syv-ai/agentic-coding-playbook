// @vitest-environment jsdom
import { mountFootnotes } from "./footnotes";

function page() {
  document.body.innerHTML = `
    <main>
      <p>Claim.<sup><a href="#fn-1" id="fnref-1" data-footnote-ref>1</a></sup></p>
      <section data-footnotes><ol><li id="fn-1"><p>The note. <a href="#fnref-1" data-footnote-backref>↩</a></p></li></ol></section>
    </main>`;
  mountFootnotes();
  return document.querySelector<HTMLAnchorElement>("a[data-footnote-ref]")!;
}

describe("mountFootnotes", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

  it("shows the note text without its back link on hover and focus, and hides on leave", () => {
    const ref = page();
    const pop = document.querySelector<HTMLElement>(".fn-pop")!;
    expect(pop.hidden).toBe(true);
    ref.dispatchEvent(new Event("mouseenter"));
    expect(pop.hidden).toBe(false);
    expect(pop.textContent?.trim()).toBe("The note.");
    expect(pop.querySelector("[data-footnote-backref]")).toBeNull();
    ref.dispatchEvent(new Event("mouseleave"));
    vi.runAllTimers();
    expect(pop.hidden).toBe(true);
    ref.dispatchEvent(new Event("focus"));
    expect(pop.hidden).toBe(false);
  });

  it("closes on Escape and stays open while the pointer is over the panel", () => {
    const ref = page();
    const pop = document.querySelector<HTMLElement>(".fn-pop")!;
    ref.dispatchEvent(new Event("mouseenter"));
    ref.dispatchEvent(new Event("mouseleave"));
    pop.dispatchEvent(new Event("mouseenter"));
    vi.runAllTimers();
    expect(pop.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(pop.hidden).toBe(true);
  });

  it("does nothing on a page without footnotes", () => {
    document.body.innerHTML = "<main><p>x</p></main>";
    mountFootnotes();
    expect(document.querySelector(".fn-pop")).toBeNull();
  });
});
