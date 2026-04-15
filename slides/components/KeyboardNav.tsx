"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface KeyboardNavProps {
  prevHref: string | null;
  nextHref: string | null;
  overviewHref: string;
}

export default function KeyboardNav({ prevHref, nextHref, overviewHref }: KeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          if (nextHref) router.push(nextHref);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (prevHref) router.push(prevHref);
          break;
        case "Escape":
          e.preventDefault();
          router.push(overviewHref);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevHref, nextHref, overviewHref, router]);

  return null;
}
