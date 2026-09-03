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
  const orientation = (fig.dataset.orientation as "LR" | "TD") ?? "TD";
  const title = fig.querySelector("figcaption")?.textContent?.trim() || undefined;
  const theme = readTheme();
  if (kind === "flow") renderFlow(canvas, spec as FlowSpec, { orientation, theme, title });
  else if (kind === "flowchart" || kind === "graph") renderFlowchart(canvas, spec as FlowchartSpec, { orientation, theme, title });
  else if (kind === "loop") renderLoop(canvas, spec as LoopSpec, { theme, title });
  else if (kind === "funnel") renderFunnel(canvas, spec as FunnelSpec, { theme });
}

/** One shared <dialog>; the expand button clones the figure's svg into it at lightbox size. */
function lightbox(): HTMLDialogElement {
  let dialog = document.querySelector<HTMLDialogElement>("dialog.visual-lightbox");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "visual-lightbox";
  dialog.innerHTML = '<button type="button" class="btn visual-lightbox-close" aria-label="Close">Close</button><figure><div class="visual-lightbox-body"></div><figcaption></figcaption></figure>';
  dialog.querySelector(".visual-lightbox-close")?.addEventListener("click", () => dialog!.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog!.close(); });
  document.body.appendChild(dialog);
  return dialog;
}

function expand(fig: HTMLElement): void {
  const svg = fig.querySelector("svg");
  if (!svg) return;
  const dialog = lightbox();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  dialog.querySelector(".visual-lightbox-body")!.replaceChildren(clone);
  dialog.querySelector("figcaption")!.textContent = fig.querySelector("figcaption")?.textContent ?? "";
  dialog.showModal();
}

let mounted = false;

/** Render every <figure data-visual> on the page; redraw on theme change; reveal on scroll. Safe to call more than once. */
export function mountVisuals(): void {
  if (mounted) return;
  mounted = true;
  const figures = Array.from(document.querySelectorAll<HTMLElement>("figure[data-visual]"));
  figures.forEach(draw);
  figures.forEach((f) => f.querySelector("[data-expand]")?.addEventListener("click", () => expand(f)));

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
