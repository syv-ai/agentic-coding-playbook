import type { Element, ElementContent, Root, RootContent } from "hast";
import { toString } from "hast-util-to-string";

/**
 * Wrap a chapter's top-level nodes into <section class="slide"> groups:
 * one per h2, split again at each hr, plus an "intro" section for content before the first h2.
 * Both the book layout and the deck layout consume these sections.
 */
export function rehypeSlides() {
  return (tree: Root) => {
    const out: RootContent[] = [];
    let current: Element | null = null;
    let title = "";
    let anchor = "";
    let splitCount = 0;

    const open = (props: Record<string, unknown>): Element => {
      const section: Element = { type: "element", tagName: "section", properties: { className: ["slide"], ...props }, children: [] };
      out.push(section);
      return section;
    };
    const isBlank = (n: RootContent) => n.type === "text" && n.value.trim() === "";

    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        title = toString(node);
        anchor = String(node.properties?.id ?? "");
        splitCount = 0;
        current = open({ dataSlide: anchor || title, dataTitle: title, dataAnchor: anchor });
        current.children.push(node as ElementContent);
        continue;
      }
      if (node.type === "element" && node.tagName === "hr" && current) {
        splitCount += 1;
        current = open({ dataSlide: `${anchor || title}-${splitCount + 1}`, dataTitle: title, dataAnchor: anchor, dataContinued: true });
        continue;
      }
      if (!current) {
        if (isBlank(node)) continue;
        current = open({ dataSlide: "intro" });
      }
      // A markdown/MDX body never contains a doctype, so every remaining node is valid element content.
      current.children.push(node as ElementContent);
    }
    tree.children = out;
  };
}
