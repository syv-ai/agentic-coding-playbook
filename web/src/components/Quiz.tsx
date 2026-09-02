import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";

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
  /** Landing-view heading. */
  title?: string;
  /** One or two sentences on what the questions cover. */
  description?: string;
}

type Answers = Record<number, number>;

type View = "landing" | "questions" | "result";

/** Landing view, then one question at a time, then the result. Answers persist in the browser between visits. */
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

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span>{title}</span>
        {view === "questions" && (
          <span className="quiz-progress" aria-label={`Question ${step + 1} of ${total}`}>
            {questions.map((_, i) => (
              <i key={i} data-state={answers[i] === undefined ? "todo" : questions[i].choices[answers[i]]?.correct ? "correct" : "wrong"} />
            ))}
          </span>
        )}
      </div>

      {view === "landing" ? (
        <div className="quiz-landing">
          {description && <p className="quiz-explain">{description}</p>}
          <p className="quiz-meta">{total} question{total === 1 ? "" : "s"}{complete ? ` · last result ${score} / ${total}` : answered ? ` · ${answered} answered` : ""}</p>
          <button type="button" className="quiz-btn" onClick={start}>{complete ? "Try again" : answered ? "Continue" : "Start"}</button>
        </div>
      ) : view === "result" ? (
        <div className="quiz-summary">
          <p className="quiz-score">{score} / {total}</p>
          <p className="quiz-explain">{score === total ? "All of them. On to the next chapter." : "Reset to try the ones you missed again."}</p>
          <button type="button" className="quiz-btn" onClick={reset}>Reset</button>
        </div>
      ) : (
        (() => {
          const q = questions[step];
          const picked = answers[step];
          return (
            <fieldset className="quiz-q">
              <legend>
                <span className="quiz-num">Question {step + 1} of {total}</span>
                {q.prompt}
              </legend>
              {q.choices.map((c, ci) => {
                const state = picked === undefined ? "idle" : ci === picked ? (c.correct ? "correct" : "wrong") : c.correct ? "reveal" : "idle";
                return (
                  <button key={ci} type="button" className="quiz-choice" data-state={state} disabled={picked !== undefined} onClick={() => choose(ci)}>
                    {c.text}
                  </button>
                );
              })}
              {picked !== undefined && (
                <div className="quiz-after">
                  <p className="quiz-explain">{q.choices[picked].explain}</p>
                  <button type="button" className="quiz-btn" onClick={advance}>
                    {step + 1 === total ? "See result" : "Next question"}
                  </button>
                </div>
              )}
            </fieldset>
          );
        })()
      )}

      <style>{`
        .quiz { margin: 1.5rem 0; }
        .quiz-head { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.75rem; }
        .quiz-progress { display: inline-flex; gap: 0.35rem; }
        .quiz-progress i { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--border); }
        .quiz-progress i[data-state="correct"] { background: var(--good); }
        .quiz-progress i[data-state="wrong"] { background: var(--bad); }
        .quiz-q { border: 0; padding: 0; margin: 0; }
        .quiz-q legend { font-weight: 600; margin-bottom: 0.6rem; padding: 0; }
        .quiz-num { display: block; font-weight: 400; font-size: 0.8rem; color: var(--text-faint); margin-bottom: 0.2rem; }
        .quiz-choice { display: block; width: 100%; text-align: left; margin: 0.35rem 0; padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; cursor: pointer; }
        .quiz-choice:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-choice:disabled { cursor: default; }
        .quiz-choice[data-state="correct"] { background: var(--good); color: var(--bg); border-color: var(--good); }
        .quiz-choice[data-state="wrong"] { background: var(--bad); color: var(--bg); border-color: var(--bad); }
        .quiz-choice[data-state="reveal"] { border-color: var(--good); color: var(--good); }
        .quiz-after { margin-top: 0.75rem; }
        .quiz-explain { margin: 0 0 0.75rem; color: var(--text-muted); }
        .quiz-btn { font: inherit; padding: 0.45rem 1rem; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-text); cursor: pointer; }
        .quiz-btn:hover { filter: brightness(1.08); }
        .quiz-score { font-size: 1.6rem; font-weight: 600; margin: 0 0 0.25rem; }
        .quiz-meta { margin: 0 0 0.9rem; font-size: 0.85rem; color: var(--text-faint); }
      `}</style>
    </div>
  );
}
