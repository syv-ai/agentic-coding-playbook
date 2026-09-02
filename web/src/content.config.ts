import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const books = defineCollection({
  loader: glob({ pattern: "*/book.yaml", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    audience: z.string(),
    order: z.number().int(),
    gated: z.boolean().default(false),
    parts: z.array(z.object({ key: z.string(), title: z.string() })).default([]),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: "*/[0-9][0-9]-*.mdx", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    summary: z.string(),
    status: z.enum(["draft", "review", "published"]),
    part: z.string().optional(),
    sources: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: z.object({ title: z.string() }),
});

export const collections = { books, chapters, pages };
