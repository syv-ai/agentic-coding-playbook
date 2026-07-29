# Negatives

Candidates that look like findings and are not. Precision decides whether this skill gets used twice — a review at high recall and low precision gets skimmed, and the two findings that mattered go with the rest.

Read these before any review. They matter more than the positive examples, because "be ruthless" is an adjective and models generalise from cases.

---

**A 900-line file with fifteen private functions.**
Looks like: Bloat, needs splitting. Is: two public entry points over a large body of translation logic between two systems. Its size is the size of the mismatch it absorbs; splitting scatters one job across five files.
Rule: size is never evidence. Never open a finding with a line count.

**The same sorting rule implemented in Python and TypeScript.**
Looks like: duplicate implementation, Structure. Is: duplicated on purpose, named in a comment, pinned by twin test suites asserting the same cases on both sides. A divergence fails one suite immediately.
Rule: a test that pins the coupling downgrades it to managed.

**A cache keyed on `id(value)`.**
Looks like: a bug — ids are reused after collection. Is: the cache holds a strong reference alongside the value, so the source object outlives the entry. The comment says exactly this.
Rule: in Trusted mode, when a comment names the obvious objection and answers it, defer.

**A two-entry lookup table keyed by node type.**
Looks like: Rigidity, wants a registration hook. Is: two entries.
Rule: fewer than three instances is not a finding. A watch item at most.

**A dataclass with fifteen public fields.**
Looks like: no encapsulation. Is: a data carrier. Callers depend on the fields either way; getters add a layer that hides nothing.
Rule: never recommend getters.

**`if key in results` where `results.get(key)` would be shorter.**
Looks like: Churn, could be simplified. Is: membership rather than truthiness so a deliberate `None` survives and an absent key is omitted. The distinction is load-bearing.
Rule: a simplification that changes semantics is a bug you are proposing to introduce.

**A module-level registry singleton.**
Looks like: Rigidity, global state. Is: an interface that gives nothing away — `register` / `cancel` / `is_cancelled` could be backed by Redis tomorrow in one file.
Rule: report the operational consequence ("this stops working at two workers, here is the cheap fix when you need it"), not the shape. At one worker it is a note, not a finding.

**Four `try/except` blocks in an integration layer.**
Looks like: Make-it-work, symptom masking. Is: each catches one named exception and re-raises a domain error with context. Narrow, loud, at the boundary where the value arrives.
Rule: check what is caught before flagging that something is caught.

---

## A review that found nothing

This is the whole output. No hedging, no invented Small finding, no architecture summary restating the code.

> Comment mode: **Trusted** — I checked four behavioural claims against their code and all four held.
>
> 13 units, 100% covered (`inventory.py check`). Structure assessed via `cochange.py` across 340 commits — no cross-package pair above four shared commits.
>
> Nine files listed a single reason to change; four listed two, and in each of those the two kinds always move together. Eleven `observed` markers across the batch, no `reaches into` entry recurring in more than one row.
>
> Four candidates, all suppressed:
>
> - `is_expired` in two modules — different questions (token expiry vs cache age), no shared decision.
> - `_FORMATS` keyed by another module's type ids — two entries, no third queued.
> - `close()` with no context manager — sole caller is a `finally` in the same file.
> - Retry constants duplicated in client and test — the test asserts they match.
>
> Nothing here is worth changing. The thing most likely to bite later is `_FORMATS`, and the trigger is a third format; at two it is not a problem.

No artifact was written. Two strong candidates is the threshold, and there were none.

## The test before reporting anything

Ask what a thoughtful author would say in reply. If the plausible answer is "yes, I know, here's why" — and especially if that answer is already in a comment — the candidate is suppressed. Reviews earn credibility by what they decline to flag.
