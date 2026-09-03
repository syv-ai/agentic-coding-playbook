import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";
import Interactive from "./Interactive";

export interface Choice {
  text: string;
  correct?: boolean;
  explain: string;
}
export interface Question {
  prompt: string;
  choices: Choice[];
}
interface Props {
  id: string;
  questions: Question[];
  /** Heading of the block. */
  title?: string;
  /** One or two sentences on what the questions cover. */
  description?: string;
}

type Answers = Record<number, number>;
type View = "landing" | "questions" | "result";

/** Landing, then one question at a time, then the result. Answers persist in the browser between visits. */
export default function Quiz({ id, questions, title = "Test your understanding", description }: Props) {
  const key = `quiz:${id}`;
  const [answers, setAnswers] = useState<Answers>(() => readJSON<Answers>(key, {}));
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState(0);

  useEffect(() => {
    writeJSON(key, answers);
  }, [key, answers]);

  const total = questions.length;
  const answered = questions.filter((_, i) => answers[i] !== undefined).length;
  const score = questions.filter((q, i) => q.choices[answers[i]]?.correct).length;
  const complete = answered === total;

  const start = () => {
    if (complete) setAnswers({});
    setStep(complete ? 0 : questions.findIndex((_, i) => answers[i] === undefined));
    setView("questions");
  };
  const choose = (c: number) => {
    if (answers[step] !== undefined) return;
    setAnswers({ ...answers, [step]: c });
  };
  const advance = () => {
    if (step + 1 >= total) setView("result");
    else setStep(step + 1);
  };
  const reset = () => {
    setAnswers({});
    setStep(0);
    setView("questions");
  };

  // While answering, the header becomes the question counter; the block title returns on the result view.
  const headTitle = view === "questions" ? `Question ${step + 1} of ${total}` : title;
  const meta = view === "questions" ? undefined : `${total} question${total === 1 ? "" : "s"}`;
  const action =
    view === "landing" ? (
      <button type="button" className="btn btn-primary" onClick={start}>{complete ? "Try again" : answered ? "Continue" : "Start"}</button>
    ) : view === "result" ? (
      <button type="button" className="btn" onClick={reset}>Try again</button>
    ) : (
      <span className="quiz-progress" aria-label={`Question ${step + 1} of ${total}`}>
        {questions.map((_, i) => (
          <i key={i} data-state={answers[i] === undefined ? "todo" : questions[i].choices[answers[i]]?.correct ? "correct" : "wrong"} />
        ))}
      </span>
    );

  return (
    <Interactive className="quiz" title={headTitle} titleStyle={view === "questions" ? "counter" : "title"} meta={meta} description={view === "landing" ? description : undefined} action={action}>
      {view === "landing" && complete && <p className="quiz-explain">Last result: {score} / {total}.</p>}

      {view === "result" && (
        <div className="quiz-summary">
          <p className="quiz-score">{score} / {total}</p>
          <p className="quiz-explain">{score === total ? "All of them. On to the next chapter." : "Try again to have another go at the ones you missed."}</p>
        </div>
      )}

      {view === "questions" && (() => {
        const q = questions[step];
        const picked = answers[step];
        return (
          <fieldset className="quiz-q">
            <legend>{q.prompt}</legend>
            {q.choices.map((c, ci) => {
              const state = picked === undefined ? "idle" : ci === picked ? (c.correct ? "correct" : "wrong") : c.correct ? "reveal" : "idle";
              const mark = state === "correct" ? "✓" : state === "wrong" ? "✕" : String(ci + 1);
              return (
                <button key={ci} type="button" className="quiz-choice" data-state={state} disabled={picked !== undefined} onClick={() => choose(ci)}>
                  <span className="quiz-n" aria-hidden="true">{mark}</span>
                  <span className="quiz-text">{c.text}</span>
                </button>
              );
            })}
            {picked !== undefined && (
              <div className="quiz-after">
                <p className="quiz-explain">{q.choices[picked].explain}</p>
                <button type="button" className="btn btn-primary" onClick={advance}>
                  {step + 1 === total ? "See result" : "Next question"}
                </button>
              </div>
            )}
          </fieldset>
        );
      })()}

      <style>{`
        .quiz .quiz-progress { display: inline-flex; gap: 0.4rem; }
        .quiz .quiz-progress i { width: 0.55rem; height: 0.55rem; border-radius: 999px; background: var(--border); }
        .quiz .quiz-progress i[data-state="correct"] { background: var(--good); }
        .quiz .quiz-progress i[data-state="wrong"] { background: var(--bad); }
        .quiz .quiz-q { border: 0; padding: 0; margin: 0; }
        .quiz .quiz-q legend { font-weight: 600; font-size: 1.05rem; margin-bottom: 1.1rem; padding: 0; }
        /* Options are a numbered list, not buttons in boxes: the number carries the state. */
        .quiz .quiz-choice { display: grid; grid-template-columns: 1.75rem 1fr; align-items: baseline; gap: 0.9rem; width: 100%; text-align: left; margin: 0; padding: 0.65rem 0; border: 0; border-radius: 0; background: none; color: var(--text); font: inherit; cursor: pointer; }
        .quiz .quiz-choice + .quiz-choice { margin-top: 0.35rem; }
        .quiz .quiz-n { display: inline-grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 999px; border: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted); transition: background 0.2s, border-color 0.2s, color 0.2s; }
        .quiz .quiz-choice:hover:not(:disabled) .quiz-n { border-color: var(--accent); color: var(--accent); }
        .quiz .quiz-choice:hover:not(:disabled) .quiz-text { color: var(--accent); }
        .quiz .quiz-choice:disabled { cursor: default; }
        .quiz .quiz-choice[data-state="correct"] .quiz-n { background: var(--good); border-color: var(--good); color: var(--bg); }
        .quiz .quiz-choice[data-state="wrong"] .quiz-n { background: var(--bad); border-color: var(--bad); color: var(--bg); }
        .quiz .quiz-choice[data-state="reveal"] .quiz-n { border-color: var(--good); color: var(--good); }
        .quiz .quiz-choice[data-state="wrong"] .quiz-text { color: var(--text-muted); text-decoration: line-through; text-decoration-color: var(--bad); }
        .quiz .quiz-choice[data-state="correct"] .quiz-text, .quiz .quiz-choice[data-state="reveal"] .quiz-text { color: var(--good); }
        .quiz .quiz-choice:disabled[data-state="idle"] .quiz-text { color: var(--text-muted); }
        .quiz .quiz-after { margin-top: 1.5rem; }
        .quiz .quiz-explain { margin: 0 0 1.25rem; color: var(--text-muted); }
        .quiz .quiz-score { font-size: 1.6rem; font-weight: 600; margin: 0 0 0.35rem; }
      `}</style>
    </Interactive>
  );
}
