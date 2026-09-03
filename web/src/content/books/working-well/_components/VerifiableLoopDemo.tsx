import { useState } from "react";
import Interactive from "../../../../components/Interactive";

/**
 * The same five rounds of agent work, run twice: once with nothing but the agent's own
 * verdict to stop the loop, once with a check written before round one. Each click runs
 * one round and shows what each loop reports. The defects are identical on both sides;
 * only when they become visible differs.
 */
const ROUNDS = [
  { work: "adds the endpoint", defect: "returns 200 on invalid input", check: "rejects invalid input" },
  { work: "adds input validation", defect: "error body is not JSON", check: "error body is JSON" },
  { work: "fixes the error body", defect: "last page is off by one", check: "last page has the right count" },
  { work: "fixes pagination", defect: "", check: "all checks pass" },
  { work: "renames for clarity", defect: "", check: "all checks pass" },
];
const HIDDEN = ROUNDS.filter((r) => r.defect).length;

export default function VerifiableLoopDemo() {
  const [n, setN] = useState(0);
  const round = ROUNDS[n - 1];
  const finished = n >= ROUNDS.length;

  const action = (
    <>
      {n > 0 && <button type="button" className="btn" onClick={() => setN(0)}>Reset</button>}
      <button type="button" className="btn btn-primary" onClick={() => setN(n + 1)} disabled={finished}>
        {n === 0 ? "Run round 1" : finished ? "Finished" : `Run round ${n + 1}`}
      </button>
    </>
  );

  return (
    <Interactive
      className="vl"
      title="Five rounds, two stop conditions"
      meta={n > 0 ? `round ${n} of ${ROUNDS.length}` : undefined}
      description="The agent does the same work in both columns. Only what stops the loop differs."
      action={action}
    >
      {round && (
        <>
          <p className="vl-work">The agent <b>{round.work}</b>.</p>
          <div className="vl-cols">
            <div className="vl-col">
              <div className="vl-label">Loop stops when the agent says so</div>
              <ol className="vl-dots" aria-hidden="true">
                {ROUNDS.map((_, i) => <li key={i} data-state={i < n ? "claim" : "todo"} />)}
              </ol>
              <p className="vl-report"><span className="vl-claim">“Done.”</span> Nothing else to go on.</p>
              {finished && <p className="vl-verdict vl-bad">At review: {HIDDEN} defects, all present since rounds 1 to 3.</p>}
            </div>
            <div className="vl-col">
              <div className="vl-label">Loop stops when the check passes</div>
              <ol className="vl-dots" aria-hidden="true">
                {ROUNDS.map((r, i) => <li key={i} data-state={i < n ? (r.defect ? "fail" : "pass") : "todo"} />)}
              </ol>
              <p className="vl-report">
                {round.defect
                  ? <><span className="vl-warn">Check fails:</span> {round.check}. Back to work.</>
                  : <><span className="vl-good">Check passes.</span> {finished ? "Done means done." : "Free to refine."}</>}
              </p>
              {finished && <p className="vl-verdict vl-good">At review: nothing the check had not already caught.</p>}
            </div>
          </div>
        </>
      )}
      <style>{`
        .vl-work { margin: 0 0 1.25rem; }
        .vl-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
        .vl-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem; }
        .vl-dots { list-style: none; display: flex; gap: 0.4rem; padding: 0; margin: 0 0 0.9rem; }
        .vl-dots li { width: 0.7rem; height: 0.7rem; border-radius: 999px; background: var(--border); transition: background 0.3s; }
        .vl-dots li[data-state="claim"] { background: var(--text-faint); }
        .vl-dots li[data-state="fail"] { background: var(--warn); }
        .vl-dots li[data-state="pass"] { background: var(--good); }
        .vl-report { margin: 0; min-height: 3.2em; }
        .vl-claim { color: var(--text-faint); font-style: italic; }
        .vl-good { color: var(--good); font-weight: 600; }
        .vl-warn { color: var(--warn); font-weight: 600; }
        .vl-bad { color: var(--bad); }
        .vl-verdict { font-weight: 600; margin: 0.9rem 0 0; }
        @media (max-width: 600px) { .vl-cols { grid-template-columns: 1fr; } }
      `}</style>
    </Interactive>
  );
}
