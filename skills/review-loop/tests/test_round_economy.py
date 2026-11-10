"""What a round spends its reviewers, checks and later rounds on, from the controlled run of 2026-11-10:
distinct findings per reviewer, one check per round, fixes reviewed when large, an order-free report and a
tree reviewers leave alone."""
import contextlib
import io
import os
import subprocess
import unittest

from test_cut_findings import Loop, quiet

import state

F = {"file": "src/a.py", "symbol": "s0", "lens": "redundancy", "severity": "medium", "title": "parse_row duplicates read_row",
     "fix": "call read_row"}


def distinct(i, **over):
    """A finding no other one repeats: its own symbol and words."""
    return {**F, "symbol": f"s{i}", "title": f"issue{i} alpha{i} beta{i}", "fix": f"gamma{i}", **over}


class Git(Loop):
    """A repo with one commit and a loop started in path mode, as init would leave it."""

    def setUp(self):
        super().setUp()
        self.git("init", "-q", "-b", "main")
        self.put("a.py", "x = 1\n")
        self.git("add", "-A")
        self.git("commit", "-qm", "base")

    def git(self, *args):
        subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], check=True, capture_output=True)

    def put(self, path, text):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w") as fh:
            fh.write(text)

    def run_(self, *argv):
        return quiet(*argv, "--dir", self.d)

    def commit_fix(self, lines):
        self.put("a.py", "".join(f"x{i} = {i}\n" for i in range(lines)))
        self.git("commit", "-qam", "fix")


class DistinctFindings(Loop):
    def test_findings_past_the_tenth_written_are_cut_not_recorded(self):
        self.state(scope=["."])
        self.round(1)
        self.add("x", [distinct(i) for i in range(5)])
        self.add("y", [distinct(i) for i in range(5, 10)])
        out = self.add("z", [distinct(i) for i in range(10)] + [distinct(10)])
        s = state.load(self.d)
        self.assertEqual(len(s["ledger"]), 10, out)
        self.assertEqual([c["reason"] for c in s["cut"]], ["past the per-reviewer cap"])
        self.assertIn("past the first 10 were not read", out)

    def test_a_same_spot_finding_is_recorded_without_taking_a_slot(self):
        self.state(scope=["."])
        self.round(1)
        self.add("x", [distinct(0)])
        self.add("y", [distinct(0, title="parse_row swallows the header error", fix="re-raise it")] + [distinct(i) for i in range(1, 6)])
        s = state.load(self.d)
        self.assertEqual(len(s["ledger"]), 7)
        self.assertEqual(s["ledger"][1]["same_spot_as"], "F1")

    def test_a_reviewers_own_findings_at_one_spot_each_take_a_slot(self):
        self.state(scope=["."])
        self.round(1)
        out = self.add("x", [distinct(i, symbol="s0") for i in range(7)])
        s = state.load(self.d)
        self.assertEqual(len(s["ledger"]), 5, out)
        self.assertEqual([c["reason"] for c in s["cut"]], ["past the per-reviewer cap"] * 2)

    def test_a_decision_tag_in_the_title_does_not_hide_a_repeat(self):
        tagged = {**F, "symbol": "DatePicker", "title": "D8 let scope follow what was easy to build: DatePicker carries five "
                  "options no caller or test sets", "fix": "delete the five options and every branch that reads them"}
        plain = {**F, "symbol": "DatePicker", "title": "DatePicker carries five options no caller sets",
                 "fix": "remove minDate, maxDate, locale, clearable and inline from its props, docs and stories"}
        self.assertGreaterEqual(state.overlap(tagged, plain), state.REPEAT)
        self.state(scope=["."])
        self.round(1)
        self.add("decisions", [tagged])
        self.add("matklad", [plain])
        s = state.load(self.d)
        self.assertEqual((len(s["ledger"]), s["ledger"][0]["raised_by"]), (1, ["decisions", "matklad"]))


class Check(Loop):
    def test_check_runs_the_checks_and_leaves_the_round_open(self):
        self.state(checks=["true"])
        self.round(1)
        out = quiet("check", "--dir", self.d)
        self.assertIn("CHECKS PASS: true", out)
        self.assertTrue(state.load(self.d)["round_open"])

    def test_a_failing_check_prints_its_output_and_exits_1(self):
        self.state(checks=["echo boom; exit 3"])
        self.round(1)
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf), self.assertRaises(SystemExit) as e:
            state.main(["check", "--dir", self.d])
        self.assertEqual(e.exception.code, 1)
        self.assertIn("CHECK FAILED: echo boom; exit 3 (exit 3)\nboom", buf.getvalue())

    def test_check_needs_an_open_round(self):
        self.state(checks=["true"])
        with self.assertRaises(SystemExit) as e:
            quiet("check", "--dir", self.d)
        self.assertIn("no round is open", str(e.exception.code))


