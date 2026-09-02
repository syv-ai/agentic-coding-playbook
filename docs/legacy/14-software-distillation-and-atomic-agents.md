# Module 14: Software Distillation and Atomic Agents

## The Problem with Big Prompts and Big Agents

There's a natural tendency when starting with agentic coding to throw everything at one agent in one conversation. You describe the whole feature, hand over the full context, and let the agent figure it out. For small tasks, this works fine. For anything complex, it starts to fall apart.

The agent drifts. It forgets constraints mentioned earlier. It conflates separate concerns. It produces code that technically satisfies the request but mixes responsibilities in ways that make the result hard to review, hard to test, and hard to maintain.

This isn't a model limitation you can prompt your way out of. It's an architectural problem. The solution is decomposition: breaking work into smaller, more focused pieces and using the right size of intelligence for each one.

Two ideas have emerged in 2026 that formalize this thinking: **atomic agents** (single-responsibility, focused workers with clear contracts) and **software distillation** (using powerful models to generate knowledge and patterns that smaller, cheaper models can execute).

## Atomic Skills: The Building Blocks

Research from OpenAI published in April 2026 identifies five fundamental "atomic skills" that compose into all software engineering tasks [^1]:

1. **Code Localization.** Given a problem description, find the files that need to change.
2. **Code Editing.** Given the right files and a clear objective, produce a correct patch.
3. **Test Generation.** Write tests that validate correctness and detect faults.
4. **Issue Reproduction.** Create a script that demonstrates a reported problem.
5. **Code Review.** Assess whether a change actually addresses its stated goal.

Each of these is defined by three properties [^1]:

**Precise input/output specification.** The skill takes a defined input and produces a defined output. No ambiguity about what goes in or what comes out.

**Independent evaluability.** You can test whether the skill succeeded without needing to evaluate the whole system. Did the localization find the right files? Did the tests pass on correct code and fail on buggy code?

**Composability.** Skills combine to solve larger problems. Bug fixing is localization plus reproduction plus editing plus test generation. Code review composes with editing for a review-and-fix workflow.

The research showed that training a single model on all five atomic skills simultaneously (joint reinforcement learning) produced an 18.7% improvement across ten downstream tasks, including composite tasks the model was never explicitly trained on [^1]. The improvement comes precisely because the skills are atomic: getting better at localization makes the model better at editing (because it finds the right files), which makes it better at bug fixing (a composite task).

## Single-Responsibility Agent Design

The atomic skills research has a practical counterpart in how you structure your own agents. The principle: never ask one agent to handle planning, research, implementation, and verification in a single prompt.

The Atomic Agents framework formalizes this [^2]: each agent has a `run` method, an input schema, and an output schema. Developers define these contracts explicitly. The agent does one thing, produces a structured result, and the orchestration layer decides what happens next.

Why this works better than monolithic agents:

**Prompts become simpler.** A code review agent doesn't need instructions about editing, testing, or deployment. Its prompt says: "Review this diff against these criteria. Return structured findings." That's it.

**Output contracts are clear.** Instead of hoping the agent formats its response in a way you can parse, you define the schema upfront. The reviewer always returns JSON with severity, file, line, and description fields.

**Debugging gets tractable.** When something goes wrong in a five-step workflow, you can identify exactly which step failed. Was it localization (wrong files)? Editing (bad patch)? Testing (missing coverage)? With a monolithic agent, the failure is opaque.

**Side effects stay deterministic.** The agent reasons and produces structured output. Everything else (API calls, file writes, retries, notifications) happens in regular code that you control [^2].

Here's a practical example. Instead of telling one agent to "implement and test the new endpoint," you decompose:

