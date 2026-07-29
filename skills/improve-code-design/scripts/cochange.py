#!/usr/bin/env python3
"""Rank file pairs that change together in history but live apart in the tree.

Change amplification is usually guessed at ("imagine adding a node type").
Git measures it directly: files that repeatedly appear in the same commit
while sitting in different packages are where the decomposition runs across
the grain of change rather than along it.

Usage:
    python3 cochange.py [REPO_PATH] [--since 2y] [--min-pairs 4]
                       [--max-commit-files 25] [--top 20]

Output is a ranked table. Read the top rows as *candidates for the inventory*,
not as findings — a pair may be coupled for a legitimate reason. The number
that matters is `pairs`: how many separate commits had to touch both.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path


def read_commits(repo: str, since: str, max_files: int) -> list[list[str]]:
    """Return each commit's file list, dropping bulk commits.

    Commits touching more than ``max_files`` files are almost always
    reformats, dependency bumps, or merges. They create spurious pairs
    between everything they touch, so they're excluded.
    """
    try:
        raw = subprocess.run(
            ["git", "-C", repo, "log", f"--since={since}", "--name-only",
             "--pretty=format:%x00", "--no-merges"],
            capture_output=True, text=True, check=True,
        ).stdout
    except subprocess.CalledProcessError as exc:
        sys.exit(f"git log failed: {exc.stderr.strip()}")
    except FileNotFoundError:
        sys.exit("git not found on PATH")

    commits = []
    for block in raw.split("\x00"):
        files = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if 1 < len(files) <= max_files:
            commits.append(files)
    return commits


def package_of(path: str, depth: int = 2) -> str:
    """The directory prefix used to decide whether two files 'live apart'."""
    parts = Path(path).parts[:-1]
    return "/".join(parts[:depth]) if parts else "."


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("repo", nargs="?", default=".")
    ap.add_argument("--since", default="2y")
    ap.add_argument("--min-pairs", type=int, default=4)
    ap.add_argument("--max-commit-files", type=int, default=25)
    ap.add_argument("--top", type=int, default=20)
    ap.add_argument("--depth", type=int, default=2,
                    help="directory depth that counts as 'same package'")
    args = ap.parse_args()

    commits = read_commits(args.repo, args.since, args.max_commit_files)
    if not commits:
        print("No qualifying commits. Try a wider --since.")
        return 0

    churn: Counter[str] = Counter()
    pairs: Counter[tuple[str, str]] = Counter()
    for files in commits:
        churn.update(files)
        for a, b in combinations(sorted(set(files)), 2):
            pairs[(a, b)] += 1

    rows = []
    for (a, b), n in pairs.items():
        if n < args.min_pairs:
            continue
        if package_of(a, args.depth) == package_of(b, args.depth):
            continue
        # Share of each file's own history spent changing alongside the other.
        strength = n / min(churn[a], churn[b])
        rows.append((n, strength, a, b))

    if not rows:
        print(f"No cross-package pairs at >= {args.min_pairs} shared commits.")
        print("That is a good sign, or the history is too short.")
        return 0

    rows.sort(key=lambda r: (r[1], r[0]), reverse=True)
    print(f"{len(commits)} commits analysed (since {args.since})\n")
    print(f"{'pairs':>5}  {'bond':>5}  files")
    print("-" * 78)
    for n, strength, a, b in rows[: args.top]:
        print(f"{n:>5}  {strength:>5.0%}  {a}")
        print(f"{'':>5}  {'':>5}  {b}")
    print("\nbond = share of the rarer file's commits that also touched the other.")
    print("High pairs + high bond in different packages = inventory candidate.")

    single = [(f, c) for f, c in churn.most_common(args.top) if c >= args.min_pairs]
    if single:
        print("\nHighest-churn files (review these first if time is limited):")
        for f, c in single[:10]:
            print(f"{c:>5}  {f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