class ChecksOncePerRound(Git):
    def setUp(self):
        super().setUp()
        self.runs = os.path.join(self.d, "runs")  # inside .review-loop, which is no part of the checked content
        self.run_("init", "--scope", ".", "--max-rounds", "2", "--check", f"echo run >> {self.runs}")
        self.run_("start")
        self.add("x", [F])
        self.put("a.py", "x = 2\n")
        self.run_("check")
        self.run_("decide", "F1", "fixed")

    def ran(self):
        with open(self.runs) as fh:
            return len(fh.readlines())

    def test_end_reuses_a_check_that_passed_on_the_content_the_round_committed(self):
        self.git("commit", "-qam", "fix")
        self.run_("end")
        self.assertEqual(self.ran(), 1)

    def test_end_runs_the_checks_again_when_the_content_changed_after_check(self):
        self.put("a.py", "x = 3\n")
        self.git("commit", "-qam", "fix")
        self.run_("end")
        self.assertEqual(self.ran(), 2)


class FailedCheck(Git):
    def test_end_runs_the_checks_again_after_a_check_that_failed(self):
        self.run_("init", "--scope", ".", "--max-rounds", "2", "--check", "test -f ok")
        self.run_("start")
        self.add("x", [F])
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(SystemExit):
            state.main(["check", "--dir", self.d])
        self.run_("decide", "F1", "fixed")
        self.assertIn("CHECK FAILED: test -f ok", self.run_("end"))


class UnreviewedFixes(Git):
    def capped_round(self, finding, lines=None):
        self.run_("init", "--scope", ".", "--max-rounds", "1")
        self.run_("start")
        self.add("x", [finding])
        self.run_("decide", "F1", "fixed")
        if lines:
            self.commit_fix(lines)
        return self.run_("end")

    def test_a_capped_bug_fix_is_due_one_more_round(self):
        out = self.capped_round({**F, "lens": "bug"}, lines=3)
        self.assertIn("UNREVIEWED FIXES: round 1's fixes: F1 fix a bug or a high finding.", out)
        self.assertIn("state.py extend", out)

    def test_a_capped_fix_of_a_high_finding_is_due_one_more_round(self):
        out = self.capped_round({**F, "severity": "high"}, lines=3)
        self.assertIn("UNREVIEWED FIXES: round 1's fixes: F1 fix a bug or a high finding.", out)

    def test_a_reverted_bug_fix_does_not_make_the_round_due(self):
        self.run_("init", "--scope", ".", "--max-rounds", "1")
        self.run_("start")
        self.add("x", [{**F, "lens": "bug"}])
        self.run_("decide", "F1", "fixed")
        self.run_("decide", "F1", "wontfix", "breaks test_rows")
        self.assertNotIn("UNREVIEWED FIXES", self.run_("end"))

    def test_a_bug_fixed_in_an_earlier_round_does_not_make_the_last_round_due(self):
        self.run_("init", "--scope", ".", "--max-rounds", "2")
        self.run_("start")
        self.add("x", [{**F, "lens": "bug"}])
        self.run_("decide", "F1", "fixed")
        self.commit_fix(3)
        self.run_("end")
        self.run_("start")
        self.add("x", [distinct(1)])
        self.run_("decide", "F2", "fixed")
        self.commit_fix(4)
        out = self.run_("end")
        self.assertEqual(state.load(self.d)["status"], "capped", out)
        self.assertNotIn("UNREVIEWED FIXES", out)

    def test_a_large_capped_fix_is_due_one_more_round_whatever_its_lens(self):
        out = self.capped_round(F, lines=200)
        self.assertIn("UNREVIEWED FIXES: round 1's fixes: 201 changed lines (over 150).", out)

    def test_a_small_capped_fix_is_accepted_as_is(self):
        out = self.capped_round(F, lines=3)
        self.assertNotIn("UNREVIEWED FIXES", out)

    def test_a_capped_round_that_committed_nothing_is_accepted_as_is(self):
        self.assertNotIn("UNREVIEWED FIXES", self.capped_round(F))

    def test_an_extended_loop_is_not_asked_to_extend_again(self):
        self.capped_round({**F, "lens": "bug"}, lines=3)
        self.run_("extend")
        self.run_("start")
        self.add("x", [distinct(1, lens="bug")])
        self.run_("decide", "F2", "fixed")
        self.commit_fix(300)
        self.assertNotIn("UNREVIEWED FIXES", self.run_("end"))


