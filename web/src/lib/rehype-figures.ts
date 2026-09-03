import type { Root } from "hast";

/**
 * Number every <Visual> in document order and resolve <Fig id="..." /> in prose to "Fig. n" links.
 * Runs on the MDX tree before it compiles, so the numbers are fixed at build time, hold in both the
 * book and the deck, and forward references work. An unknown id fails the build.
 */
interface JsxAttr { type: "mdxJsxAttribute"; name: string; value?: unknown }
interface JsxNode { type: string; name?: string; attributes?: JsxAttr[]; children?: unknown[] }

const isJsx = (n: unknown): n is JsxNode => {
  const t = (n as { type?: string })?.type;
  return t === "mdxJsxFlowElement" || t === "mdxJsxTextElement";
};
const attr = (n: JsxNode, name: string) => n.attributes?.find((a) => a.type === "mdxJsxAttribute" && a.name === name);
const stringValue = (a: JsxAttr | undefined): string | undefined => (typeof a?.value === "string" ? a.value : undefined);

function walk(node: { children?: unknown[] }, visit: (n: JsxNode, parent: { children: unknown[] }, index: number) => void) {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as JsxNode;
    if (isJsx(child)) visit(child, node as { children: unknown[] }, i);
    walk(child as { children?: unknown[] }, visit);
  }
}

export function rehypeFigures() {
  return (tree: Root) => {
    const numbers = new Map<string, number>();
    let count = 0;
    walk(tree, (n) => {
      if (n.name !== "Visual") return;
      count += 1;
      (n.attributes ??= []).push({ type: "mdxJsxAttribute", name: "n", value: String(count) });
      const id = stringValue(attr(n, "id"));
      if (id) {
        if (numbers.has(id)) throw new Error(`Two figures share the id "${id}"`);
        numbers.set(id, count);
      }
    });
    walk(tree, (n, parent, index) => {
      if (n.name !== "Fig") return;
      const id = stringValue(attr(n, "id"));
      if (!id) throw new Error(`<Fig /> needs an id`);
      const number = numbers.get(id);
      if (!number) throw new Error(`<Fig id="${id}" /> refers to a figure that does not exist; give a <Visual> that id`);
      parent.children[index] = {
        type: "element",
        tagName: "a",
        properties: { className: ["fig-ref"], href: `#fig-${id}` },
        children: [{ type: "text", value: `Fig. ${number}` }],
      };
    });
  };
}