```
Step 1: Localization agent
  Input: "Add cursor-based pagination to the users endpoint"
  Output: List of files to modify + rationale

Step 2: Planning agent  
  Input: Files from step 1 + requirement
  Output: Implementation plan with ordered changes

Step 3: Editing agent (per file)
  Input: Single file + relevant plan section
  Output: Edited file

Step 4: Test generation agent
  Input: Changed files + acceptance criteria
  Output: Test file(s)

Step 5: Verification agent
  Input: All changes + test results
  Output: Pass/fail with findings
```

Each step has a clear contract. Each can be evaluated independently. And each can use a different model based on the complexity of the task (more on that below).

## The Executive-Worker Pattern

At scale, the architecture that's emerging in 2026 production systems is a two-tier model [^3]:

**The Executive** is a high-capability model (Opus, o3, or similar) that handles strategy. It reads the problem, decomposes it into atomic tasks, resolves ambiguity, handles edge cases, and makes judgment calls. It's the staff engineer who decides how to approach the problem.

**The Workers** are smaller, cheaper, faster models (or fine-tuned specialists) that execute the atomic tasks. JSON parsing, code formatting, simple edits, test generation, documentation. Tasks where the expected output is well-defined and the reasoning required is bounded.

The economics are significant. Research shows a 10 to 30x cost advantage for small models over frontier models on structured tasks [^3]. A frontier model at $0.030 per 1K tokens versus a small specialist at $0.0001 per 1K tokens means you can run 300 worker tasks for the cost of one executive reasoning step.

This maps directly to how most agentic coding tools handle model routing today. You don't need a custom framework to use the pattern. You just need to be deliberate about which model handles which tasks:

| Task | Model Tier | Why |
|------|-----------|-----|
| Problem decomposition, architecture decisions | Executive (Opus, o3) | Requires judgment and broad reasoning |
| Code editing with clear specs | Mid-tier (Sonnet, GPT-4o) | Good enough for well-defined changes |
| Formatting, linting fixes, boilerplate | Worker (Haiku, GPT-4o mini) | Mechanical task, fast model is fine |
| Test generation from existing patterns | Mid-tier | Needs to understand the code but the task is bounded |
| Code review against explicit criteria | Mid-tier | Pattern matching against defined rules |

## Software Distillation

Software distillation takes the Executive-Worker pattern one step further. Instead of just routing tasks to different models, you use a powerful model to generate the knowledge, patterns, and training data that smaller models execute on [^3].

Three forms of distillation are relevant to agentic coding:

### 1. Pattern Distillation

The Executive model analyzes your codebase and extracts patterns: "This is how error handling works here. This is the API response format. This is how tests are structured." Those patterns become part of your instruction files or skills. When a cheaper Worker model executes against those patterns, it doesn't need to rediscover them. The expensive reasoning happened once.

This is essentially what you're doing when you write a good AGENTS.md: you're distilling your team's accumulated knowledge into a format that any model can follow. The difference is being systematic about it. Use the most capable model to analyze your codebase, extract conventions, and generate the instruction files. Then day-to-day execution uses whatever model is cost-effective.

### 2. Spec Distillation

Use the Executive to expand a one-paragraph business requirement into a detailed specification with acceptance criteria, boundary conditions, and test cases (Module 11). That spec is the distilled output. A Worker model can implement against a clear spec even if it couldn't have written the spec itself.

The spec becomes a reusable artifact. It bridges the gap between expensive reasoning (understanding what needs to be built) and cheap execution (building it to spec).

### 3. Workflow Distillation

McKinsey/QuantumBlack's research describes encoding entire development workflows into structured, deterministic pipelines [^4]. The workflow is the distilled knowledge:

```
.sdlc/
  context/           # persistent project knowledge
  templates/         # artifact formats (the distilled structure)
  specs/             # per-feature specifications
  knowledge/         # accumulated decisions and Q&A
```

Agents operate within these pipelines. They don't make meta-level workflow decisions (which McKinsey found agents do poorly, "routinely skipping steps, creating circular dependencies, or getting stuck in analysis loops" [^4]). The workflow is deterministic. The agents handle execution within each step.

