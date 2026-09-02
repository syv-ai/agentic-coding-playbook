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
}

type Answers = Record<number, number>;

/** One question at a time. Answers persist in the browser; the summary shows once every question is answered. */
export default function Quiz({ id, questions }: Props) {
  const key = `quiz:${id}`;
  const [answers, setAnswers] = useState<Answers>(() => readJSON<Answers>(key, {}));
  const [step, setStep] = useState(() => {
    const first = questions.findIndex((_, i) => answers[i] === undefined);
    return first === -1 ? questions.length : first;
  });

  useEffect(() => {
    writeJSON(key, answers);
  }, [key, answers]);

  const total = questions.length;
  const score = questions.filter((q, i) => q.choices[answers[i]]?.correct).length;
  const done = step >= total;

  const choose = (c: number) => {
    if (answers[step] !== undefined) return;
    setAnswers({ ...answers, [step]: c });
  };
  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span>Check yourself</span>
        <span className="quiz-progress" aria-label={`Question ${Math.min(step + 1, total)} of ${total}`}>
          {questions.map((_, i) => (
            <i key={i} data-state={answers[i] === undefined ? "todo" : questions[i].choices[answers[i]]?.correct ? "correct" : "wrong"} />
          ))}
        </span>
      </div>

      {done ? (
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
                  <button type="button" className="quiz-btn" onClick={() => setStep(step + 1)}>
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
      `}</style>
    </div>
  );
}
