import Link from "next/link";
import { getAllModules } from "@/lib/markdown";
import { PARTS } from "@/lib/constants";

export default async function HomePage() {
  const modules = await getAllModules();

  return (
    <div className="min-h-dvh bg-gray-950 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Agentic Coding Workshop
          </h1>
          <p className="text-xl text-gray-400">
            From Zero to Hero &mdash; 14 Modules
          </p>
        </header>

        {PARTS.map((part) => {
          const partModules = modules.filter((m) => m.part.number === part.number);
          if (partModules.length === 0) return null;

          return (
            <section key={part.number} className="mb-12">
              <div className="mb-6">
                <span className="text-sm font-medium uppercase tracking-widest text-cyan-400">
                  Part {part.number}
                </span>
                <h2 className="mt-1 text-2xl font-bold text-white">{part.title}</h2>
                <p className="mt-1 text-gray-400">{part.subtitle}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {partModules.map((mod) => (
                  <Link
                    key={mod.slug}
                    href={`/${mod.slug}/0`}
                    className="group rounded-xl border border-white/10 bg-gray-900/50 p-5 transition-all hover:border-cyan-400/30 hover:bg-gray-900"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-sm font-bold text-cyan-400">
                        {mod.number}
                      </span>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {mod.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {mod.description}
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      {mod.slides.length} slides
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
