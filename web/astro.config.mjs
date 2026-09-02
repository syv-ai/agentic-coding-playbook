import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import { rehypeSlides } from "./src/lib/rehype-slides.ts";

export default defineConfig({
  site: "https://syv-ai.github.io",
  base: "/agentic-coding-playbook",
  trailingSlash: "always",
  output: "static",
  integrations: [mdx(), react()],
  markdown: {
    // rehypeHeadingIds must run before rehypeSlides so sections can copy the h2 id.
    rehypePlugins: [rehypeHeadingIds, rehypeSlides],
  },
});
