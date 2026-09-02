// @vitest-environment jsdom
import { renderFlow } from "./flow";
import { readTheme } from "./theme";

describe("renderFlow", () => {
  const spec = {
    nodes: [{ id: "a", label: "Define the check" }, { id: "b", label: "Agent acts", sub: "one step" }, { id: "c", label: "Run the check" }],
    links: [{ source: "a", target: "b" }, { source: "b", target: "c", dir: "both" as const }],
  };

  it("draws one rect per node and one line per link", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelectorAll("rect").length).toBe(3);
    expect(el.querySelectorAll("line").length).toBe(2);
    expect(el.querySelector("line[marker-start]")).toBeTruthy();
  });

  it("adds a looping traveller per link instead of hover handlers", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "LR", theme: readTheme() });
    expect(el.querySelectorAll("circle.traveller animateMotion").length).toBe(2);
    expect(el.querySelector("animateMotion")?.getAttribute("repeatCount")).toBe("indefinite");
    expect(el.querySelector("g[style*='cursor']")).toBeNull();
  });

  it("is idempotent: re-rendering replaces the svg", () => {
    const el = document.createElement("div");
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    renderFlow(el, spec, { orientation: "TD", theme: readTheme() });
    expect(el.querySelectorAll("svg").length).toBe(1);
  });
});
