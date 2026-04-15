import fs from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { Module, Slide } from "./types";
import { MODULE_META, PARTS } from "./constants";

const DOCS_DIR = path.resolve(process.cwd(), "../docs");

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

async function renderMarkdown(md: string): Promise<string> {
  const result = await processor.process(md);
  return String(result);
}

/**
 * Extract all footnote definitions from the full document content.
 * Footnote defs look like: [^1]: Some text that may span multiple lines
 */
function extractFootnoteDefinitions(content: string): Map<string, string> {
  const defs = new Map<string, string>();
  const lines = content.split("\n");
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\[\^(\w+)\]:\s*(.*)/);
    if (match) {
      // Save previous footnote if any
      if (currentKey) {
        defs.set(currentKey, currentLines.join("\n"));
      }
      currentKey = match[1];
      currentLines = [line];
    } else if (currentKey && /^\s+/.test(line) && line.trim().length > 0) {
      // Continuation of a multi-line footnote (indented)
      currentLines.push(line);
    } else {
      if (currentKey) {
        defs.set(currentKey, currentLines.join("\n"));
        currentKey = null;
        currentLines = [];
      }
    }
  }
  if (currentKey) {
    defs.set(currentKey, currentLines.join("\n"));
  }

  return defs;
}

/**
 * Find which footnote keys are referenced in a block of text.
 */
function findReferencedFootnotes(text: string): Set<string> {
  const refs = new Set<string>();
  const regex = /\[\^(\w+)\](?!:)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    refs.add(match[1]);
  }
  return refs;
}

function splitIntoSlides(content: string): { title: string; content: string }[] {
  // Extract all footnote definitions from the full document first
  const footnoteDefs = extractFootnoteDefinitions(content);

  const lines = content.split("\n");
  const slides: { title: string; content: string }[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    // Skip standalone footnote definition lines (they'll be appended where needed)
    if (!inCodeBlock && /^\[\^\w+\]:/.test(line)) {
      continue;
    }
    // Skip indented continuation lines of footnote definitions
    if (!inCodeBlock && footnoteDefs.size > 0 && /^\s{2,}/.test(line) && line.trim().length > 0) {
      // Check if this is a continuation by seeing if the previous non-empty line was a footnote def
      // Simple heuristic: skip if we're in a footnote-definition region
      // Actually, let's be more precise - only skip if previous pushed line was empty (end of content)
      // This is tricky, so let's just include it to be safe
    }

    // Split on ## headings that are NOT inside code blocks
    if (!inCodeBlock && /^## /.test(line)) {
      // Save previous slide with its footnotes
      if (currentLines.length > 0 || currentTitle) {
        const slideContent = currentLines.join("\n").trim();
        slides.push({
          title: currentTitle || "Title",
          content: appendFootnotes(slideContent, footnoteDefs),
        });
      }
      currentTitle = line.replace(/^## /, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last slide
  if (currentLines.length > 0 || currentTitle) {
    const slideContent = currentLines.join("\n").trim();
    slides.push({
      title: currentTitle || "Title",
      content: appendFootnotes(slideContent, footnoteDefs),
    });
  }

  return slides;
}

/**
 * Append relevant footnote definitions to a slide's content so they resolve correctly.
 */
function appendFootnotes(content: string, allDefs: Map<string, string>): string {
  const refs = findReferencedFootnotes(content);
  if (refs.size === 0) return content;

  const footnoteBlock: string[] = [];
  for (const key of refs) {
    const def = allDefs.get(key);
    if (def) {
      footnoteBlock.push(def);
    }
  }

  if (footnoteBlock.length === 0) return content;
  return content + "\n\n" + footnoteBlock.join("\n\n");
}

export async function getModule(slug: string): Promise<Module | null> {
  const meta = MODULE_META.find((m) => m.slug === slug);
  if (!meta) return null;

  const filePath = path.join(DOCS_DIR, meta.file);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const rawSlides = splitIntoSlides(content);

  const slides: Slide[] = await Promise.all(
    rawSlides.map(async (s, i) => ({
      title: s.title,
      content: s.content,
      html: await renderMarkdown(s.content),
      index: i,
    }))
  );

  return {
    slug: meta.slug,
    number: meta.number,
    title: meta.title,
    description: meta.description,
    part: PARTS[meta.partIndex],
    slides,
  };
}

export async function getAllModules(): Promise<Module[]> {
  const modules: Module[] = [];
  for (const meta of MODULE_META) {
    const mod = await getModule(meta.slug);
    if (mod) modules.push(mod);
  }
  return modules;
}

export function getModuleSlugs(): string[] {
  return MODULE_META.map((m) => m.slug);
}
