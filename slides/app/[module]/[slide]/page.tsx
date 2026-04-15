import { notFound } from "next/navigation";
import { getModule, getModuleSlugs } from "@/lib/markdown";
import { MODULE_META } from "@/lib/constants";
import SlideRenderer from "@/components/SlideRenderer";
import SlideNav from "@/components/SlideNav";
import KeyboardNav from "@/components/KeyboardNav";
import ProgressBar from "@/components/ProgressBar";

export async function generateStaticParams() {
  const params: { module: string; slide: string }[] = [];

  for (const slug of getModuleSlugs()) {
    const mod = await getModule(slug);
    if (!mod) continue;
    for (let i = 0; i < mod.slides.length; i++) {
      params.push({ module: slug, slide: String(i) });
    }
  }

  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string; slide: string }>;
}) {
  const { module: moduleSlug, slide: slideStr } = await params;
  const mod = await getModule(moduleSlug);
  if (!mod) return { title: "Not Found" };

  const slideIndex = parseInt(slideStr, 10);
  const slide = mod.slides[slideIndex];
  if (!slide) return { title: "Not Found" };

  return {
    title: `${mod.title} — ${slide.title}`,
  };
}

export default async function SlidePage({
  params,
}: {
  params: Promise<{ module: string; slide: string }>;
}) {
  const { module: moduleSlug, slide: slideStr } = await params;
  const mod = await getModule(moduleSlug);
  if (!mod) notFound();

  const slideIndex = parseInt(slideStr, 10);
  const slide = mod.slides[slideIndex];
  if (!slide) notFound();

  const prevHref = slideIndex > 0 ? `/${moduleSlug}/${slideIndex - 1}` : getPrevModuleLastSlide(moduleSlug);
  const nextHref = slideIndex < mod.slides.length - 1 ? `/${moduleSlug}/${slideIndex + 1}` : getNextModuleFirstSlide(moduleSlug);

  return (
    <div className="min-h-dvh bg-gray-950">
      <ProgressBar current={slideIndex} total={mod.slides.length} />
      <KeyboardNav prevHref={prevHref} nextHref={nextHref} overviewHref="/" />
      <SlideRenderer html={slide.html} title={slide.title} isTitle={slideIndex === 0} />
      <SlideNav
        prevHref={prevHref}
        nextHref={nextHref}
        current={slideIndex}
        total={mod.slides.length}
        moduleTitle={`${mod.number}. ${mod.title}`}
        overviewHref="/"
      />
    </div>
  );
}

function getPrevModuleLastSlide(currentSlug: string): string | null {
  const idx = MODULE_META.findIndex((m) => m.slug === currentSlug);
  if (idx <= 0) return null;
  const prevSlug = MODULE_META[idx - 1].slug;
  // We don't know the slide count here without async, so link to module overview
  // Actually, let's just return null for the first slide of first module
  return `/${prevSlug}/0`;
}

function getNextModuleFirstSlide(currentSlug: string): string | null {
  const idx = MODULE_META.findIndex((m) => m.slug === currentSlug);
  if (idx < 0 || idx >= MODULE_META.length - 1) return null;
  return `/${MODULE_META[idx + 1].slug}/0`;
}
