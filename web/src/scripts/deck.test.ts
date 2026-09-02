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
