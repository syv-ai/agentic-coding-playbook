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

  it("restores answers from storage and resets", () => {
    localStorage.setItem("quiz:t", JSON.stringify({ 0: 1 }));
    render(<Quiz id="t" questions={questions} />);
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
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
