/** Join the site base and a path: one slash between, one trailing slash. */
export function withBase(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return p ? `${b}/${p}/` : `${b}/` || "/";
}

export const bookPath = (base: string, book: string) => withBase(base, book);
export const chapterPath = (base: string, book: string, chapter: string) => withBase(base, `${book}/${chapter}`);
export const deckPath = (base: string, book: string, chapter: string) => withBase(base, `${book}/${chapter}/deck`);

/** The site base at runtime (Astro injects it). */
export const BASE: string = import.meta.env.BASE_URL ?? "/";
