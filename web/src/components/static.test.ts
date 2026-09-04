import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Callout from "./Callout.astro";
import Source from "./Source.astro";
import Notes from "./Notes.astro";
import BookOnly from "./BookOnly.astro";
import DeckOnly from "./DeckOnly.astro";
import Search from "./Search.astro";

describe("static components", () => {
  it("Callout renders its kind and label", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Callout, { props: { kind: "tension" }, slots: { default: "Both hold." } });
    expect(html).toContain('data-kind="tension"');
    expect(html).toContain("Active tension");
    expect(html).toContain("Both hold.");
  });

  it("Source links the work title and marks paraphrases", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Source, {
      props: { who: "Fred Brooks", work: "No Silver Bullet", year: 1986, href: "https://example.org", provenance: "read" },
      slots: { default: "<q>quoted</q>" },
    });
    expect(html).toContain("Fred Brooks");
    expect(html).toContain('href="https://example.org"');
    expect(html).not.toContain("example.org</a>"); // the work title is the link, not the bare URL
    expect(html).not.toContain("Paraphrased");
    const stated = await c.renderToString(Source, {
      props: { who: "A", work: "B", provenance: "stated" },
      slots: { default: "<q>x</q>" },
    });
    expect(stated).toContain("Paraphrased");
  });

  it("Notes, BookOnly and DeckOnly carry their data attributes", async () => {
    const c = await AstroContainer.create();
    expect(await c.renderToString(Notes, { slots: { default: "n" } })).toContain("data-notes");
    expect(await c.renderToString(BookOnly, { slots: { default: "b" } })).toContain("data-book-only");
    expect(await c.renderToString(DeckOnly, { slots: { default: "d" } })).toContain("data-deck-only");
  });

  it("Notes and DeckOnly stay out of the search index; Search renders a trigger and a dialog", async () => {
    const c = await AstroContainer.create();
    expect(await c.renderToString(Notes, { slots: { default: "n" } })).toContain("data-pagefind-ignore");
    expect(await c.renderToString(DeckOnly, { slots: { default: "d" } })).toContain("data-pagefind-ignore");
    const html = await c.renderToString(Search);
    expect(html).toContain("data-search-trigger");
    expect(html).toContain("<dialog");
    expect(html).toContain("data-search-input");
  });
});
