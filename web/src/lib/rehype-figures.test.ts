import { toHtml } from "hast-util-to-html";
import type { Root } from "hast";
import { rehypeFigures } from "./rehype-figures";

const visual = (id?: string) => ({
  type: "mdxJsxFlowElement",
  name: "Visual",
  attributes: id ? [{ type: "mdxJsxAttribute", name: "id", value: id }] : [],
  children: [],
});
const fig = (id: string) => ({ type: "mdxJsxTextElement", name: "Fig", attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }], children: [] });
const p = (...children: unknown[]) => ({ type: "element", tagName: "p", properties: {}, children });
const attrs = (n: any) => Object.fromEntries(n.attributes.map((a: any) => [a.name, a.value]));

describe("rehypeFigures", () => {
  it("numbers figures in document order and resolves references, forward ones included", () => {
    const tree = { type: "root", children: [p({ type: "text", value: "See " }, fig("loop"), { type: "text", value: "." }), visual("intro"), visual("loop")] } as unknown as Root;
    rehypeFigures()(tree);
    expect(attrs(tree.children[1]).n).toBe("1");
    expect(attrs(tree.children[2]).n).toBe("2");
    expect(toHtml(tree.children[0] as any)).toBe('<p>See <a class="fig-ref" href="#fig-loop">Fig. 2</a>.</p>');
  });

  it("numbers figures without ids too", () => {
    const tree = { type: "root", children: [visual(), visual("x")] } as unknown as Root;
    rehypeFigures()(tree);
    expect(attrs(tree.children[0]).n).toBe("1");
    expect(attrs(tree.children[1]).n).toBe("2");
  });

  it("fails the build on an unknown or duplicate id", () => {
    expect(() => rehypeFigures()({ type: "root", children: [p(fig("nope")), visual("x")] } as unknown as Root)).toThrow(/does not exist/);
    expect(() => rehypeFigures()({ type: "root", children: [visual("x"), visual("x")] } as unknown as Root)).toThrow(/share the id/);
  });
});
