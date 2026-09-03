import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import { rehypeHeadingAnchors } from "./src/lib/rehype-heading-anchors.ts";
import { rehypeFigures } from "./src/lib/rehype-figures.ts";
import { rehypeSlides } from "./src/lib/rehype-slides.ts";

export default defineConfig({
  site: "https://syv-ai.github.io",
  base: "/agentic-coding-playbook",
  trailingSlash: "always",
  output: "static",
  integrations: [mdx(), react()],
  markdown: {
    // Order matters: ids first, then anchors that use them, figure numbers, then sectioning (which nests everything).
    rehypePlugins: [rehypeHeadingIds, rehypeHeadingAnchors, rehypeFigures, rehypeSlides],
  },
});
