import { h } from "hastscript";
import { toHtml } from "hast-util-to-html";
import type { Root } from "hast";
import { rehypeSlides } from "./rehype-slides";

function run(tree: Root): string {
  rehypeSlides()(tree);
  return toHtml(tree);
}

describe("rehypeSlides", () => {
  it("wraps each h2 and what follows in a section, and puts leading content in an intro section", () => {
    const tree = h(null, [
      h("p", "lead"),
      h("h2", { id: "why-it-holds" }, "Why it holds"),
      h("p", "one"),
      h("h2", { id: "what-it-changes" }, "What it changes"),
      h("ul", [h("li", "do")]),
    ]) as Root;
    expect(run(tree)).toBe(
      '<section class="slide" data-slide="intro"><p>lead</p></section>' +
        '<section class="slide" data-slide="why-it-holds" data-title="Why it holds" data-anchor="why-it-holds"><h2 id="why-it-holds">Why it holds</h2><p>one</p></section>' +
        '<section class="slide" data-slide="what-it-changes" data-title="What it changes" data-anchor="what-it-changes"><h2 id="what-it-changes">What it changes</h2><ul><li>do</li></ul></section>'
    );
  });

  it("splits a section at an hr and marks the continuation", () => {
    const tree = h(null, [h("h2", { id: "a" }, "A"), h("p", "1"), h("hr"), h("p", "2")]) as Root;
    expect(run(tree)).toBe(
      '<section class="slide" data-slide="a" data-title="A" data-anchor="a"><h2 id="a">A</h2><p>1</p></section>' +
        '<section class="slide" data-slide="a-2" data-title="A" data-anchor="a" data-continued><p>2</p></section>'
    );
  });

  it("drops an empty intro (whitespace only)", () => {
    const tree = h(null, [{ type: "text", value: "\n" }, h("h2", { id: "a" }, "A"), h("p", "1")]) as Root;
    expect(run(tree)).not.toContain('data-slide="intro"');
  });

  it("keeps non-element top-level nodes (MDX components) inside the current section", () => {
    const tree = {
      type: "root",
      children: [
        h("h2", { id: "a" }, "A"),
        { type: "mdxJsxFlowElement", name: "Quiz", attributes: [], children: [] },
      ],
    } as unknown as Root;
    rehypeSlides()(tree);
    const section = tree.children[0] as any;
    expect(section.tagName).toBe("section");
    expect(section.children.map((c: any) => c.type ?? c.tagName)).toEqual(["element", "mdxJsxFlowElement"]);
  });
});