class OrderFreeReport(Loop):
    def report_after(self, first, second):
        self.state(scope=["."])
        self.round(1)
        self.add(first, [F])
        self.add(second, [{**F, "title": "read_row and parse_row hold one parser twice", "fix": "delete parse_row"}])
        quiet("decide", "F1", "fixed", "--dir", self.d)
        quiet("decide", "F2", "dropped", "rule 0: same issue as F1", "--dir", self.d)
        return quiet("report", "--dir", self.d)

    def test_report_does_not_depend_on_the_order_of_the_add_calls(self):
        one = self.report_after("necessity", "decisions")
        self.tearDown()
        self.setUp()
        two = self.report_after("decisions", "necessity")
        self.assertEqual(sorted(one.splitlines()), sorted(two.splitlines()))
        self.assertIn("necessity | 1 | 1 | 0 | 0 | 100% | 0 | 0", one)
        self.assertIn("duplicates the gate merged count once", one)

    def test_a_rule_0_drop_merges_its_reviewers_into_the_finding_it_repeats(self):
        self.report_after("necessity", "decisions")
        s = state.load(self.d)
        self.assertEqual((s["ledger"][1]["duplicate_of"], s["ledger"][0]["raised_by"]), ("F1", ["necessity", "decisions"]))

    def chain_report(self, notes):
        self.state(scope=["."])
        self.round(1)
        self.add("a", [F])
        self.add("b", [{**F, "title": "read_row and parse_row hold one parser twice", "fix": "delete parse_row"}])
        self.add("c", [{**F, "title": "two row parsers exist side by side", "fix": "keep only read_row"}])
        quiet("decide", "F1", "fixed", "--dir", self.d)
        for fid, note in notes:
            quiet("decide", fid, "dropped", note, "--dir", self.d)
        return quiet("report", "--dir", self.d)

    def test_a_duplicate_of_a_duplicate_counts_for_the_finding_they_both_repeat(self):
        forward = self.chain_report([("F2", "rule 0: same issue as F1"), ("F3", "rule 0: same issue as F2")])
        self.assertEqual(state.load(self.d)["ledger"][2]["duplicate_of"], "F1")
        self.tearDown()
        self.setUp()
        backward = self.chain_report([("F3", "rule 0: same issue as F2"), ("F2", "rule 0: same issue as F1")])
        self.assertEqual(sorted(forward.splitlines()), sorted(backward.splitlines()))
        self.assertIn("c | 1 | 1 | 0 | 0 | 100% | 0 | 0", forward)

    def test_a_duplicate_chain_that_leads_back_is_not_merged_into_itself(self):
        self.chain_report([("F2", "rule 0: same issue as F3"), ("F3", "rule 0: same issue as F2")])
        s = state.load(self.d)
        self.assertEqual((s["ledger"][1]["duplicate_of"], s["ledger"][2].get("duplicate_of")), ("F3", None))

    def test_an_overruled_duplicate_is_counted_again(self):
        self.report_after("necessity", "decisions")
        quiet("decide", "F2", "kept", "gate was wrong: a different bug", "--dir", self.d)
        self.assertNotIn("duplicate_of", state.load(self.d)["ledger"][1])

    def test_only_counts_what_no_other_reviewer_raised(self):
        self.state(scope=["."])
        self.round(1)
        self.add("necessity", [F, distinct(1)])
        self.add("matklad", [F])
        quiet("decide", "F2", "fixed", "--dir", self.d)
        out = quiet("report", "--dir", self.d)
        self.assertIn("necessity | 2 | 1 | 0 | 0 | 50% | 1 | 1", out)
        self.assertIn("matklad | 1 | 0 | 0 | 0 | 0% | 0 | 0", out)


class TreeLeftAlone(Git):
    def briefed(self):
        self.run_("init", "--scope", ".")
        self.run_("start")
        self.run_("brief", "necessity")

    def test_a_file_a_reviewer_creates_is_named_at_add(self):
        self.put("notes.txt", "mine\n")  # already there before the briefs: not the reviewer's
        self.briefed()
        self.put("build/out.txt", "made by a reviewer\n")
        out = self.add("necessity", [])
        self.assertIn("TREE CHANGED during review: build/out.txt;", out)
        self.assertNotIn("notes.txt", out)

    def test_the_warning_is_printed_once_per_round(self):
        self.briefed()
        self.put("out.txt", "x\n")
        self.add("necessity", [])
        self.assertNotIn("TREE CHANGED", self.add("matklad", []))

    def test_an_untouched_tree_prints_nothing(self):
        self.briefed()
        self.assertNotIn("TREE CHANGED", self.add("necessity", []))


if __name__ == "__main__":
    unittest.main()
