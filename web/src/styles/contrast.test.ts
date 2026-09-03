/**
 * Text must stay readable in both themes: at least 4.5:1 against its background, 3:1 for the faint tier.
 * Reads the token blocks straight from global.css so a palette change cannot slip below the bar.
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./global.css", import.meta.url), "utf8");

function block(selector: RegExp): Record<string, string> {
  const m = selector.exec(css);
  if (!m) throw new Error(`no block for ${selector}`);
  const start = m.index;
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
function resolve(tokens: Record<string, string>, name: string): string {
  const v = tokens[name];
  const ref = /var\((--[\w-]+)\)/.exec(v ?? "");
  return ref ? resolve(tokens, ref[1]) : v;
}
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const light = block(/:root\s*\{/);
const dark = { ...light, ...block(/:root\[data-theme="dark"\]\s*\{/) };

const PAIRS: [string, string, number][] = [
  ["--text", "--bg", 4.5], ["--text-muted", "--bg", 4.5], ["--text-faint", "--bg", 3], ["--link", "--bg", 4.5],
  ["--good", "--bg", 4.5], ["--warn", "--bg", 4.5], ["--bad", "--bg", 4.5],
  ["--accent-text", "--accent", 4.5], ["--text", "--bg-raised", 4.5],
  ["--viz-text", "--viz-fill", 4.5], ["--viz-sub", "--viz-fill", 4.5], ["--viz-text", "--viz-fill-soft", 4.5], ["--viz-sub", "--viz-fill-soft", 4.5],
  ["--viz-text", "--viz-accent-tint", 4.5], ["--viz-sub", "--viz-bg", 4.5], ["--viz-accent-text", "--viz-accent", 4.5],
  ["--viz-defect-text", "--viz-defect", 4.5], ["--viz-bg", "--viz-text", 4.5], ["--viz-text", "--viz-bg", 4.5],
];

describe.each([["light", light], ["dark", dark]] as const)("%s theme contrast", (_name, tokens) => {
  it.each(PAIRS)("%s on %s ≥ %s:1", (fg, bg, min) => {
    const f = resolve(tokens, fg), b = resolve(tokens, bg);
    expect(f).toMatch(/^#[0-9a-f]{6}$/i);
    expect(b).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contrast(f, b)).toBeGreaterThanOrEqual(min);
  });
});
