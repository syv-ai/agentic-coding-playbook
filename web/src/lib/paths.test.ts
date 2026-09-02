import { withBase, bookPath, chapterPath, deckPath } from "./paths";

describe("withBase", () => {
  it("joins base and path with exactly one slash and a trailing slash", () => {
    expect(withBase("/agentic-coding-playbook", "/working-well")).toBe("/agentic-coding-playbook/working-well/");
    expect(withBase("/agentic-coding-playbook/", "working-well/")).toBe("/agentic-coding-playbook/working-well/");
    expect(withBase("/", "/")).toBe("/");
  });
});

describe("chapter urls", () => {
  it("builds book, chapter and deck paths", () => {
    expect(bookPath("/b", "working-well")).toBe("/b/working-well/");
    expect(chapterPath("/b", "working-well", "measure-success-first")).toBe("/b/working-well/measure-success-first/");
    expect(deckPath("/b", "working-well", "measure-success-first")).toBe("/b/working-well/measure-success-first/deck/");
  });
});
