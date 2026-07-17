"""Server-authoritative grading. Pure functions, no AWS, so they unit-test
cleanly and mirror the frontend's lib/quiz.ts exactly. Correctness is matched by
option id, never by position.
"""
import json
import os

BANKS_DIR = os.path.join(os.path.dirname(__file__), "banks")

# A domain at or below this cumulative accuracy is flagged weak (matches the UI).
WEAK_DOMAIN_THRESHOLD = 0.7


def load_bank(exam_id: str):
    """Load a question bank by exam id from the bundled banks. Returns [] if the
    exam has no bank yet (a 'coming soon' exam)."""
    path = os.path.join(BANKS_DIR, "questions", f"{exam_id}.json")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def grade(bank, answers: dict):
    """Grade a finished attempt.

    `bank` is the authoritative question list; `answers` maps question id to the
    chosen option id (a null value means seen-but-unanswered, counted wrong).
    Only questions actually present in the attempt (the answer keys) are graded,
    so a subset quiz scores correctly and unknown ids are ignored.
    """
    index = {q["id"]: q for q in bank}
    graded = [index[qid] for qid in answers if qid in index]

    by_domain: dict = {}
    correct = 0
    for q in graded:
        chosen = answers.get(q["id"])
        right = chosen is not None and chosen == q["correctAnswerId"]
        if right:
            correct += 1
        d = by_domain.setdefault(q["domain"], {"correct": 0, "total": 0})
        d["total"] += 1
        if right:
            d["correct"] += 1

    total = len(graded)
    percent = 0 if total == 0 else round(correct / total * 100)

    by_domain_list = sorted(
        (
            {"domain": name, "correct": v["correct"], "total": v["total"]}
            for name, v in by_domain.items()
        ),
        key=lambda r: r["domain"],
    )
    weak_domains = [
        r["domain"]
        for r in sorted(by_domain_list, key=lambda r: r["correct"] / r["total"])
        if r["total"] > 0 and r["correct"] / r["total"] <= WEAK_DOMAIN_THRESHOLD
    ]

    return {
        "correct": correct,
        "total": total,
        "percent": percent,
        "byDomain": by_domain_list,
        "weakDomains": weak_domains,
    }
