"""Findings the loop cuts once must not be lost, plus old state files and archiving."""
import contextlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import state  # noqa: E402

def read(path):
    with open(path) as fh:
        return json.load(fh)


def quiet(*argv):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        state.main(list(argv))
    return buf.getvalue()


class Loop(unittest.TestCase):
    def setUp(self):
        self.root, self.cwd = os.path.realpath(tempfile.mkdtemp()), os.getcwd()
        os.chdir(self.root)
        self.d = os.path.join(self.root, ".review-loop")
        os.makedirs(self.d)

    def tearDown(self):
        os.chdir(self.cwd)
        shutil.rmtree(self.root)

    def state(self, **over):
        s = {"run": "abc123", "round": 0, "max_rounds": 5, "min_severity": "medium", "confirm_rounds": 1,
             "clean_streak": 0, "briefed": {}, "added": {}, "not_run": {}, "scope": ["src/a.py"], "conventions": [],
             "checks": [], "status": "running", "ledger": [], **over}
        state.save(self.d, s)

    def round(self, n):
        s = state.load(self.d)
        s["round"], s["round_open"], s["new_this_round"] = n, True, 0
        state.save(self.d, s)

    def add(self, name, findings):
        path = os.path.join(self.d, f"r{state.load(self.d)['round']}-{name}.json")
        with open(path, "w") as fh:
            json.dump(findings, fh)
        return quiet("add", path, "--dir", self.d)


DOC = {"file": "docs/guide.md", "symbol": "Brug standardværdi", "severity": "medium", "lens": "docs",
       "title": "The guide still says Brug standardværdi shows for every input", "fix": "update the guide"}


class CutFindings(Loop):
    def test_out_of_scope_once_is_remembered_not_recorded(self):
        self.state()
        self.round(1)
        out = self.add("x", [DOC])
        s = state.load(self.d)
        self.assertEqual(s["ledger"], [])
        self.assertIn("OUT OF SCOPE", out)
        self.assertEqual(s["cut"][0]["reason"], "out of scope")

    def test_out_of_scope_raised_again_is_recorded_once(self):
        self.state()
        self.round(1)
        self.add("x", [DOC])
        self.round(2)
        out = self.add("x", [{**DOC, "title": "The guide still promises Brug standardværdi on every input"}])
        s = state.load(self.d)
        self.assertEqual(len(s["ledger"]), 1, out)
        self.assertEqual(s["cut"], [])
        self.round(3)
        self.add("y", [DOC])  # a third sighting is a repeat of the ledger entry, not a new cut
        s = state.load(self.d)
        self.assertEqual((len(s["ledger"]), s["ledger"][0]["seen"], s["cut"]), (1, 2, []))

    def test_another_label_for_the_same_code_is_a_second_sighting(self):
        """Seen on the AgentBase run: two reviewers named one pair of routes differently."""
        self.state()
        self.round(1)
        self.add("x", [{**DOC, "symbol": "publish routes"}])
        self.add("y", [{**DOC, "symbol": "PublicationRefused handlers"}])
        self.assertEqual(len(state.load(self.d)["ledger"]), 1)

    def test_a_recorded_finding_leaves_no_cut_behind(self):
        """Two earlier cuts of one finding: recording the third sighting clears both, and the PR body
        does not list as "raised once" what the ledger holds."""
        self.state()
        self.round(1)
        s = state.load(self.d)
        s["cut"] = [{**DOC, "key": state.key(DOC), "round": 1, "persona": p, "reason": "out of scope"} for p in "xy"]
        state.save(self.d, s)
        self.add("z", [DOC])
        s = state.load(self.d)
        self.assertEqual((len(s["ledger"]), s["cut"]), (1, []))
        s["cut"] = [{**DOC, "key": state.key(DOC), "round": 1, "persona": "x", "reason": "out of scope"}]
        state.save(self.d, s)  # a state written before this fix
        out = os.path.join(self.d, "pr.md")
        quiet("pr", "--out", out, "--dir", self.d)
        with open(out) as fh:
            self.assertNotIn("Raised once", fh.read())

    def test_same_reviewer_same_round_is_not_a_second_sighting(self):
        self.state()
        self.round(1)
        self.add("x", [DOC, {**DOC, "title": "The guide still says Brug standardværdi shows everywhere"}])
        self.assertEqual(state.load(self.d)["ledger"], [])

    def test_capped_finding_raised_again_is_recorded(self):
        self.state(scope=["."])
        many = [{**DOC, "file": "src/a.py", "symbol": f"s{i}", "title": f"issue number {i} in s{i}"} for i in range(6)]
        self.round(1)
        self.add("x", many)
        self.assertEqual(len(state.load(self.d)["ledger"]), 5)
        self.assertEqual(state.load(self.d)["cut"][0]["reason"], "past the per-reviewer cap")
        self.round(2)
        self.add("y", many[-1:])
        self.assertEqual(len(state.load(self.d)["ledger"]), 6)

    def test_pr_body_lists_what_was_raised_once(self):
        self.state()
        self.round(1)
        self.add("x", [DOC, {**DOC, "file": "src/a.py", "severity": "low", "title": "nit"}])
        out = os.path.join(self.d, "pr.md")
        quiet("pr", "--out", out, "--dir", self.d)
        with open(out) as fh:
            body = fh.read()
        self.assertIn("### Raised once, not recorded", body)
        self.assertIn("docs/guide.md", body)
        self.assertNotIn("nit", body)


class OldState(Loop):
    def test_a_state_file_without_cut_still_loads_and_adds(self):
        self.state()  # written before "cut" existed
        self.round(1)
        self.add("x", [{**DOC, "file": "src/a.py"}])
        self.assertEqual(len(state.load(self.d)["ledger"]), 1)
        quiet("pr", "--out", os.path.join(self.d, "pr.md"), "--dir", self.d)


class Archive(Loop):
    def test_a_finished_run_is_copied_beside_the_shared_git_dir(self):
        subprocess.run(["git", "init", "-q", "-b", "feat/x"], check=True)
        self.state()
        self.round(1)
        self.add("x", [{**DOC, "file": "src/a.py"}])
        s = state.load(self.d)
        s["status"] = "stopped"
        state.save(self.d, s)
        dest = os.path.join(self.root, ".git", "review-loop", "feat_x--abc123")
        self.assertEqual(sorted(os.listdir(dest)), ["r1-x.json", "state.json"])

    def test_a_running_loop_is_not_archived(self):
        subprocess.run(["git", "init", "-q"], check=True)
        self.state()
        self.assertFalse(os.path.exists(os.path.join(self.root, ".git", "review-loop")))


if __name__ == "__main__":
    unittest.main()
