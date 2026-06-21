# Module 06: Verification and Quality Gates

## Speed Amplifies Everything

Here's the uncomfortable truth about agentic coding: it makes you faster at producing both good code and bad code. An agent that can implement a feature in minutes can also introduce subtle bugs in minutes. Without verification practices, you're scaling up your defect rate alongside your throughput [^1].

CodeScene's research puts it well: "Speed amplifies both good design and bad decisions" [^1]. The teams that get value from agentic coding are the ones that invest in verification, not the ones that skip review because the agent is confident.

## The Three Layers of Verification

Effective verification happens at three levels, each catching different classes of problems.

### Layer 1: The Agent Verifies Itself

The agentic loop already includes a verification phase (Module 01). The agent runs tests, checks compiler output, reads error messages, and iterates. This catches the obvious stuff: syntax errors, type mismatches, test failures.

You can make this self-verification better by giving the agent explicit things to check against [^2]:

```
Implement the payment retry logic.
After implementing, verify:
1. Existing tests still pass
2. The retry delay increases exponentially: 1s, 2s, 4s, 8s, max 30s
3. After 5 retries, the payment is marked as failed
4. A failed payment sends a notification (check the notification service is called)
Run the full test suite, not just the new tests.
```

The more concrete the verification criteria, the better the agent's self-check. Vague criteria like "make sure it works" give the agent nothing useful to verify against.

### Layer 2: Automated Quality Gates

Automated checks that run independently of the agent, catching things the agent might miss or overlook.

**Type checking and linting.** Run these via hooks after every edit (see Module 05). The agent sometimes writes code that's logically correct but violates your project's type conventions or style rules. Catching this automatically means you don't have to.

**Test suites.** The agent should run tests as part of its workflow, but you can also enforce this through hooks on commit or pre-PR. This catches cases where the agent marked the task as complete without running the full suite.

**Coverage regression gates.** Track whether the agent's changes reduce test coverage. This matters because agents sometimes take shortcuts: they might implement the feature but skip edge case tests, or delete a test that's inconvenient rather than fix it [^1].

**Static analysis.** Tools like SonarQube, CodeScene, or Semgrep can flag issues that tests don't catch: security vulnerabilities, complexity growth, dead code, dependency problems.

The key insight from CodeScene's research is that these gates should run at three points [^1]:

1. **During generation.** Hooks that run on each edit, giving the agent immediate feedback.
2. **Pre-commit.** Checks on staged files before the agent (or you) commits.
3. **Pre-merge (PR).** Analysis comparing the feature branch to main, catching cumulative quality drift.

### Layer 3: Human Review

You review the diff. Period.

This is the most important quality gate in agentic coding, and the one that gets skipped most often [^3]. The temptation is strong: the agent ran the tests, the linter passed, everything looks fine. But agents make mistakes that tests don't catch. They might implement the feature correctly but in a way that's inconsistent with the rest of the codebase. They might introduce a subtle performance issue. They might add a dependency you don't want.

Review the diff like you would review a pull request from a teammate [^3]. Read the code. Make sure you understand what changed and why.

Practical tips for reviewing agent-generated code:

**Use visual diffs.** See exactly what changed, file by file. Don't rely on the agent's summary of what it did; the summary might omit changes it considers minor.

**Check for scope creep.** Did the agent only change what you asked for? Or did it "helpfully" refactor other code, add unused imports, update documentation you didn't ask for?

**Look for pattern violations.** The agent might write working code that doesn't match your project's established patterns. This is especially common when the agent draws on training data rather than your specific codebase.

**Question new dependencies.** If the agent added a package to solve a problem, check whether the problem could have been solved with existing code.

### Agent Review: A Fresh Pair of Eyes

Human review is the irreplaceable layer, but it shouldn't be the *only* review. Run an agent over the diff too, as a fresh, separate session that did not write the code. An agent that helped implement a change is anchored: it tends to defend its own choices. One that sees only the diff, with no memory of the implementation conversation, reviews without that bias and catches things the author (human or agent) glossed over.

Make it routine, on every change, not just the big ones. It's cheap and tireless. It doesn't replace your review; it raises the floor before you look, so your attention goes to the judgment calls instead of the obvious misses. And hold it to a fair standard: human PR review was never perfect either. Agent reviewers aren't strictly better or worse, they fail *differently*, which is exactly why pairing one with a human catches more than either alone. In Claude Code this is the `code-review` skill (`/code-review`, or `/code-review ultra` for a deeper multi-agent pass); in CI it's the automated review step from [Module 09](./09-production-workflows.md).

## The Refactoring-First Approach

