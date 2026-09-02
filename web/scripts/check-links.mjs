// Post-build internal link check. Walks dist/**/*.html, resolves every href/src that points into the site,
// and fails if the target file does not exist. External links are not fetched.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const DIST = resolve("dist");
const BASE = "/agentic-coding-playbook";

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function targetExists(file, href) {
  let path = href.split("#")[0].split("?")[0];
  if (!path) return true; // same-page anchor
  if (path.startsWith(BASE)) path = path.slice(BASE.length);
  const abs = path.startsWith("/") ? join(DIST, path) : resolve(dirname(file), path);
  if (await exists(abs)) return true;
  return exists(join(abs, "index.html"));
}

const files = await walk(DIST);
const broken = [];
for (const file of files) {
  const html = await readFile(file, "utf8");
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|\/\/)/.test(href)) continue;
    if (!(await targetExists(file, href))) broken.push(`${file.replace(DIST, "dist")} → ${href}`);
  }
}
if (broken.length) {
  console.error(`${broken.length} broken internal link(s):\n` + broken.join("\n"));
  process.exit(1);
}
console.log(`checked ${files.length} pages, no broken internal links`);
