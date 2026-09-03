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

  const meta = view === "questions" ? `question ${step + 1} of ${total}` : `${total} question${total === 1 ? "" : "s"}`;
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
    <Interactive className="quiz" title={title} meta={meta} description={view === "landing" ? description : undefined} action={action}>
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
              return (
                <button key={ci} type="button" className="quiz-choice" data-state={state} disabled={picked !== undefined} onClick={() => choose(ci)}>
                  {c.text}
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
        .quiz-progress { display: inline-flex; gap: 0.4rem; }
        .quiz-progress i { width: 0.55rem; height: 0.55rem; border-radius: 999px; background: var(--border); }
        .quiz-progress i[data-state="correct"] { background: var(--good); }
        .quiz-progress i[data-state="wrong"] { background: var(--bad); }
        .quiz-q { border: 0; padding: 0; margin: 0; }
        .quiz-q legend { font-weight: 600; margin-bottom: 0.6rem; padding: 0; }
        .quiz-choice { display: block; width: 100%; text-align: left; margin: 0.35rem 0; padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; cursor: pointer; }
        .quiz-choice:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-choice:disabled { cursor: default; }
        .quiz-choice[data-state="correct"] { background: var(--good); color: var(--bg); border-color: var(--good); }
        .quiz-choice[data-state="wrong"] { background: var(--bad); color: var(--bg); border-color: var(--bad); }
        .quiz-choice[data-state="reveal"] { border-color: var(--good); color: var(--good); }
        .quiz-after { margin-top: 0.9rem; }
        .quiz-explain { margin: 0 0 0.9rem; color: var(--text-muted); }
        .quiz-score { font-size: 1.6rem; font-weight: 600; margin: 0 0 0.25rem; }
      `}</style>
    </Interactive>
  );
}
