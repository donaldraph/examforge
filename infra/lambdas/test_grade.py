"""Pure grading tests. Run: python3 test_grade.py  (no AWS, no deps).

Mirrors web/src/lib/quiz.test.ts so the server and client agree on what a score
means. Exits non-zero on any failure.
"""
from grade import grade, load_bank, WEAK_DOMAIN_THRESHOLD


def _q(qid, domain, correct_id):
    return {
        "id": qid,
        "domain": domain,
        "correctAnswerId": correct_id,
        "options": [{"id": "o1"}, {"id": "o2"}, {"id": "o3"}, {"id": "o4"}],
    }


def check(name, cond):
    if not cond:
        raise AssertionError(f"FAILED: {name}")
    print(f"  ok: {name}")


def main():
    # Matches by id regardless of position, unanswered counts wrong.
    bank = [_q("a", "D1", "o1"), _q("b", "D1", "o2"), _q("c", "D1", "o3")]
    r = grade(bank, {"a": "o1", "b": "o2", "c": "o1"})  # 2 of 3
    check("counts correct", r["correct"] == 2 and r["total"] == 3)
    check("rounded percent", r["percent"] == 67)

    r2 = grade(bank, {"a": "o1", "b": None, "c": "o3"})  # b unanswered
    check("null answer is wrong", r2["correct"] == 2)

    # Per-domain aggregation.
    bank2 = [_q("a", "Workflows", "o1"), _q("b", "Workflows", "o2"), _q("c", "Actions", "o3")]
    r3 = grade(bank2, {"a": "o1", "b": "o1", "c": "o3"})
    wf = next(d for d in r3["byDomain"] if d["domain"] == "Workflows")
    ac = next(d for d in r3["byDomain"] if d["domain"] == "Actions")
    check("workflows 1/2", wf == {"domain": "Workflows", "correct": 1, "total": 2})
    check("actions 1/1", ac == {"domain": "Actions", "correct": 1, "total": 1})

    # Weak domains: at or below threshold, worst first.
    bank3 = [
        _q("a", "Strong", "o1"), _q("b", "Strong", "o1"),
        _q("c", "Mid", "o1"), _q("d", "Mid", "o1"),
        _q("e", "Bad", "o1"), _q("f", "Bad", "o1"),
    ]
    r4 = grade(bank3, {"a": "o1", "b": "o1", "c": "o1", "d": "o2", "e": "o2", "f": "o2"})
    check("threshold is 0.7", WEAK_DOMAIN_THRESHOLD == 0.7)
    check("weak worst-first", r4["weakDomains"] == ["Bad", "Mid"])

    # Only graded questions in the attempt count; unknown ids ignored.
    r5 = grade(bank, {"a": "o1", "zzz": "o1"})
    check("unknown id ignored, subset graded", r5["total"] == 1 and r5["correct"] == 1)

    # Grades the real seed bank end to end (all correct = 100%, no weak domains).
    seed = load_bank("github-actions")
    check("seed bank loaded", len(seed) == 5)
    all_right = {q["id"]: q["correctAnswerId"] for q in seed}
    r6 = grade(seed, all_right)
    check("seed all-correct = 100", r6["percent"] == 100 and r6["weakDomains"] == [])
    all_wrong = {
        q["id"]: next(o["id"] for o in q["options"] if o["id"] != q["correctAnswerId"])
        for q in seed
    }
    r7 = grade(seed, all_wrong)
    check("seed all-wrong = 0", r7["percent"] == 0 and len(r7["weakDomains"]) == 4)

    print("\nALL GRADE TESTS PASSED")


if __name__ == "__main__":
    main()
