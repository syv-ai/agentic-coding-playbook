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
    expect(el.querySelectorAll("line.edge").length).toBe(2);
    expect(el.querySelector("line[marker-start]")).toBeTruthy();
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
    const line = el.querySelector("line.edge")!;
    const mask = label.querySelector("rect")!;
    expect(Number(mask.getAttribute("y")) + Number(mask.getAttribute("height"))).toBeLessThanOrEqual(Number(line.getAttribute("y1")) - 6);
    el.querySelectorAll(".node rect.shape").forEach((r) => {
      expect(Number(r.getAttribute("width")) % 4).toBe(0);
      expect(Number(r.getAttribute("height")) % 4).toBe(0);
    });
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
    expect(el.querySelectorAll(".node > .shape > animate").length).toBe(6); // fill + stroke per node
    expect(el.querySelectorAll(".edge > animate").length).toBe(0);
    expect(new Set(anims.map((a) => a.getAttribute("dur"))).size).toBe(1);
    expect(anims.every((a) => a.getAttribute("repeatCount") === "indefinite")).toBe(true);
    expect(el.querySelector("g[style*='cursor']")).toBeNull();
  });
});
