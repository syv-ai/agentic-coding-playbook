#!/usr/bin/env python3
"""Cluster near-identical tests, and say whether they aim at one target or many.

Each test body is tokenised; string and number literals become placeholders,
and the production names the test calls (imported from non-test modules)
become one placeholder too. Tests are then compared by Jaccard similarity of
token 3-grams and clustered.

    (targets are "different" only when no production name is shared by every
    test in the cluster; a helper one test also calls does not count)

    same target, same literals   -> redundant: one of them adds nothing
    same target, other literals  -> a table/parametrised test waiting to happen
    different targets            -> the production code is parallel: a design lead

Usage:
    python3 dupes.py ROOT [--lang py|ts|both] [--threshold 0.8]
                          [--min-tokens 15] [--focus PATH ... | --focus @list.txt]

--focus keeps only clusters that contain a test from those files, so a review
of a diff still compares the new tests against the whole suite.

Exit code is always 0; hits are informational.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _scan import TestCase, is_test_file, parse_focus, tests_in, tokens, walk  # noqa: E402

LITERAL = re.compile(r"""^(['"`].*|\d[\d_.]*)$""", re.S)


def normalise(tc: TestCase, keep_literals: bool) -> list[str]:
    body = tc.body.split("\n", 1)[1] if "\n" in tc.body else tc.body
    out = []
    for t in tokens(body):
        if t in tc.targets:
            out.append("<T>")
        elif not keep_literals and LITERAL.match(t):
            out.append("<L>")
        else:
            out.append(t)
    return out


def shingles(toks: list[str], k: int = 3) -> set[tuple[str, ...]]:
    return {tuple(toks[i:i + k]) for i in range(max(len(toks) - k + 1, 1))}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--lang", choices=["py", "ts", "both"], default="both")
    ap.add_argument("--threshold", type=float, default=0.8)
    ap.add_argument("--min-tokens", type=int, default=15)
    ap.add_argument("--focus", nargs="*")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.exists():
        sys.exit(f"no such path: {root}")
    focus = parse_focus(args.focus, root)

    cases: list[TestCase] = []
    for f in walk(root, args.lang):
        if is_test_file(f, root):
            cases += tests_in(f, root)

    norm = [normalise(c, keep_literals=False) for c in cases]
    keep = [i for i, n in enumerate(norm) if len(n) >= args.min_tokens]
    sh = {i: shingles(norm[i]) for i in keep}
    print(f"Scanned {len(cases)} tests under {root} ({len(keep)} long enough to compare)")

    parent = {i: i for i in keep}

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    best: dict[tuple[int, int], float] = {}
    ordered = sorted(keep, key=lambda i: len(sh[i]))
    for x, i in enumerate(ordered):
        for j in ordered[x + 1:]:
            if len(sh[i]) < args.threshold * len(sh[j]):
                break  # sizes too far apart to reach the threshold
            s = jaccard(sh[i], sh[j])
            if s >= args.threshold:
                parent[find(i)] = find(j)
                best[(min(i, j), max(i, j))] = s

    clusters: dict[int, list[int]] = {}
    for i in keep:
        clusters.setdefault(find(i), []).append(i)
    groups = [sorted(g, key=lambda i: (cases[i].file, cases[i].line))
              for g in clusters.values() if len(g) > 1]
    if focus is not None:
        groups = [g for g in groups if any(cases[i].file in focus for i in g)]

    def kind(g: list[int]) -> str:
        target_sets = [cases[i].targets for i in g]
        if all(target_sets) and not set.intersection(*map(set, target_sets)):
            return "different targets"
        exact = {tuple(normalise(cases[i], keep_literals=True)) for i in g}
        return "same target, same literals" if len(exact) == 1 else "same target, other literals"

    order = {"different targets": 0, "same target, other literals": 1, "same target, same literals": 2}
    groups.sort(key=lambda g: (order[kind(g)], -len(g)))

    why = {
        "different targets": "Design lead — the tests are one test with the function renamed, so "
                             "the functions are probably one behaviour written N times. Look for a "
                             "shared abstraction in production before touching the tests.",
        "same target, other literals": "Test fix — one behaviour checked case by case. A table / "
                                       "parametrised test states it once; only a finding if the "
                                       "copies have started to drift.",
        "same target, same literals": "Test fix — the copies check the same thing with the same "
                                      "data. Keep the clearest one.",
    }
    if not groups:
        print("\nNo clusters at this threshold.")
    for n, g in enumerate(groups, 1):
        k = kind(g)
        sims = [s for (a, b), s in best.items() if a in g and b in g]
        print(f"\n## Cluster {n}: {len(g)} tests, {k}  (similarity {min(sims):.2f}–{max(sims):.2f})")
        print(f"   {why[k]}")
        for i in g:
            c = cases[i]
            tgt = ", ".join(sorted(c.targets)) or "-"
            print(f"   {c.file}:{c.line}  {c.name}  -> {tgt}")

    print("\nEvery cluster is an observation, not a finding. Similar shape is not the "
          "same behaviour: read the bodies, and check the production targets before "
          "calling them parallel.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
