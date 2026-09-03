/**
 * Every chapter demo must use the shared Interactive layout. This reads the source of each
 * island under a chapter's _components/ folder and fails if it does not import Interactive.
 */
const demos = import.meta.glob("./books/*/_components/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("chapter demos", () => {
  it("exist", () => {
    expect(Object.keys(demos).length).toBeGreaterThan(0);
  });

  for (const [file, source] of Object.entries(demos)) {
    it(`${file} wraps itself in Interactive`, () => {
      expect(source).toMatch(/import Interactive from ["'].*\/components\/Interactive["']/);
      expect(source).toMatch(/<Interactive[\s>]/);
    });
  }
});
