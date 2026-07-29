# Families

Six causes. The names inside each are standard ([refactoring.guru](https://refactoring.guru/refactoring/smells)); the grouping is not. Not language-specific.

You know what a Long Method is. What follows is the *cause* each family points at, the test that separates it from its neighbours, and the false positive it generates — that is what decides whether a candidate survives.

## Reading inventory rows

The `design-inventory` subagent returns an `observed` column drawn from a fixed checklist. Those markers are facts, not findings — each points at a family, and none of them is a violation on its own.

| Marker | Points at | Only a finding if |
|---|---|---|
| `dispatching conditional` | Rigidity | The branch list has actually grown. Check git history before proposing a seam. |
| `module-level mutable` | Rigidity | Substitution is needed and blocked. An interface that gives nothing away is fine. |
| `single-implementation abstraction` | Over-build | No second implementation exists or is in flight. Ask before flagging. |
| `untyped boundary` | Make-it-work | The boundary is where the value *arrives*. An internal `dict[str, Any]` is a different question. |
| `broad catch` | Make-it-work | It swallows rather than translates. A catch that re-raises with context is correct. |
| `silent default` | Make-it-work | The default is at the surfacing site rather than the production site. |
| `repeated traversal` | Churn | One pass would be as readable. If the rewrite needs a comment, drop it. |
| `cleanup obligation` | Rigidity or Make-it-work | Callers other than the defining file must remember it. |

A row with `reasons to change` listing two unrelated requirement kinds points at **Bloat**, whatever its `observed` column says. `reaches into` entries that recur across many rows point at **Structure** — that pattern is only visible with every table in one context, which is why the tables come back to you rather than being judged where they were produced.

---

## Which family, when it fits two

Ask: **which single commit introduced this?**

If you can name one, the family is whatever that commit was doing. If no single commit could have — the shape only exists across many diffs — it is **Structure**, regardless of what it looks like locally.

Remaining ties break in this order: Over-build · Rigidity · Make-it-work · Churn · Bloat. Assign exactly one. A finding in three families constrains nothing, and a family tally built from ambiguous assignments is a fake measurement.

---

## 1. Bloat

**Cause:** a feature was added where related code already lived. Each addition small and locally correct.

**Names:** Long Method, Large Class, Long Parameter List.

**Test:** reasons to change. List the kinds of requirement that would force an edit. Two unrelated kinds means two jobs. The cost is blast radius — a tax rule change breaking PDF rendering.

**False positive:** two requirement kinds that always change together are one reason. Also: length alone. A long function doing one thing is a long function.

**Remedy:** Extract Method, Extract Class, Introduce Parameter Object.

---

## 2. Rigidity

**Cause:** behaviour was wired in place because that was the smallest change available.

**Names:** Switch Statements, Inappropriate Intimacy, global state, Singleton.

**Test:** to add the next case, do you edit working code or add new code?

**False positive:** the seam nobody needs. Check that something varies *before* proposing one — two implementations justify a seam, one does not. A two-branch conditional stable for two years is not a violation.

Singleton belongs here and is a finding, never a remedy. Agents reach for it constantly — config, connections, caches. It is global mutable state with a respectable name: no seam, no substitution, no test that avoids the real thing. The question is never whether it was implemented correctly but what it cost in testability. Construct once at startup and pass it in.

**Remedy:** Strategy, Adapter, dependency injection.

---

## 3. Over-build

**Cause:** the request said "clean", "general" or "future-proof" without saying what that meant.

**Names:** Speculative Generality, Dead Code, shallow module.

**Test:** count implementations and callers. One of each is the finding. For a wrapper: what must a caller understand to use this, versus what it does for them? If the signature is as complicated as the body, the module is a namespace with a name.

Agents produce factory layers constantly because "factory" reads as good practice. Be readier to delete one than to add one.

**False positive:** an abstraction with one implementation *today* and a second in flight. Ask before flagging.

**Remedy:** delete it. Dead code lives in version control.

---

## 4. Make-it-work

**Cause:** the request was to stop the error. The symptom was made to disappear where it surfaced.

**Names:** band-aid fix, symptom masking, over-broad exception handling, Primitive Obsession, untyped boundary.

**Test:** where was the bad value produced, and where was it patched? Distance between the two is the finding. Silent defaults each remove a signal; the construct is not the problem, the location is.

Fail loud and specifically. Broad catches swallow the failures nobody predicted along with the one that was expected. Catch only what the code can act on.

**False positive:** a deliberate boundary default with a comment saying why — a cache miss returning empty, a feature flag defaulting off. Check whether the value is *produced* here or *arriving* here.

**Remedy:** catch narrowly, type the boundary, fix at the point of production. Replace Primitive with Object.

---

## 5. Churn

**Cause:** each transformation was written as its own pass over the data.

**Names:** none standard. Repeated packing and unpacking, intermediate collections with one consumer, several passes where one would do, converting between list/set/dict inside a loop, membership tests against a list where a set exists.

**Test:** count traversals of the same collection. The fix is one pass and a plain loop, not a cleverer expression — if the rewrite needs a comment to be read, it is not a fix, and the candidate is dropped.

**False positive:** pipeline style that is genuinely clearer. Say whether this is a performance finding (large collection) or a legibility finding. Only call it performance when the size supports it.

**Remedy:** one pass, a plain loop, the right container for the lookup.

---

## 6. Structure

**Cause:** no single change caused it. A property of where code ended up across many diffs.

**Names:** Shotgun Surgery, Divergent Change, Feature Envy, misplacement, bypassed abstraction, duplicate implementation, import cycle.

**Test:** `scripts/cochange.py` — files that repeatedly change together while living in different packages. This family is not visible in one file, and it is the one an agent reading file-by-file will always miss.

**False positive:** inherent amplification. Adding a field that must round-trip from database to API to UI touches every layer no matter how well factored the code is. Only flag amplification a different decomposition would actually reduce, and name that decomposition.

**Not assessed is not zero.** If you did not compare across modules, report this family as unassessed. A tally showing zero Structure findings after a file-by-file read is a lie.

**Remedy:** SRP and DIP at module scale, Facade, boundary discipline.
