import { readTheme } from "./theme";
import { renderFlow, type FlowSpec } from "./flow";
import { renderFlowchart, type FlowchartSpec } from "./flowchart";
import { renderLoop, type LoopSpec } from "./loop";
import { renderFunnel, type FunnelSpec } from "./funnel";

export type Kind = "flow" | "flowchart" | "loop" | "funnel" | "graph";

function draw(fig: HTMLElement): void {
  const canvas = fig.querySelector<HTMLElement>(".visual-canvas");
  const raw = fig.dataset.spec;
  if (!canvas || !raw) return;
  let spec: unknown;
  try { spec = JSON.parse(raw); } catch { return; }
  const kind = fig.dataset.visual as Kind;
  const orientation = (fig.dataset.orientation as "LR" | "TD") ?? "LR";
  const title = fig.querySelector("figcaption")?.textContent?.trim() || undefined;
  const theme = readTheme();
  if (kind === "flow") renderFlow(canvas, spec as FlowSpec, { orientation, theme, title });
  else if (kind === "flowchart" || kind === "graph") renderFlowchart(canvas, spec as FlowchartSpec, { orientation, theme, title });
  else if (kind === "loop") renderLoop(canvas, spec as LoopSpec, { theme, title });
  else if (kind === "funnel") renderFunnel(canvas, spec as FunnelSpec, { theme });
}

let mounted = false;

/** Render every <figure data-visual> on the page; redraw on theme change; reveal on scroll. Safe to call more than once. */
export function mountVisuals(): void {
  if (mounted) return;
  mounted = true;
  const figures = Array.from(document.querySelectorAll<HTMLElement>("figure[data-visual]"));
  figures.forEach(draw);

  const redraw = () => figures.forEach(draw);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    figures.forEach((f) => io.observe(f));
  } else {
    figures.forEach((f) => f.classList.add("is-visible"));
  }
}
