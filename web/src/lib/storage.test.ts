// @vitest-environment jsdom
import { readJSON, writeJSON } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips JSON", () => {
    writeJSON("k", { a: 1 });
    expect(readJSON("k", null)).toEqual({ a: 1 });
  });

  it("returns the fallback for missing or corrupt values", () => {
    expect(readJSON("missing", "fb")).toBe("fb");
    localStorage.setItem("bad", "{not json");
    expect(readJSON("bad", "fb")).toBe("fb");
  });

  it("never throws when localStorage is unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    expect(() => writeJSON("k", 1)).not.toThrow();
    expect(readJSON("k", "fb")).toBe("fb");
    Object.defineProperty(window, "localStorage", original);
  });
});
