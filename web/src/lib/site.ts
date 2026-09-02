import { getCollection, type CollectionEntry } from "astro:content";
import { bookSlugFromId, parseChapterId, sortChapters } from "./chapters";

export type Book = CollectionEntry<"books"> & { slug: string };
/** A chapter entry plus its routing parts. `entry` is the untouched collection entry: pass that to render(), never the spread copy. */
export type Chapter = CollectionEntry<"chapters"> & { entry: CollectionEntry<"chapters">; book: string; slug: string };

export async function getBooks(): Promise<Book[]> {
  const books = await getCollection("books");
  return books.map((b) => ({ ...b, slug: bookSlugFromId(b.id) })).sort((a, b) => a.data.order - b.data.order);
}

/** Published chapters only; drafts and chapters in review are neither built nor listed. */
export async function getPublishedChapters(book?: string): Promise<Chapter[]> {
  const all = await getCollection("chapters", (c) => c.data.status === "published");
  const withRefs: Chapter[] = all.map((c) => ({ ...c, entry: c, ...parseChapterId(c.id) }));
  return sortChapters(book ? withRefs.filter((c) => c.book === book) : withRefs);
}

export async function getBook(slug: string): Promise<Book | undefined> {
  return (await getBooks()).find((b) => b.slug === slug);
}
