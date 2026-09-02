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

export default function Quiz({ id, questions }: Props) {
  const key = `quiz:${id}`;
  const [answers, setAnswers] = useState<Answers>(() => readJSON<Answers>(key, {}));

  useEffect(() => {
    writeJSON(key, answers);
  }, [key, answers]);

  const choose = (q: number, c: number) => {
    if (answers[q] !== undefined) return;
    setAnswers({ ...answers, [q]: c });
  };
  const reset = () => setAnswers({});
  const score = questions.filter((q, i) => q.choices[answers[i]]?.correct).length;
  const done = Object.keys(answers).length === questions.length;

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span className="quiz-label">Check yourself</span>
        {done && <span className="quiz-score">{score} / {questions.length}</span>}
      </div>
      {questions.map((q, qi) => {
        const picked = answers[qi];
        return (
          <fieldset key={qi} className="quiz-q">
            <legend>{q.prompt}</legend>
            {q.choices.map((c, ci) => {
              const state = picked === undefined ? "idle" : ci === picked ? (c.correct ? "correct" : "wrong") : c.correct && picked !== undefined ? "reveal" : "idle";
              return (
                <button key={ci} type="button" data-state={state} disabled={picked !== undefined} onClick={() => choose(qi, ci)}>
                  {c.text}
                </button>
              );
            })}
            {picked !== undefined && <p className="quiz-explain">{q.choices[picked].explain}</p>}
          </fieldset>
        );
      })}
      {Object.keys(answers).length > 0 && (
        <button type="button" className="quiz-reset" onClick={reset}>
          Reset
        </button>
      )}
      <style>{`
        .quiz { border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.2rem; margin: 1.5rem 0; background: var(--bg-raised); }
        .quiz-head { display: flex; justify-content: space-between; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.5rem; }
        .quiz-q { border: 0; padding: 0; margin: 0 0 1rem; }
        .quiz-q legend { font-weight: 600; margin-bottom: 0.5rem; padding: 0; }
        .quiz-q button { display: block; width: 100%; text-align: left; margin: 0.3rem 0; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; cursor: pointer; }
        .quiz-q button:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-q button:disabled { cursor: default; }
        .quiz-q button[data-state="correct"] { background: var(--good); color: var(--bg); border-color: var(--good); }
        .quiz-q button[data-state="wrong"] { background: var(--bad); color: var(--bg); border-color: var(--bad); }
        .quiz-q button[data-state="reveal"] { border-color: var(--good); }
        .quiz-explain { margin: 0.5rem 0 0; color: var(--text-muted); }
        .quiz-reset { font: inherit; font-size: 0.85rem; background: none; border: 0; color: var(--link); cursor: pointer; padding: 0; }
      `}</style>
    </div>
  );
}
