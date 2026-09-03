// @vitest-environment jsdom
import { renderFlow } from "./flow";
import { readTheme } from "./theme";

describe("renderFlow", () => {
  const spec = {
    nodes: [
      { id: "a", label: "Define the check", kind: "start" as const },
      { id: "b", label: "Agent acts", sub: "one step", focal: true },
      { id: "c", label: "Run the check" },
    ],
    links: [{ source: "a", target: "b", label: "then" }, { source: "b", target: "c", dir: "both" as const }],
  };

  it("draws one node per spec node and one straight connector per link, connectors first", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelectorAll(".node").length).toBe(3);
    expect(el.querySelectorAll(".edge").length).toBe(2);
    expect(el.querySelector(".edge[marker-start]")).toBeTruthy();
    el.querySelectorAll(".edge").forEach((e) => expect(e.getAttribute("d")).toMatch(/^M[-\d.]+,[-\d.]+ L[-\d.]+,[-\d.]+$/)); // one row: straight
    const svg = el.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    const edgesG = el.querySelector(".edges")!, firstNode = el.querySelector(".node")!;
    expect(edgesG.compareDocumentPosition(firstNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts a masked uppercase label above the connector and keeps node dimensions on the 4px grid", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    const label = el.querySelector(".edge-label")!;
    expect(label.querySelector("rect")).toBeTruthy();
    expect(label.querySelector("text")?.textContent).toBe("THEN");
    const lineY = Number(/^M[-\d.]+,([-\d.]+)/.exec(el.querySelector(".edge")!.getAttribute("d")!)![1]);
    const mask = label.querySelector("rect")!;
    expect(Number(mask.getAttribute("y")) + Number(mask.getAttribute("height"))).toBeLessThanOrEqual(lineY - 6);
    el.querySelectorAll(".node rect.shape").forEach((r) => {
      expect(Number(r.getAttribute("width")) % 4).toBe(0);
      expect(Number(r.getAttribute("height")) % 4).toBe(0);
    });
  });

  it("steps sideways rank by rank top-down, so the figure fills a portrait rectangle with orthogonal elbows", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    const xs = Array.from(el.querySelectorAll<SVGGElement>(".node")).map((n) => Number(/translate\(([-\d.]+),/.exec(n.getAttribute("transform")!)![1]));
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
    const svg = el.querySelector("svg")!;
    const w = Number(svg.getAttribute("width")), h = Number(svg.getAttribute("height"));
    expect(w / h).toBeGreaterThan(0.5);
    expect(w).toBeLessThanOrEqual(640);
    el.querySelectorAll(".edge").forEach((e) => expect(e.getAttribute("d")).toMatch(/A8,8/));
  });

  it("outlines only nodes in the canvas colour, and sets canvas text in the standard text colour", () => {
    const el = document.createElement("div");
    const theme = readTheme();
    renderFlow(el, spec, { orientation: "LR", theme });
    const shapes = Array.from(el.querySelectorAll<SVGElement>(".node .shape"));
    const start = shapes[0], focal = shapes[1], step = shapes[2];
    expect(start.getAttribute("stroke")).toBe("none"); // soft fill, no border
    expect(focal.getAttribute("stroke")).toBe("none"); // accent tint, no border
    expect(step.getAttribute("fill")).toBe(theme.colors.fill);
    expect(step.getAttribute("stroke")).toBe(theme.colors.border);
    expect(el.querySelector(".edge-label text")!.getAttribute("fill")).toBe(theme.colors.text);
    expect(el.querySelector(".node text.sub")!.getAttribute("fill")).toBe(theme.colors.sub);
  });

  it("is idempotent: re-rendering replaces the svg", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
  });

  it("pulses every node in sequence on one shared looping cycle and leaves connectors still", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    const anims = Array.from(el.querySelectorAll("animate"));
    expect(el.querySelectorAll(".node > .shape > animate").length).toBe(4); // fill everywhere, stroke only on the outlined node
    expect(el.querySelectorAll(".edge > animate").length).toBe(0);
    expect(new Set(anims.map((a) => a.getAttribute("dur"))).size).toBe(1);
    expect(anims.every((a) => a.getAttribute("repeatCount") === "indefinite")).toBe(true);
    expect(el.querySelector("g[style*='cursor']")).toBeNull();
  });
});
