// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Quiz from "./Quiz";

const questions = [
  {
    prompt: "When do you write the check?",
    choices: [
      { text: "After the agent says it is done", explain: "Then the check only confirms what you already believe." },
      { text: "Before the agent starts", correct: true, explain: "The check is the target the loop optimises for." },
    ],
  },
];

const two = [
  ...questions,
  { prompt: "Second prompt", choices: [{ text: "Only choice", correct: true, explain: "Yes." }] },
];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Quiz", () => {
  it("shows the explanation and marks a wrong answer", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("After the agent says it is done"));
    expect(screen.getByText(/only confirms/)).toBeTruthy();
    expect(screen.getByText("After the agent says it is done").closest("button")?.dataset.state).toBe("wrong");
  });

  it("marks a correct answer and disables further choices for that question", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    expect(screen.getByText("After the agent says it is done").closest("button")?.disabled).toBe(true);
  });

  it("shows one question at a time and advances with Next", () => {
    render(<Quiz id="t" questions={two} />);
    expect(screen.queryByText("Second prompt")).toBeNull();
    fireEvent.click(screen.getByText("Before the agent starts"));
    fireEvent.click(screen.getByText("Next question"));
    expect(screen.queryByText("When do you write the check?")).toBeNull();
    expect(screen.getByText("Second prompt")).toBeTruthy();
    fireEvent.click(screen.getByText("Only choice"));
    fireEvent.click(screen.getByText("See result"));
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });

  it("restores answers from storage, shows the summary, and resets", () => {
    localStorage.setItem("quiz:t", JSON.stringify({ 0: 1 }));
    render(<Quiz id="t" questions={questions} />);
    expect(screen.getByText("1 / 1")).toBeTruthy();
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("idle");
  });

  it("works when storage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    Object.defineProperty(window, "localStorage", original);
  });
});
