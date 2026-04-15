"use client";

import Link from "next/link";

interface SlideNavProps {
  prevHref: string | null;
  nextHref: string | null;
  current: number;
  total: number;
  moduleTitle: string;
  overviewHref: string;
}

export default function SlideNav({
  prevHref,
  nextHref,
  current,
  total,
  moduleTitle,
  overviewHref,
}: SlideNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/10 bg-gray-950/90 px-6 py-3 backdrop-blur-sm">
      <Link
        href={overviewHref}
        className="text-sm text-gray-400 transition-colors hover:text-white"
      >
        {moduleTitle}
      </Link>

      <div className="flex items-center gap-4">
        {prevHref ? (
          <Link
            href={prevHref}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Previous slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 12L6 8L10 4" />
            </svg>
          </Link>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center text-gray-600">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 12L6 8L10 4" />
            </svg>
          </span>
        )}

        <span className="min-w-[4rem] text-center text-sm tabular-nums text-gray-400">
          {current + 1} / {total}
        </span>

        {nextHref ? (
          <Link
            href={nextHref}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Next slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4L10 8L6 12" />
            </svg>
          </Link>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center text-gray-600">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4L10 8L6 12" />
            </svg>
          </span>
        )}
      </div>

      <span className="text-xs text-gray-500">
        <kbd className="rounded border border-gray-700 px-1.5 py-0.5">&#8592;</kbd>{" "}
        <kbd className="rounded border border-gray-700 px-1.5 py-0.5">&#8594;</kbd>{" "}
        navigate &middot;{" "}
        <kbd className="rounded border border-gray-700 px-1.5 py-0.5">esc</kbd>{" "}
        overview
      </span>
    </nav>
  );
}
