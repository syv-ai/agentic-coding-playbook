export interface ChapterRef {
  book: string;
  slug: string;
}

/** "working-well/01-measure-success-first" → { book: "working-well", slug: "measure-success-first" } */
export function parseChapterId(id: string): ChapterRef {
  const [book, file] = id.split("/");
  const m = file?.match(/^\d{2}-(.+)$/);
  if (!book || !m) throw new Error(`Chapter id "${id}" must be "<book>/<NN>-<slug>" with a numeric prefix`);
  return { book, slug: m[1] };
}

/** "working-well/book" → "working-well" */
export function bookSlugFromId(id: string): string {
  return id.split("/")[0];
}

interface Ordered {
  id: string;
  data: { order: number };
}

export function sortChapters<T extends Ordered>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => a.data.order - b.data.order);
}

export function neighbours<T extends Ordered>(sorted: T[], id: string): { prev: T | undefined; next: T | undefined } {
  const i = sorted.findIndex((c) => c.id === id);
  return { prev: sorted[i - 1], next: sorted[i + 1] };
}
