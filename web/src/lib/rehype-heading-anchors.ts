import type { Element, Root } from "hast";

/**
 * Append an empty deep-link anchor to every h2/h3 that has an id (rehypeHeadingIds must run first).
 * The anchor has no text node, so heading text extraction (slide titles, the on-page TOC) is unaffected;
 * CSS draws the "#" and reveals it on hover. Runs before rehypeSlides, while headings are still top-level.
 */
export function rehypeHeadingAnchors() {
  return (tree: Root) => {
    for (const node of tree.children) {
      if (node.type !== "element" || !/^h[23]$/.test(node.tagName)) continue;
      const id = node.properties?.id;
      if (!id || node.children.some((c) => c.type === "element" && c.tagName === "a" && Array.isArray(c.properties?.className) && c.properties.className.includes("anchor"))) continue;
      const anchor: Element = {
        type: "element",
        tagName: "a",
        properties: { className: ["anchor"], href: `#${id}`, ariaLabel: "Link to this section" },
        children: [],
      };
      node.children.push(anchor);
    }
  };
}