CodeScene's research highlights an important pattern: agents perform significantly better on well-structured code [^1]. When code health is low (large complex functions, deep nesting, tight coupling), agents produce worse output and burn more tokens trying.

The recommended workflow:

1. **Measure** code health in the area you're about to work on
2. **Refactor first** if the code is messy, making it modular and clean
3. **Then** let the agent do the feature work on the improved code
4. **Re-measure** to confirm quality didn't regress

This might seem like extra work, but it pays for itself. An agent working on clean, modular code produces better output with fewer iterations than an agent struggling with a 500-line function full of nested conditionals.

## Testing Strategies for Agent-Generated Code

### Let the Agent Write Tests

Agents are generally good at test generation, especially when they can see existing tests to match the style [^2]. Ask for tests as part of the task:

```
Add the email validation function.
Write tests covering: valid emails, missing @, missing domain,
unicode characters, very long addresses, empty string.
```

### Test-Driven Development with Agents

The TDD workflow maps naturally to agentic coding:

1. Tell the agent to write failing tests for the feature
2. Review the tests to make sure they capture what you actually want
3. Tell the agent to make the tests pass
4. Review the implementation

This works well because the tests become the specification. The agent has concrete verification criteria at every step. And you get to review the spec (tests) before the implementation, catching misunderstandings early.

### End-to-End Verification

Unit tests verify individual functions. But agents can also do higher-level verification. With browser automation tools (Puppeteer, Playwright) connected via MCP or available as commands, the agent can:

1. Start the dev server
2. Navigate to the feature in a browser
3. Interact with it as a user would
4. Take screenshots to verify visual output
5. Report whether the feature works end-to-end

This is especially valuable for frontend work where visual correctness matters and unit tests only tell part of the story [^4].

## Debugging Methodically

When an agent's fix doesn't work, the worst thing you can say is "it still doesn't work, fix it." Vague reports get vague, wrong fixes: the agent guesses, piles on changes, and often makes things worse. Give it evidence, not vibes.

A reliable debugging loop:

1. **Reproduce** the failure with a minimal, repeatable case. If you can't reproduce it on demand, you can't tell whether it's fixed.
2. **Instrument instead of guessing.** Add logging, read the actual stack trace and error text, use the debugger or browser DevTools, or have the agent insert temporary `print` / `console.log` statements to see what's really happening, then hand it the output.
3. **Find the root cause, not the symptom.** A fix that makes the error message disappear is not the same as a fix that addresses why it happened.
4. **Add a regression test** so the bug can't come back silently.

The reframe for delegation: a good bug report to an agent looks like a good bug report to a colleague. A repro, the actual error, and what you've already ruled out gives it everything; "doesn't work" gives it nothing. In Claude Code this loop is packaged as the `systematic-debugging` skill, but the discipline is tool-independent.

## Building a Quality Pipeline

Here's a practical quality pipeline for agentic coding:

<div class="funnel-diagram">
<template>
{
  "entry": {
    "label": "Agent writes code",
    "defects": ["style", "logic", "design", "integration", "coverage"]
  },
  "layers": [
    { "label": "Formatter / linter hook", "catches": "style" },
    { "label": "Agent runs tests", "catches": "logic errors" },
    { "label": "You review the diff", "catches": "design & consistency" },
    { "label": "CI on the PR", "catches": "integration, coverage" }
  ],
  "exit": { "label": "Merged with confidence" }
}
</template>
</div>

Each layer catches different problems. The formatter catches style issues. The agent's test run catches logic errors. Your review catches design and consistency issues. CI catches integration problems and coverage regression.

No single layer is sufficient on its own. All of them together give you confidence.

## Exercises

1. Set up a pre-commit hook that runs type checking on staged files.
2. Ask the agent to implement a feature using TDD: write the tests first, have it review them with you, then implement.
3. After the agent completes a task, review the diff manually. Note anything the tests didn't catch.
4. If you have CodeScene, SonarQube, or similar tools, check a piece of code before and after agent modification. Did quality metrics change?

## References

[^1]: "Agentic AI Coding: Best Practice Patterns for Speed with Quality," *CodeScene*, 2026. https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality

[^2]: Anthropic, "Common Workflows," *Claude Code Documentation*, 2026. https://code.claude.com/docs/en/common-workflows

[^3]: "How to Build Agentic Coding Workflows That Actually Ship," *Codegen*, 2026. https://codegen.com/blog/how-to-build-agentic-coding-workflows/

[^4]: Anthropic, "Effective Harnesses for Long-Running Agents," *Anthropic Engineering Blog*, 2025. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
