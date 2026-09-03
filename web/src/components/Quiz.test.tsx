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
  it("opens on a landing view with the title, description and a Start button", () => {
    render(<Quiz id="t" questions={questions} title="Quick check" description="Two ideas from this chapter." />);
    expect(screen.getByText("Quick check")).toBeTruthy();
    expect(screen.getByText("Two ideas from this chapter.")).toBeTruthy();
    expect(screen.queryByText("When do you write the check?")).toBeNull();
    fireEvent.click(screen.getByText("Start"));
    expect(screen.getByText("When do you write the check?")).toBeTruthy();
  });

  it("shows the explanation and marks a wrong answer", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("After the agent says it is done"));
    expect(screen.getByText(/only confirms/)).toBeTruthy();
    expect(screen.getByText("After the agent says it is done").closest("button")?.dataset.state).toBe("wrong");
  });

  it("marks a correct answer and disables further choices for that question", () => {
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    expect(screen.getByText("After the agent says it is done").closest("button")?.disabled).toBe(true);
  });

  it("shows one question at a time and advances with Next", () => {
    render(<Quiz id="t" questions={two} />);
    fireEvent.click(screen.getByText("Start"));
    expect(screen.queryByText("Second prompt")).toBeNull();
    fireEvent.click(screen.getByText("Before the agent starts"));
    fireEvent.click(screen.getByText("Next question"));
    expect(screen.queryByText("When do you write the check?")).toBeNull();
    expect(screen.getByText("Second prompt")).toBeTruthy();
    fireEvent.click(screen.getByText("Only choice"));
    fireEvent.click(screen.getByText("See result"));
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });

  it("replaces the title with the question counter while answering and numbers the options", () => {
    render(<Quiz id="t" questions={two} title="Quick check" />);
    fireEvent.click(screen.getByText("Start"));
    expect(screen.queryByText("Quick check")).toBeNull();
    expect(screen.getByText("Question 1 of 2")).toBeTruthy();
    const marks = Array.from(document.querySelectorAll(".quiz-n")).map((n) => n.textContent);
    expect(marks).toEqual(["1", "2"]);
    fireEvent.click(screen.getByText("After the agent says it is done"));
    expect(Array.from(document.querySelectorAll(".quiz-n")).map((n) => n.textContent)).toEqual(["✕", "2"]);
  });

  it("shows the question count next to the title", () => {
    render(<Quiz id="t" questions={two} title="Quick check" />);
    expect(screen.getByText("Quick check").textContent).toBe("Quick check · 2 questions");
  });

  it("shows the last result on the landing view and starts over from stored answers", () => {
    localStorage.setItem("quiz:t", JSON.stringify({ 0: 1 }));
    render(<Quiz id="t" questions={questions} />);
    expect(screen.getByText(/Last result: 1 \/ 1/)).toBeTruthy();
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("idle");
  });

  it("continues from the first unanswered question", () => {
    localStorage.setItem("quiz:t", JSON.stringify({ 0: 1 }));
    render(<Quiz id="t" questions={two} />);
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText("Second prompt")).toBeTruthy();
  });

  it("works when storage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
    render(<Quiz id="t" questions={questions} />);
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Before the agent starts"));
    expect(screen.getByText("Before the agent starts").closest("button")?.dataset.state).toBe("correct");
    Object.defineProperty(window, "localStorage", original);
  });
});
