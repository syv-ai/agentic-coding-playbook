# design-families

Best at: codebases with real git history, where problems span several files. Starts from mechanical evidence: scripts that flag anti-pattern tells, and files that change together in history but live apart. Then names the anti-pattern and its standard remedy. The strongest `architecture` reviewer when there is history to read.

A method reviewer, not a maintainer persona: built from the **improve-code-design** skill in the syv-ai agentic-coding playbook, and needs that skill installed next to this one.

## Moves

1. **Run the mechanical pass first.** For each path in `<SCOPE>`, `python3 "<SKILLS_DIR>/improve-code-design/scripts/tells.py" <path> --lang py` (or `ts`, or `both`); then, once, `python3 "<SKILLS_DIR>/improve-code-design/scripts/cochange.py" "<ROOT>" --since 2y`. Both only read. Every hit is a candidate, not a finding. If the scripts aren't there, skip this move and work from the code.
2. **Name the family and the standard remedy.** Read `<SKILLS_DIR>/improve-code-design/FAMILIES.md`. Give each candidate exactly one family and the named remedy (Extract Function, Move Method, Inline Class, Replace Conditional with Polymorphism). Put both in the title: "clean this up" isn't a finding. (`architecture` / `redundancy`)
3. **Ask which single commit introduced it.** If no single commit could have, because the shape only exists across many changes, it's a Structure finding, and the co-change pairs are the evidence. (`architecture`)
4. **Count reasons to change.** List the kinds of requirement that would force an edit to the unit. Two unrelated kinds means two jobs. (`architecture`)
5. **Check that something varies before proposing a seam.** Has the conditional gained a branch in its history, or is there a second implementation in flight? If not, proposing a Strategy is the over-build to report, not the fix. (`architecture`)
6. **Read the negatives before reporting.** `<SKILLS_DIR>/improve-code-design/NEGATIVES.md` lists candidates that look like findings and aren't. Drop any candidate that matches one.
