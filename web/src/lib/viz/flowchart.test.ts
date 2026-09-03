// @vitest-environment jsdom
import { renderFlowchart } from "./flowchart";
import { readTheme } from "./theme";

const spec = {
  nodes: [
    { id: "check", label: "Write the check", focal: true },
    { id: "act", label: "Agent acts" },
    { id: "run", label: "Run the check" },
    { id: "pass", label: "Passes?", kind: "decision" as const },
    { id: "done", label: "Done", kind: "end" as const },
  ],
  links: [
    { source: "check", target: "act" },
    { source: "act", target: "run" },
    { source: "run", target: "pass" },
    { source: "pass", target: "done", label: "yes" },
    { source: "pass", target: "act", label: "no" },
  ],
};

/** Every straight segment of the path must be horizontal or vertical. */
function isOrthogonal(d: string): boolean {
  const cmds = d.match(/[MLA][^MLA]*/g) ?? [];
  let prev: [number, number] | null = null;
  for (const c of cmds) {
    const nums = c.slice(1).trim().split(/[\s,]+/).map(Number);
    const end: [number, number] = [nums[nums.length - 2], nums[nums.length - 1]];
    if (c[0] === "L" && prev && Math.abs(end[0] - prev[0]) > 0.01 && Math.abs(end[1] - prev[1]) > 0.01) return false;
    prev = end;
  }
  return true;
}

describe("renderFlowchart", () => {
  it("lays out nodes on ranks with a diamond and an oval, and routes every connector orthogonally", () => {
    const el = document.createElement("div");
    renderFlowchart(el, spec, { orientation: "LR", theme: readTheme() });
    expect(el.querySelectorAll(".node").length).toBe(5);
    expect(el.querySelectorAll(".node polygon.shape").length).toBe(1);
    expect(el.querySelectorAll(".edge").length).toBe(5);
    el.querySelectorAll(".edge").forEach((e) => expect(isOrthogonal(e.getAttribute("d")!)).toBe(true));
    const ds = Array.from(el.querySelectorAll(".edge")).map((e) => e.getAttribute("d")!);
    expect(ds.some((d) => /A8,8/.test(d))).toBe(true); // elbows are rounded
    expect(ds.every((d) => !/[CQ]/.test(d))).toBe(true); // and never curves
  });

  it("routes the back-edge in a lane below the nodes and masks its label", () => {
    const el = document.createElement("div");
    renderFlowchart(el, spec, { orientation: "LR", theme: readTheme() });
    const bottoms = Array.from(el.querySelectorAll<SVGGElement>(".node")).map((n) => {
      const [, y] = /translate\(([-\d.]+),([-\d.]+)\)/.exec(n.getAttribute("transform")!)!.slice(1).map(Number);
      return y + Number(n.querySelector(".shape")!.getAttribute("height") ?? n.querySelector("polygon")!.getAttribute("points")!.split(" ")[2].split(",")[1]);
    });
    const back = el.querySelectorAll(".edge")[4].getAttribute("d")!;
    const ys = Array.from(back.matchAll(/[-\d.]+,([-\d.]+)/g)).map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeGreaterThan(Math.max(...bottoms));
    const labels = Array.from(el.querySelectorAll(".edge-label text")).map((t) => t.textContent);
    expect(labels).toEqual(["YES", "NO"]);
    el.querySelectorAll(".edge-label").forEach((l) => expect(l.querySelector("rect")).toBeTruthy());
  });

  it("gives each connector on a shared side its own attach point", () => {
    const el = document.createElement("div");
    renderFlowchart(el, {
      nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
      links: [{ source: "a", target: "b" }, { source: "a", target: "c" }],
    }, { orientation: "LR", theme: readTheme() });
    const starts = Array.from(el.querySelectorAll(".edge")).map((e) => /^M([-\d.]+),([-\d.]+)/.exec(e.getAttribute("d")!)!.slice(1).map(Number));
    expect(starts[0][0]).toBe(starts[1][0]);
    expect(Math.abs(starts[0][1] - starts[1][1])).toBeGreaterThanOrEqual(12);
  });

  it("pulses nodes only, in spec order", () => {
    const el = document.createElement("div");
    renderFlowchart(el, spec, { orientation: "TD", theme: readTheme() });
    expect(el.querySelectorAll(".node > .shape > animate").length).toBe(10);
    expect(el.querySelectorAll(".edge > animate").length).toBe(0);
  });
});
