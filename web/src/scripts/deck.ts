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
