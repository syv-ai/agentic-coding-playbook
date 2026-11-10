#!/usr/bin/env python3
"""Ledger and convergence state for the review-loop skill. Stdlib only.

  state.py init   [--base REF] [--scope "a/ b.py"] [--intent FILE] [--conventions "AGENTS.md ..."]
                  [--check CMD]... [--max-rounds N] [--rereview] [--min-severity medium]
  state.py start                     begin a round; prints what not to re-raise
  state.py brief NAME                write the filled brief for reviewer NAME, or for "gate"; prints its path
  state.py add FILE                  record a reviewer's findings (JSON list); prints new ones with ids
  state.py notrun NAME REASON        a reviewer failed twice; the round can't count as clean
  state.py decide ID STATUS [NOTE]   STATUS: kept | dropped | fixed | wontfix
  state.py check                     run the checks without closing the round; exits 1 when one fails
  state.py end                       run the checks unless `check` passed on this content, close the round,
                                     print the status line /goal reads
  state.py stop REASON               end the loop early; prints the status line
  state.py extend                    allow one more round after the loop capped
  state.py pr [--out FILE]           write the PR body from the ledger (default .review-loop/pr-body.md)
  state.py status | report | selftest          (every command takes --dir, default .review-loop)

Diff mode (no --scope): the change is `git diff <merge-base>`, and rounds after the first review only the
previous round's fixes. --rereview reviews the whole change every round and needs two clean rounds.
Path mode (--scope): those files are reviewed whole every round.

A finding is {"file", "symbol", "lens", "severity", "title", "why", "fix", "persona"}. Its identity is
file + symbol. At the same spot, a finding whose title and fix overlap an earlier one's (>= REPEAT words in
common) is a repeat; a lower overlap is a different issue, flagged "same spot as Fn" for the gate.
A title's leading decision tag ("D6 designed only the happy path: ...") is left out of the overlap.

Per reviewer file, add reads the first MAX_WRITTEN findings and records at most MAX_FINDINGS new ones,
most severe first. Repeats, and findings at the same spot as another reviewer's (most likely repeats; the
gate decides), don't count toward that, so each reviewer's slots go to what no other reviewer raised.
"""
import argparse, contextlib, hashlib, io, json, os, re, secrets, shutil, subprocess, sys, tempfile
try:
    import fcntl
except ImportError:  # Windows: no lock; run reviewers' add calls one at a time
    fcntl = None

SEVERITY = {"low": 0, "medium": 1, "high": 2}
DONE = {"dropped", "fixed", "wontfix"}
REPEAT = 0.25
MAX_FINDINGS = 5
MAX_WRITTEN = 10  # a reviewer writes up to this many, so its five distinct ones survive the repeats
FIX_REVIEW = 150  # a capped round's fixes over this many changed lines are due one more round
MAX_DIFF_LINES = 800
CHECK_TIMEOUT = 900
SEVERITY_ALIASES = {"critical": "high", "blocker": "high", "major": "high", "minor": "low", "info": "low", "nit": "low", "2": "high", "1": "medium", "0": "low"}
EXCLUDE = ":(exclude).review-loop"
SMALL_CHANGE = 50  # changed lines under which one reviewer and one round are enough
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOP = set("a an the and or of to in for is it its as on by with that this be are was so only every".split())
DECISION_TAG = re.compile(r"^\s*D\d+\b[^:]{0,80}:")  # the decisions persona's "D8 let scope follow ...:" cause


def key(f):
    norm = lambda s: re.sub(r"\W+", "", str(s or "").lower())
    # The lens isn't part of identity: reviewers label the same problem differently.
    return f"{norm(f.get('file'))}|{norm(f.get('symbol'))}"


def overlap(a, b):
    """Word overlap of title and fix. Same-issue rewordings score about 0.3-0.6; different issues at one spot about 0.1.
    A decision tag names the cause, not the issue, and its words would make a repeat look new."""
    title = lambda f: DECISION_TAG.sub("", str(f.get("title", "")), count=1)
    words = lambda f: {w for w in re.findall(r"\w\w+", f"{title(f)} {str(f.get('fix', ''))[:200]}".lower()) if w not in STOP}
    A, B = words(a), words(b)
    return len(A & B) / len(A | B) if A | B else 1.0


def norm_severity(value):
    v = str(value if value is not None else "").strip().lower()
    v = SEVERITY_ALIASES.get(v, v)
    return v if v in SEVERITY else None


def sev(f):
    return SEVERITY.get(norm_severity(f.get("severity")) or "medium")


def load(d):
    if not os.path.exists(os.path.join(d, "state.json")):
        sys.exit(f"no {d}/state.json: run `state.py init` first")
    with open(os.path.join(d, "state.json")) as fh:
        return json.load(fh)


def require_open(s, what):
    """Ledger writes belong to an open round of a running loop; anything else is a sequencing mistake."""
    if s["status"] != "running":
        sys.exit(f"the loop has {s['status']}; `{what}` changes nothing now (run init to start over)")
    if not s.get("round_open"):
        sys.exit(f"no round is open: run `state.py start` before `{what}`")


