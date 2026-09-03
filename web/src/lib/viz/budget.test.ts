import { validateSpec } from "./budget";

const ok = {
  nodes: [{ id: "a", label: "A", focal: true }, { id: "b", label: "B", kind: "decision" }, { id: "c", label: "C", kind: "end" }],
  links: [{ source: "a", target: "b" }, { source: "b", target: "c", label: "yes", accent: true }],
};

describe("validateSpec", () => {
  it("accepts a figure within budget", () => {
    expect(validateSpec("flowchart", ok)).toEqual([]);
    expect(validateSpec("flow", ok)).toEqual([]);
  });

  it("rejects unknown kinds and node kinds", () => {
    expect(validateSpec("graph", ok)[0]).toMatch(/unknown kind/);
    expect(validateSpec("flowchart", { ...ok, nodes: [{ id: "a", label: "A", kind: "cloud" }, { id: "b", label: "B" }] })[0]).toMatch(/unknown kind "cloud"/);
  });

  it("caps focal nodes at two and accent links at one", () => {
    const nodes = ok.nodes.map((n) => ({ ...n, focal: true }));
    expect(validateSpec("flowchart", { ...ok, nodes }).join("\n")).toMatch(/3 focal nodes/);
    const links = ok.links.map((l) => ({ ...l, accent: true }));
    expect(validateSpec("flowchart", { ...ok, links }).join("\n")).toMatch(/2 accent links/);
  });

  it("caps node count at nine and label length", () => {
    const nodes = Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }));
    expect(validateSpec("flow", { nodes, links: [] }).join("\n")).toMatch(/10 nodes/);
    expect(validateSpec("flow", { nodes: [{ id: "a", label: "x".repeat(29) }, { id: "b", label: "B" }], links: [] }).join("\n")).toMatch(/over 28 characters/);
  });

  it("checks links point at nodes and edge labels stay short", () => {
    const out = validateSpec("flowchart", { ...ok, links: [{ source: "a", target: "zz", label: "a very long edge label" }] }).join("\n");
    expect(out).toMatch(/target "zz" is not a node/);
    expect(out).toMatch(/over 14 characters/);
  });

  it("applies loop and funnel budgets", () => {
    const stations = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `S${i}` }));
    expect(validateSpec("loop", { stations: stations(2) })[0]).toMatch(/2 stations/);
    expect(validateSpec("loop", { stations: stations(5), hub: { label: "Hub" } })).toEqual([]);
    expect(validateSpec("loop", { stations: stations(5).map((s) => ({ ...s, focal: true })) })[0]).toMatch(/focal stations; the accent goes on at most 1/);
    expect(validateSpec("funnel", { layers: [{ label: "a", catches: "b" }] })[0]).toMatch(/1 layers/);
  });
});
