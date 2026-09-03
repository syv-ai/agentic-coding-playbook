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

  it("top-down, ranks step sideways to fill a portrait rectangle within the column", () => {
    const el = document.createElement("div");
    renderFlowchart(el, spec, { orientation: "TD", theme: readTheme() });
    const xs = Array.from(el.querySelectorAll<SVGGElement>(".node")).map((n) => Number(/translate\(([-\d.]+),/.exec(n.getAttribute("transform")!)![1]));
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[4]).toBeGreaterThan(xs[1]);
    const svg = el.querySelector("svg")!;
    const w = Number(svg.getAttribute("width")), h = Number(svg.getAttribute("height"));
    expect(w / h).toBeGreaterThan(0.5);
    expect(w).toBeLessThanOrEqual(640 + 2 * 16 + 64); // column plus margins and the return lane
    el.querySelectorAll(".edge").forEach((e) => expect(isOrthogonal(e.getAttribute("d")!)).toBe(true));
  });

  it("places nodes on an editorial grid and routes between cells: straight in a row or column, L through a free cell", () => {
    const el = document.createElement("div");
    const at: Record<string, [number, number]> = { check: [0, 0], act: [0, 1], run: [1, 1], pass: [1, 2], done: [1, 3] };
    renderFlowchart(el, { ...spec, nodes: spec.nodes.map((n) => ({ ...n, at: at[n.id] })) }, { theme: readTheme() });
    const pos = Object.fromEntries(Array.from(el.querySelectorAll<SVGGElement>(".node")).map((n, i) => {
      const [x, y] = /translate\(([-\d.]+),([-\d.]+)\)/.exec(n.getAttribute("transform")!)!.slice(1).map(Number);
      const sh = n.querySelector(".shape")!;
      const w = Number(sh.getAttribute("width") ?? 160), h = Number(sh.getAttribute("height") ?? 80);
      return [spec.nodes[i].id, { cx: x + w / 2, cy: y + h / 2 }];
    }));
    expect(pos.check.cx).toBe(pos.act.cx);
    expect(pos.act.cy).toBe(pos.run.cy);
    expect(pos.run.cx).toBe(pos.pass.cx);
    expect(pos.pass.cx).toBe(pos.done.cx);
    const ds = Array.from(el.querySelectorAll(".edge")).map((e) => e.getAttribute("d")!);
    ds.forEach((d) => expect(isOrthogonal(d)).toBe(true));
    expect(ds[0]).toMatch(/^M[-\d.]+,[-\d.]+ L[-\d.]+,[-\d.]+$/); // check → act: one vertical segment
    expect(ds[1]).toMatch(/^M[-\d.]+,[-\d.]+ L[-\d.]+,[-\d.]+$/); // act → run: one horizontal segment
    expect((ds[4].match(/A\d+,\d+/g) ?? []).length).toBe(1); // pass → act: one L through the empty cell
    const svg = el.querySelector("svg")!;
    const w = Number(svg.getAttribute("width")), h = Number(svg.getAttribute("height"));
    expect(w / h).toBeGreaterThan(0.6);
    expect(w / h).toBeLessThan(1.1);
    const labels = Array.from(el.querySelectorAll(".edge-label rect")).map((r) => Number(r.getAttribute("x")) + Number(r.getAttribute("width")));
    labels.forEach((right) => expect(right).toBeLessThanOrEqual(w));
  });

  it("falls back to a Z route through the row gap when the L path is blocked", () => {
    const el = document.createElement("div");
    renderFlowchart(el, {
      nodes: [{ id: "a", label: "A", at: [0, 0] }, { id: "b", label: "B", at: [1, 0] }, { id: "c", label: "C", at: [1, 1] }],
      links: [{ source: "a", target: "c" }],
    }, { theme: readTheme() });
    const d = el.querySelector(".edge")!.getAttribute("d")!;
    expect(isOrthogonal(d)).toBe(true);
    expect((d.match(/A\d+,\d+/g) ?? []).length).toBe(2); // two elbows; the short final leg shrinks its radius
  });

  it("pulses nodes only, in spec order", () => {
    const el = document.createElement("div");
    renderFlowchart(el, spec, { orientation: "TD", theme: readTheme() });
    expect(el.querySelectorAll(".node > .shape > animate").length).toBe(10);
    expect(el.querySelectorAll(".edge > animate").length).toBe(0);
  });
});
