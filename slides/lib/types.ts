export interface Slide {
  title: string;
  content: string; // raw markdown
  html: string; // rendered HTML
  index: number;
}

export interface Module {
  slug: string;
  number: string;
  title: string;
  description: string;
  part: Part;
  slides: Slide[];
}

export interface Part {
  number: number;
  title: string;
  subtitle: string;
}
