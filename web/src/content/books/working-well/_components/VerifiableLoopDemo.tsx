import { useState } from "react";

/**
 * Two loops side by side. Left: the agent iterates with no check and reports "done" each round;
 * defects accumulate unseen and surface at review. Right: the check exists first, so each round
 * either passes or names what failed. Same five rounds, same work; only the target differs.
 */
const ROUNDS = [
  { work: "Adds the endpoint", hidden: "returns 200 on invalid input", check: "fails: rejects invalid input" },
  { work: "Adds validation", hidden: "error body is not JSON", check: "fails: error body is JSON" },
  { work: "Fixes error body", hidden: "pagination off by one", check: "fails: last page has the right count" },
  { work: "Fixes pagination", hidden: "", check: "passes" },
  { work: "Refactors names", hidden: "", check: "passes" },
];

export default function VerifiableLoopDemo() {
  const [n, setN] = useState(0);
  const done = n >= ROUNDS.length;
  const hiddenSoFar = ROUNDS.slice(0, n).filter((r) => r.hidden).length;

  return (
    <div className="vl">
      <div className="vl-cols">
        <div className="vl-col">
          <div className="vl-head">No check</div>
          <ol>
            {ROUNDS.slice(0, n).map((r, i) => (
              <li key={i}>{r.work} <span className="vl-claim">“done”</span></li>
            ))}
          </ol>
          {done && <p className="vl-verdict vl-bad">At review: {ROUNDS.filter((r) => r.hidden).length} defects, all found late.</p>}
        </div>
        <div className="vl-col">
          <div className="vl-head">Check written first</div>
          <ol>
            {ROUNDS.slice(0, n).map((r, i) => (
              <li key={i}>{r.work} <span className={r.check === "passes" ? "vl-good" : "vl-warn"}>{r.check}</span></li>
            ))}
          </ol>
          {done && <p className="vl-verdict vl-good">At review: nothing the check didn't already say.</p>}
        </div>
      </div>
      <div className="vl-controls">
        <button type="button" onClick={() => setN(Math.min(ROUNDS.length, n + 1))} disabled={done}>Run one round</button>
        <button type="button" onClick={() => setN(0)} disabled={n === 0}>Reset</button>
        <span className="vl-status">{done ? "Five rounds run." : n === 0 ? "Same agent, same five rounds of work." : `${hiddenSoFar} defect${hiddenSoFar === 1 ? "" : "s"} hidden on the left so far.`}</span>
      </div>
      <style>{`
        .vl { border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.2rem; margin: 1.5rem 0; background: var(--bg-raised); }
        .vl-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .vl-head { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.4rem; }
        .vl ol { margin: 0; padding-left: 1.2rem; min-height: 8rem; }
        .vl li { margin-bottom: 0.3rem; }
        .vl-claim { color: var(--text-faint); }
        .vl-good { color: var(--good); }
        .vl-warn { color: var(--warn); }
        .vl-bad { color: var(--bad); }
        .vl-verdict { font-weight: 600; margin: 0.5rem 0 0; }
        .vl-controls { display: flex; gap: 0.6rem; align-items: center; margin-top: 1rem; flex-wrap: wrap; }
        .vl-controls button { font: inherit; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); cursor: pointer; }
        .vl-controls button:disabled { opacity: 0.5; cursor: default; }
        .vl-status { font-size: 0.9rem; color: var(--text-muted); }
        @media (max-width: 600px) { .vl-cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
