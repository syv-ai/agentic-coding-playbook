import { useState } from "react";

/**
 * The same five rounds of agent work, run twice: once with nothing but the agent's own
 * verdict to stop the loop, once with a check written before round one. Each click runs
 * one round and shows what each loop reports. The defects are identical on both sides;
 * only when they become visible differs.
 */
const ROUNDS = [
  { work: "Adds the endpoint", defect: "returns 200 on invalid input", check: "Rejects invalid input" },
  { work: "Adds input validation", defect: "error body is not JSON", check: "Error body is JSON" },
  { work: "Fixes the error body", defect: "last page is off by one", check: "Last page has the right count" },
  { work: "Fixes pagination", defect: "", check: "All checks pass" },
  { work: "Renames for clarity", defect: "", check: "All checks pass" },
];
const HIDDEN = ROUNDS.filter((r) => r.defect).length;

export default function VerifiableLoopDemo() {
  const [n, setN] = useState(0);
  const round = ROUNDS[n - 1];
  const finished = n >= ROUNDS.length;
  const caught = ROUNDS.slice(0, n).filter((r) => r.defect).length;

  return (
    <div className="vl">
      <div className="vl-head">
        <span>{n === 0 ? "Not started" : `Round ${n} of ${ROUNDS.length}`}</span>
        <span className="vl-controls">
          <button type="button" onClick={() => setN(n + 1)} disabled={finished}>
            {n === 0 ? "Run round 1" : finished ? "Finished" : `Run round ${n + 1}`}
          </button>
          <button type="button" className="vl-ghost" onClick={() => setN(0)} disabled={n === 0}>Reset</button>
        </span>
      </div>

      <p className="vl-work">{round ? <>The agent <b>{round.work.toLowerCase()}</b>.</> : "Same agent, same task, two ways of deciding when it is done."}</p>

      <div className="vl-cols">
        <div className="vl-col">
          <div className="vl-label">Loop stops when the agent says so</div>
          <ol className="vl-dots" aria-hidden="true">
            {ROUNDS.map((_, i) => <li key={i} data-state={i < n ? "claim" : "todo"} />)}
          </ol>
          <p className="vl-report">
            {round ? <><span className="vl-claim">“Done.”</span> Nothing else to go on.</> : <span className="vl-faint">Waiting.</span>}
          </p>
          {finished && <p className="vl-verdict vl-bad">At review: {HIDDEN} defects. All three were there since rounds 1 to 3.</p>}
        </div>
        <div className="vl-col">
          <div className="vl-label">Loop stops when the check passes</div>
          <ol className="vl-dots" aria-hidden="true">
            {ROUNDS.map((r, i) => <li key={i} data-state={i < n ? (r.defect ? "fail" : "pass") : "todo"} />)}
          </ol>
          <p className="vl-report">
            {round ? (
              round.defect ? <><span className="vl-warn">Check fails:</span> {round.check.toLowerCase()}. Back to work.</> : <><span className="vl-good">Check passes.</span> {n < ROUNDS.length ? "Free to refine." : "Done means done."}</>
            ) : <span className="vl-faint">Check written. Waiting.</span>}
          </p>
          {finished && <p className="vl-verdict vl-good">At review: nothing the check had not already caught. {caught} defects fixed in the round after they appeared.</p>}
        </div>
      </div>

      <style>{`
        .vl { margin: 1.5rem 0; }
        .vl-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .vl-controls { display: inline-flex; gap: 0.5rem; }
        .vl-controls button { font: inherit; font-size: 0.85rem; text-transform: none; letter-spacing: 0; padding: 0.4rem 0.95rem; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-text); cursor: pointer; }
        .vl-controls .vl-ghost { background: none; color: var(--text); border-color: var(--border); }
        .vl-controls button:disabled { opacity: 0.45; cursor: default; }
        .vl-work { margin: 1rem 0 0.75rem; min-height: 1.6em; }
        .vl-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .vl-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem; }
        .vl-dots { list-style: none; display: flex; gap: 0.4rem; padding: 0; margin: 0 0 0.6rem; }
        .vl-dots li { width: 0.7rem; height: 0.7rem; border-radius: 999px; background: var(--border); transition: background 0.3s; }
        .vl-dots li[data-state="claim"] { background: var(--text-faint); }
        .vl-dots li[data-state="fail"] { background: var(--warn); }
        .vl-dots li[data-state="pass"] { background: var(--good); }
        .vl-report { margin: 0; min-height: 3.2em; }
        .vl-claim { color: var(--text-faint); font-style: italic; }
        .vl-faint { color: var(--text-faint); }
        .vl-good { color: var(--good); font-weight: 600; }
        .vl-warn { color: var(--warn); font-weight: 600; }
        .vl-bad { color: var(--bad); }
        .vl-verdict { font-weight: 600; margin: 0.5rem 0 0; }
        @media (max-width: 600px) { .vl-cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
