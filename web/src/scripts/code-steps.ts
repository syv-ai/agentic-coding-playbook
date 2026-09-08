/**
 * Stepped code walkthrough. Every step's highlighted lines are server-rendered (see CodeSteps.astro);
 * this module moves lines between steps: kept lines glide to their new row, removed lines lift out,
 * new lines rise in with a tint. Lines are matched by text, so a moved line is a move.
 */

/** Index pairs (a[i] === b[j]) of a longest common subsequence, in order. */
export function lcsPairs(a: readonly string[], b: readonly string[]): [number, number][] {
  const m = a.length, n = b.length;
  const t: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const pairs: [number, number][] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

export interface Steps {
  readonly index: number;
  readonly count: number;
  go(i: number): void;
  next(): void;
  prev(): void;
}

const raf = (f: () => void) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(f) : setTimeout(f, 16));
const LEAVE_MS = 1000;

/**
 * Drive one walkthrough. `root` holds the stage (a rendered <pre> for step 0), one <template data-step> per step
 * with the step's <pre>, and the header slots. `animate` false swaps states instantly (reduced motion, tests).
 */
export function createSteps(root: HTMLElement, animate = true): Steps {
  const templates = Array.from(root.querySelectorAll<HTMLTemplateElement>("template[data-step]"));
  const stage = root.querySelector<HTMLElement>("[data-steps-stage]")!;
  const meta = root.querySelector<HTMLElement>("[data-steps-meta]");
  const desc = root.querySelector<HTMLElement>("[data-steps-desc]");
  const note = root.querySelector<HTMLElement>("[data-steps-note]");
  const dots = root.querySelector<HTMLElement>("[data-steps-dots]");
  const prevBtn = root.querySelector<HTMLButtonElement>("[data-steps-prev]");
  const nextBtn = root.querySelector<HTMLButtonElement>("[data-steps-next]");
  const count = templates.length;
  let index = 0;

  const pre = () => stage.querySelector<HTMLElement>("pre")!;
  const code = () => pre().querySelector<HTMLElement>("code") ?? pre();
  const linesOf = (el: ParentNode) => Array.from(el.querySelectorAll<HTMLElement>(".line"));
  const textOf = (el: HTMLElement) => el.textContent ?? "";

  const render = (to: number) => {
    const target = templates[to].content.querySelector("pre");
    if (!target) return;
    const container = code();
    const current = linesOf(container);
    const nextLines = linesOf(target).map((l) => l.cloneNode(true) as HTMLElement);
    const keep = new Map(lcsPairs(current.map(textOf), nextLines.map(textOf)));
    const byNew = new Map(Array.from(keep, ([o, n]) => [n, current[o]]));
    const before = new Map(current.map((l) => [l, l.offsetTop]));
    const h0 = pre().offsetHeight;

    const out: HTMLElement[] = nextLines.map((fresh, n) => {
      const kept = byNew.get(n);
      if (kept) { kept.classList.remove("chg"); return kept; }
      fresh.classList.add("chg");
      if (animate) fresh.classList.add("enter");
      return fresh;
    });
    const leaving = current.filter((_, o) => !keep.has(o));

    if (animate) {
      leaving.forEach((l) => { l.style.top = `${before.get(l)}px`; l.classList.add("leave-pre"); });
      pre().style.height = `${h0}px`;
    }
    out.forEach((el) => container.appendChild(el));
    if (animate) {
      leaving.forEach((l) => container.appendChild(l));
      out.forEach((el) => {
        const from = before.get(el);
        if (from === undefined) return;
        const d = from - el.offsetTop;
        if (d) { el.style.transition = "none"; el.style.transform = `translateY(${d}px)`; }
      });
      const cs = getComputedStyle(pre());
      const h1 = out.reduce((s, el) => s + el.offsetHeight, 0) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      raf(() => raf(() => {
        out.forEach((el) => { el.style.transition = ""; el.style.transform = ""; el.classList.remove("enter"); });
        leaving.forEach((l) => l.classList.add("leave"));
        pre().style.height = `${h1}px`;
        setTimeout(() => { leaving.forEach((l) => l.remove()); pre().style.height = ""; }, LEAVE_MS);
      }));
    } else {
      leaving.forEach((l) => l.remove());
    }

    index = to;
    const t = templates[to];
    if (meta) meta.textContent = `· step ${to + 1} of ${count}`;
    if (desc) desc.textContent = t.dataset.desc ?? "";
    if (note) { note.textContent = t.dataset.note ?? ""; note.hidden = !t.dataset.note; }
    if (dots) dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i === to));
    if (prevBtn) prevBtn.disabled = to === 0;
    if (nextBtn) nextBtn.disabled = to === count - 1;
  };

  const go = (i: number) => {
    const to = Math.max(0, Math.min(count - 1, i));
    if (to !== index) render(to);
  };
  prevBtn?.addEventListener("click", () => go(index - 1));
  nextBtn?.addEventListener("click", () => go(index + 1));
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = count <= 1;

  return {
    get index() { return index; },
    get count() { return count; },
    go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
  };
}

/** Mount every walkthrough on the page. In the deck, arrow keys step the active slide's block before the deck moves. */
export function mountCodeSteps(doc: Document = document): Steps[] {
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const deck = doc.documentElement.dataset.render === "deck";
  const all = Array.from(doc.querySelectorAll<HTMLElement>("[data-code-steps]")).map((root) => ({ root, steps: createSteps(root, !reduced) }));
  if (deck) {
    doc.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const active = all.find(({ root }) => root.closest("[data-active]"));
      if (!active) return;
      const { steps } = active;
      const can = e.key === "ArrowRight" ? steps.index < steps.count - 1 : steps.index > 0;
      if (!can) return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "ArrowRight") steps.next(); else steps.prev();
    }, true);
  }
  return all.map((a) => a.steps);
}
