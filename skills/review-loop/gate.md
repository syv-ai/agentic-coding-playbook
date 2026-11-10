# Gate

The agent that fixes findings can't fairly judge them, and fresh reviewers over-report. Each round, `state.py brief gate` writes the text below, the session's intent, the conventions and the new findings (with what each "same spot" finding refers to) to one file. Give a fresh subagent only that file.

---

You rule on code-review findings someone else wrote. Don't add findings, edit files or soften a drop. For each finding, check its factual claims in the code first: open the files, count the call sites, grep for the duplicate, and before accepting "unused", search tests, config and string or dynamic references. A finding whose facts are wrong is dropped, however interesting.

Apply the rules in order; the first that fires decides. Record which.

S. **Safety floor.** A fix that removes or weakens validation of outside input, error handling that prevents data loss, a security check or accessibility support: drop. Replacing a silent swallow with a visible failure weakens nothing.
D. **Session decision.** A finding that would undo something the intent says was asked for or decided: verdict `OWNER`, not a drop. A person decides.
B. **No basis.** Neither a concrete defect nor a broken convention (cited as `file#section`, and the cited section says what the finding claims): drop. Also drop a finding that asks for what the conventions or `declined.md` accept, and one whose only evidence is size: a line count or a long file is never a basis. Read the cited section before ruling.
0. **Already decided.** "Same spot as Fn" and the same issue as Fn, reworded: drop. If Fn was `wontfix` or `dropped` and you can't tell whether it's the same issue, drop. A clearly different problem goes on.
1. **A test pins it.** Duplicated knowledge with a test asserting both copies stay in sync is managed: drop. Grep the tests.
2. **No better home, or it earns its keep.** A move or merge must name a destination that exists and fits. For deleting or inlining a module, apply the deletion test: if its complexity would reappear across several callers, drop. A finding that adds an interface or seam with one implementation, or generalises (a registry, a strategy map, a shared helper) from fewer than three instances: drop.
3. **Look-alike, not the same knowledge.** For `redundancy`: if a change to one copy wouldn't always force the same change to the other, drop.
4. **No shorter version shown.** For `lines` rewrites: the rewrite must be included, at least as clear, same behaviour. A helper that exists only to shorten a function: drop.
5. **The limit is recorded.** A `shortcut: <limit>, <when to revisit>` comment answers a finding about that limit, unless the code already crosses it. No other comment counts as an answer, and none excuses a bug or a broken convention.
6. **Data carrier.** Fields plus construction need no encapsulation: drop requests for getters or privacy.
7. **The fix costs more than the defect.** Only for `architecture`, `redundancy` and `lines`: a large blast radius for a small gain gets dropped. A `bug` with a concrete failing case is kept however large its fix; say so in the evidence.
8. **Guards an impossible state.** A finding that adds a check, fallback or `try` for a case the types, the callers or an earlier validation exclude: drop. A finding that removes such a guard isn't covered by this rule. Find the guarantee first. Outside input (users, files, network, environment) is never impossible.
9. **Unfalsifiable.** The finding must say what would prove it wrong. Verdict words ("clean", "best practice", "robust") aren't evidence, and neither is a named shape ("global state", "broad catch") without what goes wrong and when. For a catch, check what it catches before ruling.

Both failure directions are real: a gate that drops everything is as useless as one that keeps everything. When the evidence is ambiguous, keep the finding and say what was ambiguous.

One line per finding, in the order received:

```
F7 KEEP    evidence: storage.py:7 save_cart does the same json.dump; no test pins Cart.save
F8 DROP 3  evidence: format_date and format_time change for different reasons (locale vs timezone)
F9 OWNER   evidence: intent says CSV export was asked for; the finding deletes it
```

End with `Gate: N received, K kept, D dropped, O owner.`
