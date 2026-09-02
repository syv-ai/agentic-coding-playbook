import { parseChapterId, bookSlugFromId, sortChapters, neighbours } from "./chapters";

describe("parseChapterId", () => {
  it("splits the collection id into book and chapter slug, dropping the numeric prefix", () => {
    expect(parseChapterId("working-well/01-measure-success-first")).toEqual({
      book: "working-well",
      slug: "measure-success-first",
    });
  });
  it("throws on ids without a numeric prefix", () => {
    expect(() => parseChapterId("working-well/intro")).toThrow(/numeric prefix/);
  });
});

describe("bookSlugFromId", () => {
  it("takes the folder name from a book.yaml entry id", () => {
    expect(bookSlugFromId("working-well/book")).toBe("working-well");
  });
});

describe("sortChapters and neighbours", () => {
  const chapters = [
    { id: "b/03-c", data: { order: 3 } },
    { id: "b/01-a", data: { order: 1 } },
    { id: "b/02-b", data: { order: 2 } },
  ];
  it("sorts by order", () => {
    expect(sortChapters(chapters).map((c) => c.id)).toEqual(["b/01-a", "b/02-b", "b/03-c"]);
  });
  it("finds previous and next, with undefined at the ends", () => {
    const sorted = sortChapters(chapters);
    expect(neighbours(sorted, "b/01-a")).toEqual({ prev: undefined, next: sorted[1] });
    expect(neighbours(sorted, "b/02-b")).toEqual({ prev: sorted[0], next: sorted[2] });
    expect(neighbours(sorted, "b/03-c")).toEqual({ prev: sorted[1], next: undefined });
  });
});
