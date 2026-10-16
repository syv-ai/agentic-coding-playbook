# Evidence Sources

Pick the cheapest source that tells your hypotheses apart. Prefer a CLI where one exists: it works in any harness and its output lands in the conversation as text.

## Logs to a file

The default. Add tagged lines (`[DEBUG-a4f2]`) at the boundaries that distinguish hypotheses, and write them to a file or stderr you read back, rather than relying on a logger that a test runner may suppress. Log before a dangerous operation, not after it fails. Include the context that matters: inputs, working directory, relevant environment, and a stack trace (`new Error().stack`, `traceback.print_stack()`) when you need to know who called. One JSON object per line makes the file easy to filter.

## Debugger, DAP and logpoints

A debugger shows state at one moment, or through a deep call chain, without editing code. A logpoint prints an expression when a line runs, without pausing; it's a log line you don't have to remove.

- **CLI:** `gdb -batch -ex run -ex bt --args ./prog` or `lldb --batch -o run -o bt -- ./prog` for a native stack trace; `python -m pdb`, `node inspect` for scripted sessions.
- **Over the Debug Adapter Protocol:** [Microsoft DebugMCP](https://github.com/microsoft/DebugMCP) lets an agent set breakpoints and logpoints, step and evaluate expressions, either inside VS Code or as a standalone CLI driving DAP adapters you configure.

On the mixed evidence for debuggers: in [debug-gym](https://arxiv.org/abs/2503.21557), giving models `pdb` raised success on SWE-bench-Lite for most models but lowered it for some weaker ones, and made no clear difference on simple tasks. Agents with only a shell also do well on SWE-bench.

## Browser

- **Chrome DevTools MCP** ([announcement](https://developer.chrome.com/blog/chrome-devtools-mcp)) gives the agent console messages, network requests, DOM and CSS inspection, and performance traces.
- **Playwright** scripts reproduce UI bugs headlessly. Record a trace (`--trace on`) and read it from the terminal with `npx playwright trace` (open, actions, action, snapshot), available from Playwright 1.59.
- A HAR export from the user's browser is a captured artifact: quote only the relevant entries, and redact cookies and auth headers.

## Time-travel debugging

`rr` (Linux) records a failing run once and replays it deterministically, including backwards (`reverse-continue`, a watchpoint on a corrupted value). It's well suited to intermittent native bugs: record until the failure happens, then debug that recording as often as you need.

## Production

Error trackers such as Sentry give stack traces, breadcrumbs and release tags for failures you can't reproduce locally. OpenTelemetry traces show where time goes and where a request fails across services. Read them through the vendor's CLI or API where one exists. Adding instrumentation to production needs the user's permission.

## Performance

Measure a baseline before changing anything: a timing harness, a profiler, a query plan. Then bisect or change one thing at a time and measure again.
