// @vitest-environment jsdom
import { renderLoop } from "./loop";
import { readTheme } from "./theme";

const spec = {
  stations: [
    { id: "capture", label: "Capture", sub: "signals in", spokeLabel: "signals" },
    { id: "research", label: "Research", sub: "evidence pulled" },
    { id: "decide", label: "Decide", sub: "human approves", focal: true },
    { id: "act", label: "Act", sub: "work ships" },
    { id: "learn", label: "Learn", sub: "playbook updated" },
  ],
  hub: { label: "Shared memory", sub: "one record, every loop" },
};

describe("renderLoop", () => {
  it("places stations on a ring with an arc to each neighbour and a dashed spoke to the hub", () => {
    const el = document.createElement("div");
    renderLoop(el, spec, { theme: readTheme() });
    expect(el.querySelectorAll(".station").length).toBe(5);
    expect(el.querySelectorAll(".hub").length).toBe(1);
    const arcs = el.querySelectorAll(".ring");
    expect(arcs.length).toBe(5);
    arcs.forEach((a) => expect(a.getAttribute("d")).toMatch(/A\d+,\d+ 0 0 1/));
    const spokes = el.querySelectorAll(".spoke");
    expect(spokes.length).toBe(5);
    spokes.forEach((s) => expect(s.getAttribute("stroke-dasharray")).toBe("4 3"));
    expect(el.querySelector(".edge-label text")?.textContent).toBe("SIGNALS");
  });

  it("keeps the ring arcs clear of the stations they connect", () => {
    const el = document.createElement("div");
    renderLoop(el, spec, { theme: readTheme() });
    const boxes = Array.from(el.querySelectorAll<SVGGElement>(".station")).map((g) => {
      const [x, y] = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute("transform")!)!.slice(1).map(Number);
      const r = g.querySelector("rect")!;
      return { x, y, w: Number(r.getAttribute("width")), h: Number(r.getAttribute("height")) };
    });
    el.querySelectorAll(".ring").forEach((a) => {
      const [sx, sy, ex, ey] = a.getAttribute("d")!.match(/[-\d.]+/g)!.map(Number).filter((_, i) => [0, 1, 7, 8].includes(i));
      for (const b of boxes) {
        for (const [px, py] of [[sx, sy], [ex, ey]]) {
          const inside = px > b.x && px < b.x + b.w && py > b.y && py < b.y + b.h;
          expect(inside).toBe(false);
        }
      }
    });
  });

  it("draws no spokes without a hub and pulses stations then hub", () => {
    const el = document.createElement("div");
    renderLoop(el, { stations: spec.stations }, { theme: readTheme() });
    expect(el.querySelectorAll(".spoke").length).toBe(0);
    expect(el.querySelectorAll(".hub").length).toBe(0);
    renderLoop(el, spec, { theme: readTheme() });
    expect(el.querySelectorAll(".station > .shape > animate").length).toBe(10);
    expect(el.querySelectorAll(".hub > .shape > animate").length).toBe(2);
    expect(el.querySelectorAll(".ring > animate, .spoke > animate").length).toBe(0);
  });
});
