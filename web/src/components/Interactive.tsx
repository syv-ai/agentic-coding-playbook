import type { ReactNode } from "react";
import AutoHeight from "./AutoHeight";

interface Props {
  /** What the block is, in a few words. */
  title: string;
  /** "counter" renders the title small and muted, for "Question 2 of 3" while a block is active. */
  titleStyle?: "title" | "counter";
  /** Small muted suffix after the title: "3 questions", "round 2 of 5". */
  meta?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The primary control(s), right-aligned and vertically centred with the title. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * The common layout for every quiz and demo: header (title · meta, description | action) then body.
 * The body animates its height, so anything a block reveals or swaps slides the page instead of jumping it.
 * Styles live in global.css under `.ix-*` so Astro components can use the same classes.
 */
export default function Interactive({ title, titleStyle = "title", meta, description, action, children, className }: Props) {
  return (
    <section className={`ix${className ? ` ${className}` : ""}`}>
      <header className="ix-head">
        <div className="ix-lead">
          <h3 className={titleStyle === "counter" ? "ix-title ix-title--counter" : "ix-title"}>
            {title}
            {meta && <span className="ix-meta"> · {meta}</span>}
          </h3>
          {description && <p className="ix-desc">{description}</p>}
        </div>
        {action && <div className="ix-action">{action}</div>}
      </header>
      <div className="ix-body"><AutoHeight>{children}</AutoHeight></div>
    </section>
  );
}
