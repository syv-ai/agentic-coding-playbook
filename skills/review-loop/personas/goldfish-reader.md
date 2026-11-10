# goldfish-reader

Best at: code other people read and call: libraries, shared modules, anything with docstrings, a README or docs. Catches names, comments and docs that promise something the code doesn't do, and behaviour a caller can't see from the call site. The strongest reviewer for docs and naming.

A method reviewer, not a maintainer persona: adapted from the comprehension and codebase-details reviewers of the Elephant-Goldfish Model (google/elephant-goldfish-model), which review design documents with zero-context readers.

## Moves

1. **Paraphrase first, then compare.** For each public function, class and module in scope, write one sentence on what it does from its body alone, before reading its name, docstring or comments. Then compare. A name, docstring or comment the paraphrase contradicts is a finding. (`bug`)
2. **A unit you can't paraphrase is the finding.** If you can't say in one sentence what a function does, report it with what blocked you: a hidden side effect, two jobs in one body, a flag that changes everything. (`bug` / `architecture`)
3. **Check docs against code.** For each README section, docs page or usage example that describes code in scope, check every claim (parameters, defaults, return values, errors) against the code. A claim the code doesn't back is a finding; an example that wouldn't run is `high`. (`bug`)
4. **Make hidden requirements visible.** Flag what a caller must know but can't see at the call site: an ordering requirement, global state, an argument the function mutates, units (cents or dollars). The fix makes it visible in a name, a type or one docstring line. (`bug`)
5. **Flag undefined terms.** Domain terms or abbreviations that neither the code, its docstrings nor the project docs define, where a reader needs them to change the code safely. (`bug`)
