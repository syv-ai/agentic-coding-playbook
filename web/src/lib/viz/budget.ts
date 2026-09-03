/**
 * The figure budget, checked at build time by Visual.astro. A figure over budget fails the build
 * with a message naming the caption, so the rules hold for any author on any branch.
 */
export type Kind = "flow" | "flowchart" | "loop" | "funnel";
export const KINDS: Kind[] = ["flow", "flowchart", "loop", "funnel"];

const NODE_KINDS = new Set(["step", "start", "end", "decision", "store"]);
const MAX_NODES = 9, MAX_FOCAL = 2, MAX_ACCENT_LINKS = 1, MAX_LABEL = 28, MAX_EDGE_LABEL = 14;

type Rec = Record<string, unknown>;
const arr = (v: unknown): Rec[] => (Array.isArray(v) ? (v as Rec[]) : []);

function checkNodes(nodes: Rec[], problems: string[], { max = MAX_NODES, maxFocal = MAX_FOCAL, min = 2, name = "nodes" } = {}) {
  if (nodes.length < min || nodes.length > max) problems.push(`${nodes.length} ${name}; a figure has ${min} to ${max}. Above that it is two figures.`);
  const ids = new Set<string>();
  nodes.forEach((n) => {
    if (typeof n.id !== "string" || !n.id) problems.push(`a node has no id`);
    else if (ids.has(n.id)) problems.push(`duplicate node id "${n.id}"`);
    else ids.add(n.id);
    if (typeof n.label !== "string" || !n.label) problems.push(`node "${n.id}" has no label`);
    else String(n.label).split("\n").forEach((line) => { if (line.length > MAX_LABEL) problems.push(`node "${n.id}" label line "${line}" is over ${MAX_LABEL} characters; shorten it or break the line`); });
    if (n.kind !== undefined && !NODE_KINDS.has(String(n.kind))) problems.push(`node "${n.id}" has unknown kind "${n.kind}"`);
  });
  const placed = nodes.filter((n) => n.at !== undefined);
  if (placed.length && placed.length !== nodes.length) problems.push(`${placed.length} of ${nodes.length} ${name} have "at"; place every node on the grid or none`);
  const cells = new Set<string>();
  placed.forEach((n) => {
    const at = n.at as unknown;
    if (!Array.isArray(at) || at.length !== 2 || !at.every((v) => Number.isInteger(v) && v >= 0)) problems.push(`node "${n.id}" at must be [column, row] with whole numbers from 0`);
    else if (cells.has(at.join(","))) problems.push(`two nodes share the cell [${at.join(", ")}]`);
    else cells.add(at.join(","));
  });
  const focal = nodes.filter((n) => n.focal).length;
  if (focal > maxFocal) problems.push(`${focal} focal ${name}; the accent goes on at most ${maxFocal}. Decide what the figure is about.`);
  return ids;
}

function checkLinks(links: Rec[], ids: Set<string>, problems: string[]) {
  links.forEach((l) => {
    if (!ids.has(String(l.source))) problems.push(`link source "${l.source}" is not a node`);
    if (!ids.has(String(l.target))) problems.push(`link target "${l.target}" is not a node`);
    if (l.label !== undefined && String(l.label).length > MAX_EDGE_LABEL) problems.push(`link label "${l.label}" is over ${MAX_EDGE_LABEL} characters`);
  });
  const accent = links.filter((l) => l.accent).length;
  if (accent > MAX_ACCENT_LINKS) problems.push(`${accent} accent links; only the one happy path takes the accent`);
}

/** Returns the list of problems; empty means the spec is within budget. */
export function validateSpec(kind: string, spec: unknown): string[] {
  const problems: string[] = [];
  if (!KINDS.includes(kind as Kind)) return [`unknown kind "${kind}"; use one of ${KINDS.join(", ")}`];
  const s = (spec ?? {}) as Rec;
  if (kind === "flow" || kind === "flowchart") {
    const ids = checkNodes(arr(s.nodes), problems);
    checkLinks(arr(s.links), ids, problems);
    if (kind === "flowchart" && arr(s.links).length > 12) problems.push(`${arr(s.links).length} links; a flowchart has at most 12`);
  } else if (kind === "loop") {
    checkNodes(arr(s.stations), problems, { min: 3, max: 8, maxFocal: 1, name: "stations" });
    if (s.hub !== undefined && (typeof (s.hub as Rec).label !== "string")) problems.push("hub needs a label");
  } else if (kind === "funnel") {
    const layers = arr(s.layers);
    if (layers.length < 2 || layers.length > 6) problems.push(`${layers.length} layers; a funnel has 2 to 6`);
    layers.forEach((l, i) => { if (typeof l.label !== "string" || typeof l.catches !== "string") problems.push(`layer ${i + 1} needs label and catches`); });
  }
  return problems;
}
