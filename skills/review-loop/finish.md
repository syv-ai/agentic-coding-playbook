# Finish

When the status line says converged, capped or stopped. Unattended (see SKILL.md): every "ask", "offer" and "suggest" below becomes a line in the report, and capped follows the Unattended rule.

1. **PR body.** `state.py pr` writes `.review-loop/pr-body.md` from the ledger and the last checks, with what reviewers raised once and the loop set aside. A finished run's ledger is also copied to `<git-common-dir>/review-loop/<branch>--<run>/`, so it survives the worktree. Replace its two TODO parts:
   - the summary: two or three sentences from intent.md on what the change does and why;
   - `Not checked`: what mattered but wasn't verified, including any reviewer not run.

   If the repo has a PR template (`.github/pull_request_template.md` or similar), put the content into its sections and leave its checkboxes for the author.
2. **Tell the user**, briefly: the status, net lines, the round commits and the path to the PR body. Put owner decisions first, numbered, each with four short parts: what it is, the problem, the fix, and what happens if they skip it.
3. **Capped** means reviewers still found new things in the last round. Say so plainly, list the open themes, and ask once: accept as is, run one more round (`state.py extend`, then round steps 1–7), or go back to the design. When `end` printed an `UNREVIEWED FIXES` line, the last round's fixes were large or fixed a bug and nobody has reviewed them: recommend one more round, and say why from that line.
4. **Record decisions.** When the owner declines a finding, offer to add it, in their words, to the project's `declined.md` next to its conventions, so later runs treat it as decided. For a deliberate limit in the code, offer a `shortcut: <limit>, <when to revisit>` comment.
5. **Prevent repeats.** If the same convention finding came up in several findings or rounds, propose a lint rule or test in the project, so it's caught while the code is written. Suggest it; don't add it unasked.
6. `state.py report` prints raised, fixed and dropped per reviewer, and `only` and `only fixed`: what no other reviewer raised, and how much of it was fixed. Those two columns show whether a reviewer earns its tokens.

Don't push, open the PR or squash the commits unless the user asks.