This is an important distinction: the orchestration layer should be rule-based, not agent-driven [^4]. Agents are good at executing bounded tasks. They're bad at deciding which tasks to execute in which order. That's a coordination problem, and coordination is better handled by deterministic code.

## Practical Application

You don't need a custom multi-agent framework to apply these ideas. Here's how they map to what you already have:

### In Your Daily Workflow

**Decompose before delegating.** Before sending a task to an agent, spend 30 seconds thinking about whether it's actually one task or several. "Add pagination and update the docs and add tests" is three tasks. Send them separately, or at least structure your prompt as explicit sequential steps.

**Use plan mode as your Executive.** Start complex tasks in plan mode (read-only) with your most capable model. Let it analyze and decompose. Then switch to a faster model for execution. The plan is the distilled output.

**Match model to task.** This is the simplest form of the Executive-Worker pattern. Use `/model` or your tool's model switcher to pick the right tier for the current task.

### In Your Team Setup

**Distill conventions into instruction files.** Use your best model to analyze the codebase and generate convention documentation. Review and edit the output. This becomes the team's shared knowledge.

**Create single-responsibility subagents.** Instead of one generic code review agent, create focused ones: a security reviewer, a performance reviewer, a test coverage checker. Each has a clear input (the code to review), clear criteria (what to check), and a clear output format (structured findings).

**Separate orchestration from execution.** If you're building automated workflows (CI, scheduled tasks), make the workflow logic deterministic code. The agent handles individual steps, not the decision of which step to run next.

### In Enterprise Settings

**Invest in atomic skill evaluation.** Can your agents reliably localize the right files? Generate tests that actually catch bugs? Review code against your standards? Measure each skill independently. Improve the weakest link.

**Consider fine-tuning for high-volume tasks.** If your team runs thousands of code reviews a month, distilling your review criteria into a fine-tuned small model can cut costs dramatically while maintaining quality.

**Build the knowledge base incrementally.** Every answered question, every approved decision, every documented pattern becomes part of the distilled knowledge that future agent interactions can draw on [^4].

## The Build-Small, Scale-Up Mindset

The headline insight from all of this research: the failure mode in production agentic systems is never insufficient model power. It's insufficient coordination [^3].

Teams that succeed with agentic coding at scale aren't using the biggest model for everything. They're using the right model for each task, coordinated by an architecture that keeps things organized. They decompose problems into atomic pieces, use powerful models for the hard reasoning, cheap models for the routine execution, and deterministic code for the orchestration.

This is the same principle that makes good software architecture work: single responsibility, clear interfaces, composability. It turns out those ideas apply to the agents writing the code, not just the code they write.

## Exercises

1. Take a recent complex task you gave to an agent. Decompose it into atomic steps. How many steps is it really? Could any of them have used a cheaper model?
2. Use plan mode with your most capable model to analyze a piece of your codebase. Have it extract the top 10 conventions. Review the output and add any good ones to your instruction file.
3. Create two single-responsibility subagents for your project: one for a specific type of review, one for a specific type of generation. Compare the results to a generic "review this code" prompt.
4. Estimate the cost difference between running your current workflow on a single top-tier model versus routing atomic tasks to appropriate model tiers.

## References

[^1]: "Scaling Coding Agents via Atomic Skills," *arXiv*, April 2026. https://arxiv.org/html/2604.05013

[^2]: "Why I Believe the Atomic Agents Framework," *HyScaler*, 2026. https://hyscaler.com/insights/ai-with-atomic-agents-framework/

[^3]: Khayyam H., "Think Small to Scale Big for Agentic AI Efficiency in 2026," *Medium*, 2026. https://medium.com/@khayyam.h/think-small-to-scale-big-for-agentic-ai-efficiency-8863a887b3f2

[^4]: "Agentic Workflows for Software Development," *QuantumBlack / McKinsey*, 2026. https://medium.com/quantumblack/agentic-workflows-for-software-development-dc8e64f4a79d
