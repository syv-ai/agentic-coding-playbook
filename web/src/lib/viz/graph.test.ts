// @vitest-environment jsdom
import { renderGraph } from "./graph";
import { readTheme } from "./theme";

describe("renderGraph", () => {
  it("lays out a loop with a decision node and edge labels", () => {
    const el = document.createElement("div");
    renderGraph(
      el,
      {
        nodes: [
          { id: "check", label: "Write the check" },
          { id: "act", label: "Agent acts" },
          { id: "run", label: "Run the check" },
          { id: "pass", label: "Passes?", kind: "decision" },
          { id: "done", label: "Done" },
        ],
        links: [
          { source: "check", target: "act" },
          { source: "act", target: "run" },
          { source: "run", target: "pass" },
          { source: "pass", target: "done", label: "yes" },
          { source: "pass", target: "act", label: "no" },
        ],
      },
      { orientation: "LR", theme: readTheme() }
    );
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelectorAll(".node").length).toBe(5);
    expect(el.querySelectorAll(".edge").length).toBe(5);
    expect(Array.from(el.querySelectorAll("text")).some((t) => t.textContent === "no")).toBe(true);
    expect(el.querySelectorAll("circle.traveller").length).toBe(5);
  });
});
