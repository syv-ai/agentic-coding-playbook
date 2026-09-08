/**
 * Footnote popovers. remark-gfm renders `[^1]` as <sup><a data-footnote-ref href="#fn-1">1</a></sup>
 * and the definitions as <section data-footnotes><ol><li id="fn-1">…</li></ol></section>.
 * Hovering or focusing a reference shows the note's text in one shared panel under it.
 */
export function mountFootnotes(root: ParentNode = document): void {
  const refs = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]"));
  if (!refs.length) return;
  const pop = document.createElement("div");
  pop.className = "fn-pop";
  pop.setAttribute("role", "tooltip");
  pop.hidden = true;
  document.body.appendChild(pop);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const noteFor = (ref: HTMLAnchorElement): HTMLElement | null => {
    const id = decodeURIComponent(ref.getAttribute("href") ?? "").replace(/^#/, "");
    return id ? document.getElementById(id) : null;
  };
  const show = (ref: HTMLAnchorElement) => {
    clearTimeout(hideTimer);
    const note = noteFor(ref);
    if (!note) return;
    const copy = note.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[data-footnote-backref]").forEach((a) => a.remove());
    pop.innerHTML = copy.innerHTML;
    pop.hidden = false;
    const r = ref.getBoundingClientRect();
    const width = Math.min(pop.offsetWidth, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left + window.scrollX - 12, window.innerWidth - width - 16 + window.scrollX));
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  };
  const hide = () => { hideTimer = setTimeout(() => { pop.hidden = true; }, 120); };

  for (const ref of refs) {
    ref.addEventListener("mouseenter", () => show(ref));
    ref.addEventListener("focus", () => show(ref));
    ref.addEventListener("mouseleave", hide);
    ref.addEventListener("blur", hide);
  }
  pop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  pop.addEventListener("mouseleave", hide);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) pop.hidden = true; });
}
