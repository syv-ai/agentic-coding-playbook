import { readTheme } from "./theme";
import { renderFlow, type FlowSpec } from "./flow";
import { renderFunnel, type FunnelSpec } from "./funnel";
import { renderGraph, type GraphSpec } from "./graph";

type Kind = "flow" | "funnel" | "graph";

function draw(fig: HTMLElement): void {
  const canvas = fig.querySelector<HTMLElement>(".visual-canvas");
  const raw = fig.dataset.spec;
  if (!canvas || !raw) return;
  let spec: unknown;
  try { spec = JSON.parse(raw); } catch { return; }
  const kind = fig.dataset.visual as Kind;
  const orientation = (fig.dataset.orientation as "LR" | "TD") ?? "LR";
  const theme = readTheme();
  if (kind === "flow") renderFlow(canvas, spec as FlowSpec, { orientation, theme });
  else if (kind === "funnel") renderFunnel(canvas, spec as FunnelSpec, { theme });
  else if (kind === "graph") renderGraph(canvas, spec as GraphSpec, { orientation, theme });
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