def save(d, s):
    if s["status"] != "running":
        s["final_head"] = git("rev-parse", "HEAD")
    with open(os.path.join(d, "state.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    if s["status"] != "running":
        archive(d, s)


def archive(d, s):
    """A finished run's ledger, copied beside the repo's shared git dir, so it outlives the worktree and the next init."""
    common, branch = git("rev-parse", "--path-format=absolute", "--git-common-dir"), git("symbolic-ref", "--quiet", "--short", "HEAD")
    if not common:
        return
    safe = re.sub(r"[^\w.-]", "_", branch or "HEAD")
    dest = os.path.join(common, "review-loop", f"{safe}--{s.get('run', 'run')}")
    try:
        os.makedirs(dest, exist_ok=True)
        for name in os.listdir(d):
            if name == "state.json" or re.fullmatch(r"r\d+-.+\.json", name) or name == "intent.md":
                shutil.copy2(os.path.join(d, name), dest)
    except OSError as e:
        print(f"ARCHIVE FAILED ({dest}): {e}; the ledger is only in {d}")


def git(*args):
    r = subprocess.run(["git", "-c", "core.quotepath=off", *args], capture_output=True, encoding="utf-8", errors="replace")
    return r.stdout.strip() if r.returncode == 0 else None


def git_paths(*args):
    """NUL-separated so names with spaces or non-ASCII survive."""
    r = subprocess.run(["git", "-c", "core.quotepath=off", args[0], "-z", *args[1:]], capture_output=True, encoding="utf-8", errors="replace")
    return [p for p in r.stdout.split("\0") if p] if r.returncode == 0 else []


def sh(cmd, timeout=CHECK_TIMEOUT):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, encoding="utf-8", errors="replace", timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return 124, "", f"timed out after {timeout} s"


def tail(text, lines=8, width=300):
    return "\n".join(l[:width] for l in text.strip().splitlines()[-lines:])


def short(sha):
    return (sha or "")[:10]


def tree_state():
    """HEAD plus uncommitted changes, to notice a reviewer that changed files."""
    raw = f"{git('rev-parse', 'HEAD')}\n{git('diff', 'HEAD')}\n{git('ls-files', '--others', '--exclude-standard')}"
    return hashlib.sha1(raw.encode()).hexdigest()


def worktree_tree():
    """The tree the working tree would commit as, untracked files included. A commit doesn't change it and an
    edit does, so checks that passed on it need no second run after the round's commit."""
    index = git("rev-parse", "--git-path", "index")
    if not index:
        return None
    with tempfile.TemporaryDirectory() as tmp:
        env = {**os.environ, "GIT_INDEX_FILE": os.path.join(tmp, "index")}
        if os.path.exists(index):
            shutil.copy(index, env["GIT_INDEX_FILE"])
        subprocess.run(["git", "add", "-A", "--", ".", EXCLUDE], env=env, capture_output=True)
        r = subprocess.run(["git", "write-tree"], env=env, capture_output=True, encoding="utf-8")
    return r.stdout.strip() if r.returncode == 0 else None


def status_paths():
    """The paths `git status` lists, to name what a reviewer created or changed. Ignored files aren't listed,
    and tree_state() doesn't see them either, so a reviewer that writes only ignored files goes unnoticed."""
    return sorted({e[3:] for e in git_paths("status", "--porcelain", "--untracked-files=all") if len(e) > 3 and e[2] == " "})


def changed_files(s):
    if s.get("mode") != "diff":
        return s.get("scope") or ["."]
    out = git_paths("diff", "--name-only", s["base"], "--", ".", EXCLUDE)
    out += git_paths("ls-files", "--others", "--exclude-standard", "--", ".", EXCLUDE)
    return sorted(set(out))


def net_loc(s):
    if not s.get("base"):
        return None
    out = git("diff", "--numstat", s["base"], "--", ".", EXCLUDE)
    if out is None:
        return None
    rows = [l.split("\t") for l in out.splitlines() if l and not l.startswith("-")]
    return sum(int(a) - int(b) for a, b, _ in rows)


def status_line(s):
    led = s["ledger"]
    count = lambda st: sum(f["status"] == st for f in led)
    loc = net_loc(s)
    loc = "n/a" if loc is None else f"{loc:+d}"
    return (f"review-loop [{s.get('run', '-')}]: {s['status']} at round {s['round']}/{s['max_rounds']} · "
            f"new this round {s.get('new_this_round', 0)} · fixed {count('fixed')} · "
            f"dropped {count('dropped')} · wontfix {count('wontfix')} · open {count('kept') + count('new')} · net LOC {loc}"
            + (f" · not run: {', '.join(nr)}" if (nr := s.get("not_run", {}).get(str(s["round"]))) else "")
            + (f" · failing checks: {len(fc)}" if (fc := s.get("failed_checks")) else ""))


def skills_dir():
    """Where sibling skills (improve-code-design) live: next to this one when installed together,
    else Claude Code's skills folder."""
    here = os.path.dirname(SKILL_DIR)
    home = os.path.join(os.path.expanduser(os.environ.get("CLAUDE_CONFIG_DIR") or "~/.claude"), "skills")
    return next((d for d in (here, home) if os.path.isdir(os.path.join(d, "improve-code-design"))), here)


def default_base():
    for ref in (git("symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"), "origin/main", "main", "origin/master", "master"):
        if ref and git("rev-parse", "--verify", "--quiet", ref + "^{commit}"):
            return ref
    return None


def exclude_from_git(path):
    """Keep the loop's files out of commits and `git status` without touching .gitignore."""
    ex, top = git("rev-parse", "--git-path", "info/exclude"), git("rev-parse", "--show-toplevel")
    rel = os.path.relpath(os.path.abspath(path), top).replace(os.sep, "/") if ex and top else ".."
    if rel.startswith(".."):
        return
    try:
        have = open(ex).read()
    except OSError:
        have = ""
    if f"/{rel}/" not in have.split("\n"):
        os.makedirs(os.path.dirname(ex) or ".", exist_ok=True)
        with open(ex, "a") as fh:
            fh.write(("\n" if have and not have.endswith("\n") else "") + f"/{rel}/\n")


def cmd_init(a):
    os.makedirs(a.dir, exist_ok=True)
    exclude_from_git(a.dir)
    base_ref = a.base or (None if a.scope else default_base())
    base = (git("merge-base", "HEAD", base_ref) or git("rev-parse", "--verify", "--quiet", base_ref + "^{commit}")) if base_ref else None
    if a.base and not base:
        sys.exit(f"--base {a.base} is not a commit here")
    if not a.scope and not base:
        print("NO BASE BRANCH: no origin default, main or master here, so the whole tree is reviewed as paths; pass --base for a diff review")
    s = {"run": secrets.token_hex(3), "round": 0, "max_rounds": a.max_rounds, "min_severity": a.min_severity,
         "rereview": a.rereview, "confirm_rounds": 2 if a.rereview else 1, "clean_streak": 0,
         "briefed": {}, "added": {}, "not_run": {}, "round_head": {}, "mode": "path" if a.scope or not base else "diff",
         "base": base or git("rev-parse", "HEAD"), "base_ref": base_ref, "intent": a.intent,
         "conventions": a.conventions.split(), "checks": a.check or [], "status": "running", "ledger": [],
         "models": [m.strip() for m in (a.models or "").split(",") if m.strip()]}
    s["scope"] = a.scope.split() if a.scope else ["."]
    if s["mode"] == "diff":
        s["scope"] = changed_files(s)
        if not s["scope"]:
            sys.exit(f"nothing changed since {base_ref}: pass --scope to review paths whole")
        s["changed_lines"] = changed_lines(s)
    small = a.max_rounds is None and not a.rereview and s.get("changed_lines", SMALL_CHANGE) < SMALL_CHANGE
    s["max_rounds"] = a.max_rounds or (1 if small else 3)
    save(a.dir, s)
    size = f" · {s['changed_lines']} changed lines" if "changed_lines" in s else ""
    print(f"{s['mode']} mode · base {base_ref or 'HEAD'} {short(s['base'])} · {len(s['scope'])} paths in scope{size}")
    if small:
        print(f"SMALL CHANGE: under {SMALL_CHANGE} lines, so one round with only `necessity` and no gate (--max-rounds overrides)")
    print(status_line(s))


def decided_lines(s):
    # Fixed findings aren't listed: if a fix didn't work, the next reviewer should be free to say so.
    label = lambda f: "open" if f["status"] in ("new", "kept") else f["status"]
    return [f"- [{label(f)}] {f['file']} {f['symbol']} ({f['lens']}): {f['title']}" for f in s["ledger"] if f["status"] != "fixed"]


def stop(d, s, reason):
    s["status"], s["stop_reason"] = "stopped", reason
    save(d, s)
    print(status_line(s) + f" · reason: {reason}")


def cmd_start(a):
    s = load(a.dir)
    if s["status"] != "running":
        print(status_line(s))
        sys.exit("loop has ended; run init to start over")
    if s.get("round_open"):
        sys.exit(f"round {s['round']} is still open: run `state.py end` first")
    s["round"] += 1
    s["new_this_round"], s["round_open"] = 0, True
    s.setdefault("round_head", {})[str(s["round"])] = git("rev-parse", "HEAD")
    save(a.dir, s)
    print(f"round {s['round']}/{s['max_rounds']} started")
    if s.get("models"):
        model = s["models"][min(s["round"], len(s["models"])) - 1]
        s.setdefault("round_model", {})[str(s["round"])] = model
        save(a.dir, s)
        print(f"MODEL {model}: start every reviewer subagent this round on this model")
    print("Already decided, don't re-raise:")
    print("\n".join(decided_lines(s)) or "Nothing yet.")


def in_scope(s, path):
    def norm(p):
        p = re.sub(r":\d+(:\d+)?$", "", str(p).strip())  # a.py:5
        if os.path.isabs(p):
            p = os.path.relpath(p, os.getcwd())
        p = os.path.normpath(p)
        return "\0outside" if p.startswith("..") else p.lstrip("./")
    scope = [norm(p) for p in changed_files(s)]
    p = norm(str(path))
    return not scope or "." in scope or "" in scope or any(p == q or p.startswith(q.rstrip("/") + "/") for q in scope)


def clean_finding(raw, persona):
    """Coerce a reviewer's finding to strings. None if it lacks what identity needs (file and title)."""
    if not isinstance(raw, dict):
        return None
    f = {k: v if isinstance(v, str) else ("" if v is None else json.dumps(v)) for k, v in raw.items()}
    if not f.get("file") or not f.get("title"):
        return None
    level = norm_severity(raw.get("severity"))
    if level is None:
        print(f"UNKNOWN SEVERITY {raw.get('severity')!r} on {f['file']} {f.get('symbol', '')}: treated as medium")
    f["severity"] = level or "medium"
    f["symbol"] = f.get("symbol") or os.path.splitext(os.path.basename(f["file"]))[0]
    f["lens"] = f.get("lens") or "unlabelled"
    f["persona"] = raw["persona"] if isinstance(raw.get("persona"), str) and raw["persona"] else persona or "-"
    return f


CUT_FIELDS = ("file", "symbol", "title", "fix", "severity", "lens", "persona")


def same_cut(c, f):
    """The same finding: same file and overlapping words. Not the symbol, which reviewers label freely
    ("publish routes" vs "PublicationRefused handlers"), and outside the diff nothing anchors it."""
    return key(c).split("|")[0] == key(f).split("|")[0] and overlap(c, f) >= REPEAT


def cut_before(s, f):
    """An earlier cut of the same finding by another reviewer or in another round: raised twice, so it is recorded."""
    me = (s["round"], f.get("persona"))
    return next((c for c in s.get("cut", []) if (c["round"], c.get("persona")) != me and same_cut(c, f)), None)


def remember_cut(s, f, reason):
    """A finding the loop did not record. Kept for the PR body, and so a second sighting gets through."""
    if not any(same_cut(c, f) for c in s.setdefault("cut", [])):
        s["cut"].append({**{x: f.get(x, "") for x in CUT_FIELDS}, "key": key(f), "round": s["round"], "reason": reason})


def warn_tree_changed(s):
    """Reviewers are told to leave the tree alone; one that ran a build or a formatter left files the fixer
    would commit as its own. Compared with the tree at the round's first reviewer brief, once per round."""
    rnd = str(s["round"])
    before = s.get("review_tree", {}).get(rnd)
    if not before or before.get("warned") or tree_state() == before["state"]:
        return
    before["warned"] = True
    new = [p for p in status_paths() if p not in before["paths"]][:10]
    print(f"TREE CHANGED during review: {', '.join(new) or 'files already changed before the briefs'}; "
          "a reviewer changed the working tree: restore it before fixing")


def cmd_add(a):
    s = load(a.dir)
    require_open(s, "add")
    try:
        with open(a.file) as fh:
            found = json.load(fh)
    except OSError:
        sys.exit(f"{a.file} is missing: the reviewer must write a JSON list, [] when it found nothing")
    except ValueError:
        sys.exit(f"{a.file} is not JSON: the reviewer must write a JSON list, [] when it found nothing")
    if not isinstance(found, list):
        sys.exit(f"{a.file} must hold a JSON list of findings, not {type(found).__name__}")
    m = re.search(r"r\d+-(.+)\.json$", os.path.basename(a.file))
    name = m.group(1) if m else None
    if name:
        added = s.setdefault("added", {}).setdefault(str(s["round"]), [])
        if name not in added:
            added.append(name)
        if name in s.get("owed", []) and name in s.get("full_brief", {}).get(str(s["round"]), []):
            s["owed"].remove(name)  # it has now reviewed the whole change
    warn_tree_changed(s)
    cleaned = []
    for raw in found:
        f = clean_finding(raw, name)
        if f is None:
            print(f"INVALID, skipped (a finding needs file and title): {json.dumps(raw)[:120]}")
        else:
            cleaned.append(f)
    for f in cleaned[MAX_WRITTEN:]:
        remember_cut(s, f, "past the per-reviewer cap")
    over = len(cleaned[MAX_WRITTEN:])
    cleaned = cleaned[:MAX_WRITTEN]
    found = sorted((f for f in cleaned if sev(f) >= SEVERITY[s["min_severity"]]), key=lambda f: -sev(f))
    for f in cleaned:
        if f not in found:
            remember_cut(s, f, "below the bar")
    recorded = counted = capped = 0
    repeats = []
    for f in found:
        k = key(f)
        # A stale doc is a file the change didn't touch, so "out of scope" also drops the docs a change
        # forgot. Once is a cut; raised again by another reviewer or round, it goes to the gate.
        again = None
        known = any(e["key"] == k and overlap(e, f) >= REPEAT for e in s["ledger"])
        if not known and not in_scope(s, f.get("file", "")):
            again = cut_before(s, f)
            if not again:
                remember_cut(s, f, "out of scope")
                print(f"OUT OF SCOPE, skipped: {f.get('file')} {f.get('symbol')}: {f.get('title')}")
                continue
            s["cut"] = [c for c in s["cut"] if not same_cut(c, f)]
            print(f"RAISED AGAIN, recorded: cut as out of scope in round {again['round']} ({again.get('persona')})")
        same_spot = [e for e in s["ledger"] if e["key"] == k]
        prior = max(same_spot, key=lambda e: overlap(e, f), default=None)
        if prior and overlap(prior, f) < REPEAT:
            spot, prior = prior, None
        else:
            spot = None
        if prior and f.get("persona") and f["persona"] not in prior["raised_by"]:
            prior["raised_by"].append(f["persona"])
        if prior and prior["status"] != "fixed":
            prior["seen"] += 1
            repeats.append(prior["id"])
            fx = f.get("fix")
            if prior["status"] == "new" and fx and fx != prior.get("fix") and fx not in prior.get("also", []):
                prior.setdefault("also", []).append(fx)  # a second reviewer may ask for more than the first
            continue
        # At a spot another reviewer raised, it is most likely a repeat the words missed, so it costs no slot; the
        # gate decides. The reviewer's own second finding at a spot is a new one, and counts.
        free = bool(spot) and f.get("persona") not in spot["raised_by"]
        if counted >= MAX_FINDINGS and not again and not free:
            again = cut_before(s, f)
            if not again:
                remember_cut(s, f, "past the per-reviewer cap")
                capped += 1
                continue
            s["cut"] = [c for c in s["cut"] if not same_cut(c, f)]
            print(f"RAISED AGAIN, recorded past the cap: cut in round {again['round']} ({again.get('persona')})")
        recorded += 1
        counted += not free
        if prior:  # raised again after a fix: reopen once, then treat as oscillation
            prior["reopened"] = prior.get("reopened", 0) + 1
            if prior["reopened"] > 1:
                prior["status"] = "wontfix"
                prior["note"] = "oscillating: re-raised after two fixes"
                print(f"OSCILLATING {prior['id']} {prior['file']} {prior['symbol']}: two reviewers likely want opposite things; report it, don't pick a side")
                continue
            prior["status"] = "new"
            prior["counted_round"] = s["round"]
            s["new_this_round"] += 1
            print(f"REOPENED {prior['id']} {prior['file']} {prior['symbol']}: {f.get('title')}")
            continue
        entry = {**f, "key": k, "id": f"F{len(s['ledger']) + 1}", "round": s["round"], "status": "new", "seen": 1,
                 "counted_round": s["round"], "raised_by": [f["persona"]] if f.get("persona") else []}
        if spot:
            entry["same_spot_as"] = spot["id"]
        s["ledger"].append(entry)
        s["new_this_round"] += 1
        tag = f" (same spot as {spot['id']}: gate decides if it's a repeat)" if spot else ""
        print(f"NEW {entry['id']}{tag} [{f.get('severity')}] {f.get('file')} {f.get('symbol')} ({f.get('lens')}, {f.get('persona', '-')}): {f.get('title')}")
        if spot and spot["status"] == "fixed":
            print(f"CHURN? {entry['id']} sits where {spot['id']} was fixed: if reverting {spot['id']} resolves it, make it an owner decision instead of another fix")
    if over:
        print(f"CAPPED: {over} findings in {a.file} past the first {MAX_WRITTEN} were not read")
    if capped:
        print(f"CAPPED: {capped} more new findings in {a.file} past the {MAX_FINDINGS} most severe were not recorded")
    below = len(cleaned) - len(found)
    if repeats or below:
        parts = ([f"repeats {', '.join(dict.fromkeys(repeats))}"] if repeats else []) + ([f"{below} below the bar"] if below else [])
        print(f"{os.path.basename(a.file)}: {len(cleaned)} read, {recorded} recorded; {', '.join(parts)}")
    save(a.dir, s)


def cmd_decide(a):
    s = load(a.dir)
    require_open(s, "decide")
    f = next((f for f in s["ledger"] if f["id"] == a.id), None)
    if f is None:
        sys.exit(f"no finding {a.id}")
    if a.status == "dropped" and f.get("counted_round") == s["round"]:
        s["new_this_round"] -= 1  # the gate rejected it, so it does not count against convergence
        f["counted_round"], f["uncounted_round"] = None, s["round"]
    elif a.status != "dropped" and f.get("uncounted_round") == s["round"]:
        s["new_this_round"] += 1  # a drop was overruled: it counts again
        f["counted_round"], f["uncounted_round"] = s["round"], None
    f["status"], f["note"] = a.status, a.note
    by_id = {e["id"]: e for e in s["ledger"]}
    same = next((m for m in re.findall(r"\bF\d+\b", a.note or "") if m != f["id"] and m in by_id), None)
    seen = {f["id"]}
    while same and by_id[same].get("duplicate_of") and same not in seen:
        # A duplicate of a duplicate joins the finding they both repeat, which is the one report counts.
        seen.add(same)
        same = by_id[same]["duplicate_of"]
    if same == f["id"]:
        same = None  # the chain leads back here: this finding is the one the others repeat
    if a.status == "dropped" and same and re.search(r"\brule 0\b", a.note, re.I):
        # A gate duplicate is the other finding raised again: its reviewers share that one, so report doesn't
        # charge a drop to whichever reviewer's add came later.
        f["duplicate_of"] = same
        by_id[same]["raised_by"] += [p for p in f.get("raised_by", []) if p not in by_id[same]["raised_by"]]
    elif a.status != "dropped":
        # shortcut: the names merged into the other finding's raised_by stay there, rare enough (an overruled
        # rule 0 drop) to leave; revisit if report counts look doubled after one.
        f.pop("duplicate_of", None)
    if a.status == "fixed":
        f["fixed_round"] = s["round"]
    if a.status == "fixed" and f.get("fix"):  # fixes that did less or more than this were the commonest cause of later rounds
        also = "".join(f"\nAlso proposed: {x[:300]}" for x in f.get("also", []))
        print(f"{f['id']} proposed: {f['fix'][:400]}{also}\nCheck the diff does all of it, deletions too, and nothing it doesn't name. If you fixed it another way, say why in a note.")
    save(a.dir, s)


def below_rule(path):
    with open(path) as fh:
        return fh.read().split("\n---\n", 1)[1].strip()


def intent_text(s):
    p = s.get("intent")
    if p and os.path.exists(p):
        with open(p) as fh:
            return fh.read().strip()[:3000]
    return ("Not recorded. Judge need from the code, the commit messages and the docs, and don't propose "
            "deleting what looks like the feature the change exists to deliver.")


def conventions_text(s):
    conv = ", ".join(f"`{c}`" for c in s.get("conventions") or [])
    return conv or "none recorded; use the project's instructions file (AGENTS.md or CLAUDE.md) if there is one"


def diff_lines(*refs):
    """Lines added plus removed in `git diff <refs>`, the loop's own files left out; binary files count 0."""
    total = 0
    for row in (git("diff", "--numstat", *refs, "--", ".", EXCLUDE) or "").splitlines():
        a_, d_ = row.split("\t")[:2]
        total += int(a_) + int(d_) if a_.isdigit() and d_.isdigit() else 0
    return total


def changed_lines(s):
    """Lines added plus removed since the base, untracked files included."""
    total = diff_lines(s["base"])
    for path in git_paths("ls-files", "--others", "--exclude-standard", "--", ".", EXCLUDE):
        try:
            with open(path, errors="replace") as fh:
                total += sum(1 for _ in fh)
        except OSError:
            pass
    return total


def change_text(s, full=False):
    """What this round reviews, with the diff embedded so reviewers don't spend turns finding it."""
    if s.get("mode") != "diff":
        return f"Review these paths whole: {' '.join(s['scope'])}."
    r = s["round"]
    since = s["base"] if full or r <= 1 or s.get("rereview") else s["round_head"].get(str(r - 1), s["base"])
    files = changed_files(s)
    if since == s["base"]:
        head = (f"The change under review is `git diff {short(s['base'])}` ({s.get('base_ref') or 'base'} to the working "
                f"tree), touching: {' '.join(files)}. Report only what this change adds or breaks; the rest of the code is context.")
    else:
        head = (f"This round reviews only the loop's own fixes from round {r - 1}: `git diff {short(since)}`. The whole "
                f"change is `git diff {short(s['base'])}`; read it for context, but report only what the fixes add or break.")
        asked = [f for f in s["ledger"] if f.get("fixed_round") == r - 1]
        if asked:
            head += ("\n\nWhat each fix was asked to do. A fix that does less (a deletion left out) or more (a wider type, "
                     "an extra test) than this, or whose note gives a false reason, is a finding:\n" + "\n".join(
                         f"- {f['id']} {f['file']}: {f['title']}. Proposed: {f.get('fix') or '-'}"
                         + (f" Fixer's note: {f['note']}" if f.get("note") else "") for f in asked))
    diff = git("diff", since, "--", ".", EXCLUDE) or ""
    untracked = (git("ls-files", "--others", "--exclude-standard", "--", ".", EXCLUDE) or "").split()
    if untracked:
        head += f" New untracked files, read them whole: {' '.join(untracked)}."
    if not diff:
        return head + "\n\nThe diff is empty."
    if len(diff.splitlines()) > MAX_DIFF_LINES:
        return head + f"\n\nThe diff is too long to embed; read it with the command above. Summary:\n\n```\n{git('diff', '--stat', since, '--', '.', EXCLUDE)}\n```"
    return head + f"\n\n```diff\n{diff}\n```"


def cmd_brief(a):
    s = load(a.dir)
    require_open(s, "brief")
    rnd = s["round"]
    if a.name == "gate":
        by_id = {f["id"]: f for f in s["ledger"]}
        fields = ("id", "file", "symbol", "lens", "severity", "title", "why", "fix")
        new = []
        for f in s["ledger"]:
            if f["status"] != "new":
                continue
            item = {k: f.get(k) for k in fields}
            if f.get("also"):
                item["also_proposed"] = f["also"]
            if f.get("same_spot_as"):
                ref = by_id[f["same_spot_as"]]
                item["same_spot_as"] = {k: ref.get(k) for k in ("id", "status", "title", "fix")}
            new.append(item)
        text = below_rule(os.path.join(SKILL_DIR, "gate.md"))
        text += (f"\n\nRepository root: `{os.getcwd()}`. The change is `git diff {short(s['base'])}`.\n\n"
                 f"What the session asked for and decided (for rule B):\n\n{intent_text(s)}\n\n"
                 f"Project conventions (for rule B): {conventions_text(s)}, plus `declined.md` next to them if it exists.\n\n"
                 f"Findings to rule on:\n\n```json\n{json.dumps(new, indent=1)}\n```\n")
    else:
        with open(os.path.join(SKILL_DIR, "personas", f"{a.name}.md")) as fh:
            moves = fh.read().split("## Moves", 1)[1].strip()
        # Reviewers don't open the evidence links, so drop them to keep the brief short.
        moves = "\n".join(re.sub(r"\s*https://.*$", "", line).rstrip(" :·") for line in moves.splitlines())
        text = below_rule(os.path.join(SKILL_DIR, "reviewer.md")).replace("<MOVES>", moves)
        for k, v in {"<SKILLS_DIR>": skills_dir(), "<CONVENTIONS>": conventions_text(s),
                     "<INTENT>": intent_text(s), "<CHANGE>": change_text(s, full=a.name in s.get("owed", [])), "<BASE>": short(s["base"]),
                     "<ROOT>": os.getcwd(), "<NAME>": a.name, "<SCOPE>": " ".join(changed_files(s)), "<OUT_FILE>": os.path.join(os.getcwd(), a.dir, f"r{rnd}-{a.name}.json"),
                     "<DECIDED>": "\n".join(decided_lines(s)) or "Nothing yet."}.items():
            text = text.replace(k, v)
        briefed = s.setdefault("briefed", {}).setdefault(str(rnd), [])
        if a.name not in briefed:
            briefed.append(a.name)
        trees = s.setdefault("review_tree", {})
        if str(rnd) not in trees:  # the first reviewer brief: what the tree looked like before any reviewer ran
            trees[str(rnd)] = {"state": tree_state(), "paths": status_paths()}
        if a.name in s.get("owed", []):
            s.setdefault("full_brief", {}).setdefault(str(rnd), []).append(a.name)
        save(a.dir, s)
    path = os.path.join(a.dir, f"r{rnd}-{a.name}.brief.md")
    with open(path, "w") as fh:
        fh.write(text)
    print(os.path.abspath(path))


def cmd_stop(a):
    s = load(a.dir)
    if s["status"] != "running":
        print(status_line(s))
        sys.exit(f"loop already {s['status']}")
    stop(a.dir, s, a.reason)


def run_checks(s, d):
    """The --check commands. Prints a CHECK FAILED block per failure."""
    results, failed = [], []
    for cmd in s.get("checks", []):
        code, out, err = sh(cmd)
        results.append([cmd, code == 0])
        if code:
            failed.append(f"{cmd} (exit {code})\n{tail(out + err)}")
    s["check_results"] = results
    for f in failed:
        print(f"CHECK FAILED: {f}")
    return failed


def cmd_check(a):
    """The checks once after a round's fixes, without closing it: faster than the whole suite after each fix."""
    s = load(a.dir)
    require_open(s, "check")
    failed = run_checks(s, a.dir)
    s["checked_tree"] = None if failed else worktree_tree()
    save(a.dir, s)
    if failed:
        sys.exit(1)
    print(f"CHECKS PASS: {', '.join(c for c, _ in s['check_results']) or 'no checks set'}")


def cmd_notrun(a):
    s = load(a.dir)
    require_open(s, "notrun")
    nr = s.setdefault("not_run", {}).setdefault(str(s["round"]), [])
    if a.name not in nr:
        nr.append(a.name)
    if a.name not in s.setdefault("owed", []):
        s["owed"].append(a.name)  # its next brief covers the whole change, and the loop can't converge until then
    save(a.dir, s)
    print(f"{a.name} recorded as not run in round {s['round']}: {a.reason}. This round can't count as clean.")


def cmd_end(a):
    s = load(a.dir)
    require_open(s, "end")
    open_items = [f["id"] for f in s["ledger"] if f["status"] in ("new", "kept")]
    if open_items:
        sys.exit(f"decide these before ending the round: {', '.join(open_items)}")
    rnd = str(s["round"])
    not_run = s.get("not_run", {}).get(rnd, [])
    missing = [p for p in s.get("briefed", {}).get(rnd, []) if p not in s.get("added", {}).get(rnd, []) and p not in not_run]
    if missing:
        sys.exit(f"no findings recorded for {', '.join(missing)}: `state.py add` its file, or retry it once and then `state.py notrun <name> <reason>`")
    # `check` passed on exactly this content: the round's commit since changed nothing the checks read.
    failed = [] if s.get("checked_tree") and s["checked_tree"] == worktree_tree() else run_checks(s, a.dir)
    s["failed_checks"] = failed
    head = s.get("round_head", {}).get(rnd)
    fix_lines = diff_lines(head, "HEAD") if head else 0
    s["round_open"] = False
    reviewed = s.get("added", {}).get(rnd, [])
    owed = s.get("owed", [])
    if not reviewed:
        print("NO REVIEWER this round: it can't count as clean")
    if owed:
        print(f"OWED: {', '.join(owed)} hasn't reviewed the whole change yet; its next brief covers it")
    clean = s["new_this_round"] == 0 and reviewed and not not_run and not failed and not owed
    s["clean_streak"] = s.get("clean_streak", 0) + 1 if clean else 0
    if s["clean_streak"] >= s.get("confirm_rounds", 1):
        s["status"] = "converged"
    elif s["round"] >= s["max_rounds"]:
        s["status"] = "capped"
    save(a.dir, s)
    print(status_line(s))
    if s["status"] == "capped" and not s.get("extended"):
        unreviewed_fixes(s, rnd, fix_lines)
    if s["status"] != "running":
        cmd_report(a)


def unreviewed_fixes(s, rnd, lines):
    """A capped round's fixes are reviewed by nobody. Large ones and bug fixes are worth one more round,
    whatever severity reviewers gave the findings (in practice nearly all medium)."""
    risky = [f["id"] for f in s["ledger"] if f.get("fixed_round") == int(rnd) and f["status"] == "fixed"
             and (f.get("lens") == "bug" or f.get("severity") == "high")]
    why = ([f"{lines} changed lines (over {FIX_REVIEW})"] if lines > FIX_REVIEW else []) + (
        [f"{', '.join(risky)} fix a bug or a high finding"] if risky else [])
    if why:
        print(f"UNREVIEWED FIXES: round {rnd}'s fixes: {'; '.join(why)}. One more round on the fixes is due: state.py extend")


def cmd_extend(a):
    s = load(a.dir)
    if s["status"] != "capped":
        sys.exit(f"only a capped loop can be extended; this one is {s['status']}")
    s["status"], s["max_rounds"] = "running", s["max_rounds"] + 1
    s["extended"] = s.get("extended", 0) + 1
    save(a.dir, s)
    print(status_line(s))


def cmd_status(a):
    print(status_line(load(a.dir)))


def cmd_report(a):
    tally, s = {}, load(a.dir)
    models = s.get("round_model", {})
    for f in s["ledger"]:
        if f.get("duplicate_of"):
            continue  # its reviewers were added to the finding it repeats
        raisers = f.get("raised_by") or ["-"]
        for name in raisers:
            # With --models, the same reviewer on two models counts apart, so the cheaper round can be judged.
            name = f"{name}@{models[str(f.get('round'))]}" if str(f.get("round")) in models else name
            t = tally.setdefault(name, {"raised": 0, "fixed": 0, "dropped": 0, "wontfix": 0, "only": 0, "only fixed": 0})
            t["raised"] += 1
            if f["status"] in t:
                t[f["status"]] += 1
            if len(raisers) == 1:
                t["only"] += 1
                t["only fixed"] += f["status"] == "fixed"
    print("persona | raised | fixed | dropped | wontfix | precision | only | only fixed   (a finding raised by two personas "
          "counts for both; duplicates the gate merged count once, for every reviewer that raised them)")
    for name, t in sorted(tally.items(), key=lambda kv: -kv[1]["fixed"]):
        print(f"{name} | {t['raised']} | {t['fixed']} | {t['dropped']} | {t['wontfix']} | {t['fixed'] / t['raised']:.0%}"
              f" | {t['only']} | {t['only fixed']}")


def cmd_pr(a):
    """The PR body's facts come from the ledger and the last checks; the agent writes the two TODO parts."""
    s = load(a.dir)
    led = s["ledger"]
    owner = [f for f in led if f["status"] == "wontfix" and "needs owner" in (f.get("note") or "")]
    left = [f for f in led if f["status"] == "wontfix" and f not in owner]
    reviewers = sorted({str(p) for f in led for p in f.get("raised_by", [])} | {p for r in s.get("briefed", {}).values() for p in r})
    loc = net_loc(s)
    out = ["## Summary", "", "TODO(summary): two or three sentences on what this change does and why, from the intent.", "",
           "## Review", "", f"{s['round']} review round(s) by fresh reviewers ({', '.join(reviewers) or 'none'}): "
           f"{s['status']}{', net ' + format(loc, '+d') + ' lines' if loc is not None else ''}."]
    fixed = [f for f in led if f["status"] == "fixed"]
    # In a diff review, later rounds see only the loop's fixes, so their findings are about states the PR never had.
    own = [f for f in fixed if s.get("mode") == "diff" and not s.get("rereview") and f.get("round", 1) > 1]
    changed = [f"- {f['title']}" for f in fixed if f not in own] + ([f"- plus {len(own)} correction{'' if len(own) == 1 else 's'} to the review's own fixes"] if own else [])
    if changed:
        out += ["", "Changed during review:"] + changed
    if left:
        out += ["", "Left as is:"] + [f"- {f['title']}" + (f" ({f['note']})" if f.get("note") else "") for f in left]
    last = [f["id"] for f in fixed if f.get("fixed_round") == s["round"]]
    if s["status"] == "capped" and last:
        out += ["", f"Round {s['round']}'s fixes ({', '.join(last)}) haven't been reviewed: the loop stopped at its round cap."]
    if owner:
        out += ["", "### Needs a decision"] + [f"- {f['title']}: {f['note']}" for f in owner]
    unresolved = [f for f in led if f["status"] in ("new", "kept")]
    if unresolved:
        out += ["", "### Not resolved (the loop stopped first)"] + [f"- {f['title']}" for f in unresolved]
    once = [c for c in s.get("cut", []) if c["reason"] != "below the bar" and not any(same_cut(c, e) for e in led)]
    if once:
        out += ["", "### Raised once, not recorded"] + [f"- {c['file']}: {c['title']} ({c['reason']})" for c in once]
    out += ["", "## Verification", ""] + [f"- `{c}`: {'passed' if ok else 'FAILED'}" for c, ok in s.get("check_results", [])]
    out += ["", "## Not checked", "", "TODO(not-checked): what mattered but wasn't verified, or \"Nothing.\"", ""]
    path = a.out or os.path.join(a.dir, "pr-body.md")
    with open(path, "w") as fh:
        fh.write("\n".join(out))
    print(os.path.abspath(path))


def selftest():
    root, cwd = tempfile.mkdtemp(), os.getcwd()
    os.chdir(root)
    try:
        _selftest()
    finally:
        os.chdir(cwd)
        shutil.rmtree(root)
    print("selftest ok")


def _selftest():
    g = lambda *a: subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *a], check=True, capture_output=True)
    put = lambda p, t: open(p, "w").write(t)
    g("init", "-q", "-b", "main"); put("a.py", "def f():\n    return 1\n"); g("add", "-A"); g("commit", "-qm", "base")
    g("checkout", "-qb", "feature"); put("a.py", "def f():\n    return 1\n\n\ndef added():\n    return 2\n"); g("commit", "-qam", "feature")
    d = ".review-loop"
    run = lambda *argv: main(list(argv) + ["--dir", d])
    write = lambda items, name="r0-x.json": (open(os.path.join(d, name), "w").write(json.dumps(items)), os.path.join(d, name))[1]

    def said(*argv):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            run(*argv)
        return buf.getvalue()

    P = ("--scope", ".")  # path mode: ledger tests that don't need a diff
    a = {"file": "a.py", "symbol": "f", "lens": "redundancy", "severity": "high", "title": "format_amount duplicates format_price"}
    run("init", *P); run("start"); run("add", write([{**a, "persona": "x"}])); out = said("add", write([{**a, "persona": "y", "title": "format_amount is a copy of format_price"}, {**a, "severity": "low"}]))
    assert load(d)["ledger"][0]["raised_by"] == ["x", "y"], "agreement across personas is recorded"
    assert open(".git/info/exclude").read().split("\n").count("/.review-loop/") == 1, "init keeps the loop's files out of git, once"
    assert "2 read, 0 recorded; repeats F1, 1 below the bar" in out, "add says what it skipped"
    run("init", *P); run("start"); run("add", write([{**a, "title": "main swallows every load error", "fix": "delete the try/except"}]))
    run("add", write([{**a, "title": "main reads argv[0] so --csv first breaks", "fix": "parse args with argparse"}]))
    run("add", write([{**a, "title": "main swallows load errors silently", "fix": "delete the try/except block and the unused logger"}]))
    s = load(d)
    assert len(s["ledger"]) == 2 and s["ledger"][1]["same_spot_as"] == "F1", "different issue at same spot is new; rewording is a repeat"
    assert s["ledger"][0]["also"] == ["delete the try/except block and the unused logger"], "a repeat's different fix is kept"
    run("brief", "gate"); assert "the unused logger" in open(os.path.join(d, "r1-gate.brief.md")).read(), "the gate sees every proposed fix"
    out = said("decide", "F1", "fixed")
    assert "F1 proposed: delete the try/except" in out and "Also proposed: delete the try/except block and the unused logger" in out, "marking a fix shows every proposed fix"
    run("init", *P, "--max-rounds", "3"); run("start"); run("add", write([a, {**a, "severity": "low", "symbol": "g"}]))
    s = load(d)
    assert len(s["ledger"]) == 1 and s["new_this_round"] == 1, "low severity filtered, one new"
    run("decide", "F1", "fixed"); run("end")
    assert load(d)["status"] == "running"
    assert "[fixed]" not in said("start"), "fixed findings aren't listed as decided, so a failed fix can be re-raised"
    run("add", write([{**a, "title": "format_amount is a copy of format_price", "file": "A.py "}]))
    assert load(d)["ledger"][0]["status"] == "new", "re-raised after fix reopens"
    run("decide", "F1", "fixed"); run("end")
    out = said("start") + said("add", write([{**a, "lens": "architecture"}, {**a, "symbol": "h", "severity": "medium"}]))
    s = load(d)
    assert s["ledger"][0]["status"] == "wontfix" and "OSCILLATING" in out, "second reopen is oscillation"
    run("decide", "F2", "dropped"); run("end")
    s = load(d)
    assert s["status"] == "converged" and s["round"] == 3, "gate-dropped finding does not block convergence"
    run("init", *P, "--max-rounds", "1"); run("start")
    try:
        run("start"); raise AssertionError("start must refuse while the round is open")
    except SystemExit:
        pass
    run("add", write([a])); run("decide", "F1", "fixed"); run("end")
    assert load(d)["status"] == "capped", "round cap ends the loop"
    run("extend"); assert load(d)["status"] == "running" and load(d)["max_rounds"] == 2, "extend allows one more round"
    run("init", *P, "--max-rounds", "1", "--models", "sonnet, opus"); out = said("start")
    assert "MODEL sonnet:" in out, f"round 1 takes the first model: {out}"
    run("add", write([a])); run("decide", "F1", "fixed"); run("end"); run("extend")
    assert "MODEL opus:" in said("start") and load(d)["round_model"] == {"1": "sonnet", "2": "opus"}, "a later round takes the last model"
    assert "x@sonnet | 1 | 1" in said("report"), "report splits a reviewer by the round's model"
    run("init", *P); assert "MODEL" not in said("start"), "no --models, no MODEL line"
    run("init", *P); run("start"); run("add", write([a])); run("decide", "F1", "fixed"); run("end")
    run("start"); run("add", write([a])); run("decide", "F1", "dropped", "gate: not the same problem"); run("end")
    assert load(d)["status"] == "converged", "a reopened finding the gate drops does not block convergence"
    run("init", *P); run("start"); run("add", write([{**a, "symbol": f"s{i}", "severity": "medium" if i else "high"} for i in range(7)]))
    assert len(load(d)["ledger"]) == 5 and load(d)["ledger"][0]["symbol"] == "s0", "a reviewer's 5 most severe findings are kept"
    run("init", *P); run("start"); run("add", write([a])); run("decide", "F1", "fixed"); run("end"); run("start")
    assert "CHURN?" in said("add", write([{**a, "title": "f now hides the parse error", "fix": "re-raise it"}])), "a new finding where a fix was made is flagged as churn"
    run("init", *P, "--max-rounds", "3", "--scope", "src/ lib/x.py"); run("start")
    run("add", write([{**a, "file": "src/a.py"}, {**a, "file": "other/b.py", "symbol": "z"}]))
    assert [f["file"] for f in load(d)["ledger"]] == ["src/a.py"], "out-of-scope findings are skipped"
    assert load(d)["cut"][0]["file"] == "other/b.py", "a skipped finding is remembered"
    run("decide", "F1", "dropped"); run("decide", "F1", "kept"); run("decide", "F1", "fixed"); run("end")
    assert load(d)["status"] == "running", "an overruled drop counts against convergence again"
    run("init", *P, "--max-rounds", "4"); run("start"); run("brief", "necessity")
    try:
        run("end"); raise AssertionError("end must refuse while a briefed reviewer has no findings")
    except SystemExit:
        pass
    run("notrun", "necessity", "timed out twice"); run("end")
    assert load(d)["status"] == "running", "a round with a reviewer not run isn't clean"
    run("init", *P, "--check", "true", "--check", "echo boom; exit 3"); run("start")
    assert "boom" in said("end") and load(d)["failed_checks"], "a failing check makes the round not clean and shows its output"
    # Diff mode: base, intent and the diff reach the brief; later rounds review only the loop's fixes.
    put(os.path.join(d, "intent.md"), "Asked for: a helper that returns two.\n")
    out = said("init", "--intent", os.path.join(d, "intent.md"))
    s = load(d)
    assert s["mode"] == "diff" and s["scope"] == ["a.py"] and s["base"] == git("rev-parse", "main"), f"diff mode from the default branch: {out}"
    assert "4 changed lines" in out and "SMALL CHANGE" in out and s["max_rounds"] == 1, f"a small diff gets one round: {out}"
    run("init", "--intent", os.path.join(d, "intent.md"), "--max-rounds", "3")
    run("start"); run("brief", "necessity"); run("add", write([a], "r1-necessity.json")); run("brief", "gate")
    for name in ("necessity", "gate"):
        text = open(os.path.join(d, f"r1-{name}.brief.md")).read()
        assert not re.search(r"<[A-Z][A-Z_]{2,}>|<base>|<name>", text), f"{name} brief has an unfilled placeholder"
        assert "a helper that returns two" in text, f"{name} brief carries the intent"
    text = open(os.path.join(d, "r1-necessity.brief.md")).read()
    assert "+def added():" in text and '"persona": "necessity"' in text and "https://" not in text, "brief embeds the diff, the name, no links"
    put("a.py", "def f():\n    return 1\n\n\ndef added():\n    return 1 + 1\n"); g("commit", "-qam", "round 1")
    run("decide", "F1", "fixed", "kept the old name for callers"); run("end"); run("start"); run("brief", "necessity")
    text = open(os.path.join(d, "r2-necessity.brief.md")).read()
    assert "only the loop's own fixes" in text and "+    return 1 + 1" in text and "+def added():" not in text, "round 2 reviews only the fixes"
    assert "- F1 a.py: format_amount duplicates format_price. Proposed: -" in text and "Fixer's note: kept the old name" in text, "round 2 sees what each fix was asked to do"
    run("add", write([{**a, "symbol": "added", "title": "added computes 1 + 1 for a constant"}], "r2-necessity.json")); run("decide", "F2", "fixed"); run("end")
    run("start"); run("add", write([{**a, "symbol": "g", "title": "g is unused"}], "r3-necessity.json")); run("decide", "F3", "fixed"); run("end")
    body = open(said("pr").strip()).read()
    assert load(d)["status"] == "capped" and "- format_amount duplicates format_price" in body and "g is unused" not in body, body
    assert "plus 2 corrections to the review's own fixes" in body and "Round 3's fixes (F3) haven't been reviewed" in body, "PR body: own-fix corrections summarised, unreviewed fixes named"
    run("init", "--rereview"); run("start"); run("brief", "necessity"); run("add", write([], "r1-necessity.json")); run("end")
    assert load(d)["status"] == "running", "--rereview needs two clean rounds"
    run("start"); text = open(said("brief", "necessity").strip()).read()
    assert "+def added():" in text, "--rereview reviews the whole change every round"
    run("add", write([], "r2-necessity.json")); run("end")
    assert load(d)["status"] == "converged", "two clean full rounds converge"
    run("init", *P, "--check", "true"); run("start"); run("add", write([{**a, "severity": "medium"}])); run("decide", "F1", "wontfix", "needs owner: changes output")
    run("end"); body = open(said("pr").strip()).read()
    assert "## Verification" in body and "`true`: passed" in body and "### Needs a decision" in body and "TODO(summary)" in body, "pr body from the ledger"
    run("stop", "red baseline"); assert load(d)["status"] == "stopped", "stop ends the loop"
    # Regressions from the QA pass: each line is a bug that once let the loop converge wrongly or crash.
    def refuses(*argv):
        try:
            run(*argv)
        except SystemExit as e:
            return e.code not in (None, 0)
        return False
    assert refuses("end") and refuses("add", write([a])) and refuses("decide", "F1", "fixed"), "a stopped loop can't be ended or edited"
    run("init", *P); assert refuses("end"), "end before start refuses"
    run("start"); run("add", write([], "r1-necessity.json")); run("end"); assert refuses("end"), "end twice refuses"
    run("init", *P); run("start"); run("end")
    assert load(d)["status"] == "running", "a round with no reviewer isn't clean"
    run("init", "--max-rounds", "3"); run("start"); run("brief", "necessity"); run("notrun", "necessity", "timed out"); run("end")
    run("start"); text = open(said("brief", "necessity").strip()).read()
    assert "+def added():" in text, "a reviewer that didn't run gets the whole change next time"
    run("add", write([], "r2-necessity.json")); run("end")
    s = load(d); assert s["status"] == "converged" and not s["owed"], "a clean make-up review of the whole change clears the debt"
    script = os.path.abspath(__file__)
    run("init", *P); run("start")
    procs = [subprocess.Popen([sys.executable, script, "add", write([{**a, "symbol": f"p{i}", "persona": f"p{i}"}], f"r1-p{i}.json"), "--dir", d],
                              stdout=subprocess.DEVNULL) for i in range(4)]
    [p.wait() for p in procs]
    assert len(load(d)["ledger"]) == 4, "parallel adds don't lose findings"
    run("init", *P, "--scope", "src/"); run("start")
    run("add", write([{**a, "file": f"other/{i}.py"} for i in range(5)] + [{**a, "file": "src/a.py", "severity": "medium"}], "r1-x.json"))
    assert [f["file"] for f in load(d)["ledger"]] == ["src/a.py"], "the cap counts only findings that get recorded"
    run("init", *P); run("start")
    out = said("add", write([{"file": "a.py", "symbol": "g", "severity": "critical", "title": "t1"}, {"file": "a.py", "severity": "High ", "title": "t2"},
                              {"file": "a.py", "title": "t3"}, {"symbol": "x", "title": "no file"}, {"file": "a.py", "title": "t4", "persona": ["a"]}], "r1-x.json"))
    s = load(d)
    assert [f["severity"] for f in s["ledger"]] == ["high", "high", "medium", "medium"] and "INVALID" in out and "UNKNOWN SEVERITY" in out, "severities normalised, invalid skipped"
    run("brief", "necessity"); run("decide", "F1", "wontfix", "x"); run("stop", "done"); body = open(said("pr").strip()).read()
    assert "Not resolved" in body and "t2" in body, "a stopped loop's PR body lists what's unresolved"
    write("[]", "notalist.json"); run("init", *P); run("start"); assert refuses("add", os.path.join(d, "notalist.json")), "a JSON string isn't a findings list"
    assert sh("sleep 3", timeout=1)[0] == 124 and sh("printf '\\377'")[0] == 0, "checks time out; odd bytes don't crash"
    put("my file.py", "x = 1\n"); open("caf\u00e9.py", "wb").write(b'x = "caf\xe9"\n'); g("add", "-A"); g("commit", "-qm", "odd names")
    run("init"); s = load(d)
    assert "my file.py" in s["scope"] and "caf\u00e9.py" in s["scope"], f"names with spaces and accents survive: {s['scope']}"
    run("start"); run("brief", "necessity")
    run("add", write([{**a, "file": "my file.py"}, {**a, "file": os.path.abspath("a.py"), "symbol": "q"}, {**a, "file": "a.py:5", "symbol": "r"}, {**a, "file": "../a.py", "symbol": "z"}], "r1-necessity.json"))
    assert len(load(d)["ledger"]) == 3, "spaces, absolute paths and file:line are in scope; ../ is not"


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("init", "start", "brief", "add", "notrun", "decide", "check", "end", "stop", "extend", "status", "report", "pr", "selftest"):
        sp = sub.add_parser(name)
        sp.add_argument("--dir", default=".review-loop")
    i = sub.choices["init"]
    i.add_argument("--base", help="the PR's base branch (default: origin's default branch, else main or master)")
    i.add_argument("--scope", help="review these paths whole instead of the diff (path mode)")
    i.add_argument("--intent", default=".review-loop/intent.md", help="what the session asked for and decided (default: %(default)s)")
    i.add_argument("--conventions", default="")
    i.add_argument("--check", action="append", help="a command that must exit 0 for a round to be clean; repeatable")
    i.add_argument("--max-rounds", type=int, default=None, help=f"round cap (default: 3; 1 under {SMALL_CHANGE} changed lines)")
    i.add_argument("--rereview", action="store_true", help="review the whole change every round; converge after two clean rounds")
    i.add_argument("--min-severity", choices=SEVERITY, default="medium")
    i.add_argument("--models", help="the reviewers' model per round, comma-separated (round n takes the n-th, later rounds the last)")
    sub.choices["add"].add_argument("file")
    sub.choices["brief"].add_argument("name")
    sub.choices["pr"].add_argument("--out")
    sub.choices["stop"].add_argument("reason")
    sub.choices["notrun"].add_argument("name")
    sub.choices["notrun"].add_argument("reason")
    sub.choices["decide"].add_argument("id")
    sub.choices["decide"].add_argument("status", choices=["kept", "dropped", "fixed", "wontfix"])
    sub.choices["decide"].add_argument("note", nargs="?", default="")
    a = p.parse_args(argv)
    if a.cmd == "selftest":
        return selftest()
    os.makedirs(a.dir, exist_ok=True)
    with open(os.path.join(a.dir, ".lock"), "w") as lock:
        if fcntl:
            fcntl.flock(lock, fcntl.LOCK_EX)
        globals()[f"cmd_{a.cmd}"](a)


if __name__ == "__main__":
    main()
