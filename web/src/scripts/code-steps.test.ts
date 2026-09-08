// @vitest-environment jsdom
import { createSteps, lcsPairs, mountCodeSteps, slideHeight } from "./code-steps";

describe("lcsPairs", () => {
  it("pairs equal lines in order, so a moved line is a move and a changed line is a remove plus an add", () => {
    expect(lcsPairs(["a", "b", "c"], ["a", "x", "c"])).toEqual([[0, 0], [2, 2]]);
    expect(lcsPairs(["a", "b", "c"], ["c", "a", "b"])).toEqual([[0, 1], [1, 2]]);
    expect(lcsPairs([], ["a"])).toEqual([]);
  });
});

const pre = (lines: string[]) => `<pre class="astro-code"><code>${lines.map((l) => `<span class="line"><span>${l}</span></span>`).join("\n")}</code></pre>`;

function block(steps: { desc: string; note: string; lines: string[] }[], attrs = "") {
  document.body.innerHTML = `
    <section data-code-steps ${attrs}>
      <span data-steps-meta></span><span data-steps-desc></span>
      <span data-steps-dots>${steps.map(() => "<i></i>").join("")}</span>
      <button data-steps-prev>Previous</button><button data-steps-next>Next</button>
      <div data-steps-stage>${pre(steps[0].lines)}</div>
      <p data-steps-note></p>
      ${steps.map((s) => `<template data-step data-desc="${s.desc}" data-note="${s.note}">${pre(s.lines)}</template>`).join("")}
    </section>`;
  return document.querySelector<HTMLElement>("[data-code-steps]")!;
}
const shown = () => Array.from(document.querySelectorAll("[data-steps-stage] .line")).map((l) => (l.classList.contains("chg") ? "*" : "") + l.textContent);

const STEPS = [
  { desc: "one", note: "n1", lines: ["def run(task):", "    return agent(task)"] },
  { desc: "two", note: "n2", lines: ["def run(task, check):", "    result = agent(task)", "    return result"] },
  { desc: "three", note: "n3", lines: ["    result = agent(task)", "def run(task, check):", "    return result"] },
];

describe("createSteps", () => {
  it("steps forward and back, keeping matching lines and tinting new ones", () => {
    const steps = createSteps(block(STEPS), false);
    expect(steps.count).toBe(3);
    expect(shown()).toEqual(["def run(task):", "    return agent(task)"]);
    steps.next();
    expect(shown()).toEqual(["*def run(task, check):", "*    result = agent(task)", "*    return result"]);
    steps.next();
    // Two lines swap: the subsequence keeps one, so the other is removed and re-added, and carries the tint.
    expect(shown()).toEqual(["    result = agent(task)", "*def run(task, check):", "    return result"]);
    steps.prev();
    expect(shown()).toEqual(["def run(task, check):", "*    result = agent(task)", "    return result"]); // the swap, undone
    steps.next(); steps.next();
    expect(steps.index).toBe(2);
  });

  it("updates the header slots and the buttons", () => {
    const root = block(STEPS);
    const steps = createSteps(root, false);
    const prev = root.querySelector<HTMLButtonElement>("[data-steps-prev]")!, next = root.querySelector<HTMLButtonElement>("[data-steps-next]")!;
    expect(prev.disabled).toBe(true);
    next.click();
    expect(root.querySelector("[data-steps-meta]")?.textContent).toBe("· step 2 of 3");
    expect(root.querySelector("[data-steps-desc]")?.textContent).toBe("two");
    expect(root.querySelector("[data-steps-note]")?.textContent).toBe("n2");
    expect(Array.from(root.querySelectorAll("[data-steps-dots] i")).map((d) => d.classList.contains("on"))).toEqual([false, true, false]);
    expect(prev.disabled).toBe(false);
    next.click();
    expect(next.disabled).toBe(true);
    expect(steps.index).toBe(2);
  });

  it("animates without throwing and settles on the new lines", () => {
    vi.useFakeTimers();
    const steps = createSteps(block(STEPS), true);
    steps.next();
    vi.runAllTimers();
    expect(shown()).toEqual(["*def run(task, check):", "*    result = agent(task)", "*    return result"]);
    expect(document.querySelectorAll(".leave, .leave-pre, .enter")).toHaveLength(0);
    vi.useRealTimers();
  });
});

describe("mountCodeSteps in the deck", () => {
  afterEach(() => { delete document.documentElement.dataset.render; });
  it("steps the active slide's block on arrow keys and lets the key through at the ends", () => {
    document.documentElement.dataset.render = "deck";
    block(STEPS);
    document.body.innerHTML = `<section class="slide" data-active>${document.body.innerHTML}</section>`;
    const [steps] = mountCodeSteps();
    let reached = 0;
    document.addEventListener("keydown", () => reached++); // stands in for the deck's own handler
    const key = (k: string) => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    key("ArrowRight"); key("ArrowRight");
    expect(steps.index).toBe(2);
    expect(reached).toBe(0);
    key("ArrowRight");
    expect(reached).toBe(1); // last step: the deck moves on
    key("ArrowLeft");
    expect(steps.index).toBe(1);
  });
});

describe("slideHeight", () => {
  it("pins the old height, moves to the new one and lets go afterwards; no-op when nothing changes", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    let h = 20;
    Object.defineProperty(el, "offsetHeight", { get: () => h });
    slideHeight(el, () => { h = 44; });
    expect(el.style.height).toBe("44px");
    expect(el.style.overflow).toBe("hidden");
    vi.runAllTimers();
    expect(el.style.height).toBe("");
    slideHeight(el, () => {});
    expect(el.style.height).toBe("");
    vi.useRealTimers();
  });
});

describe("auto-run", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); delete document.documentElement.dataset.render; });

  it("cycles through the steps and wraps, and holds while the pointer is over the block", () => {
    const root = block(STEPS, 'data-auto="1000"');
    const steps = createSteps(root, false);
    vi.advanceTimersByTime(1000);
    expect(steps.index).toBe(1);
    vi.advanceTimersByTime(2000);
    expect(steps.index).toBe(0); // wrapped after the last step
    root.dispatchEvent(new Event("mouseenter"));
    expect(steps.paused).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(steps.index).toBe(0);
    root.dispatchEvent(new Event("mouseleave"));
    vi.advanceTimersByTime(1000);
    expect(steps.index).toBe(1);
  });

  it("does not run without data-auto, and in the deck only while its slide is active", () => {
    const idle = createSteps(block(STEPS), false);
    vi.advanceTimersByTime(5000);
    expect(idle.index).toBe(0);
    document.documentElement.dataset.render = "deck";
    const root = block(STEPS, 'data-auto="500"');
    document.body.innerHTML = `<section class="slide">${document.body.innerHTML}</section>`;
    const steps = createSteps(document.querySelector("[data-code-steps]")!, false);
    vi.advanceTimersByTime(1500);
    expect(steps.index).toBe(0);
    document.querySelector("section.slide")!.setAttribute("data-active", "");
    vi.advanceTimersByTime(500);
    expect(steps.index).toBe(1);
    void root;
  });
});
