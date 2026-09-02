import { h } from "hastscript";
import { toHtml } from "hast-util-to-html";
import { toString } from "hast-util-to-string";
import type { Root } from "hast";
import { rehypeHeadingAnchors } from "./rehype-heading-anchors";

describe("rehypeHeadingAnchors", () => {
  it("appends an empty anchor to h2 and h3 with ids and leaves other nodes alone", () => {
    const tree = h(null, [h("h2", { id: "a" }, "A"), h("h3", { id: "b" }, "B"), h("h2", "no id"), h("p", "x")]) as Root;
    rehypeHeadingAnchors()(tree);
    expect(toHtml(tree)).toBe(
      '<h2 id="a">A<a class="anchor" href="#a" aria-label="Link to this section"></a></h2>' +
        '<h3 id="b">B<a class="anchor" href="#b" aria-label="Link to this section"></a></h3>' +
        "<h2>no id</h2><p>x</p>"
    );
  });

  it("does not change the heading's text content", () => {
    const tree = h(null, [h("h2", { id: "a" }, "Why it holds")]) as Root;
    rehypeHeadingAnchors()(tree);
    expect(toString(tree.children[0] as any)).toBe("Why it holds");
  });

  it("is idempotent", () => {
    const tree = h(null, [h("h2", { id: "a" }, "A")]) as Root;
    rehypeHeadingAnchors()(tree);
    rehypeHeadingAnchors()(tree);
    expect(toHtml(tree).match(/class="anchor"/g)?.length).toBe(1);
  });
});
