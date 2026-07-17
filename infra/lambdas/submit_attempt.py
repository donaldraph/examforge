"""POST /attempts — grade a finished attempt server-side and persist it.

Body: { "userId": "<uuid>", "examId": "github-actions", "answers": { "<qid>": "<optionId|null>", ... } }

Grading is authoritative here: the client's chosen option ids are scored against
the bundled answer key, so a client cannot claim a score it did not earn. The
attempt is stored and each domain's rolling aggregate is incremented in one shot.
"""
import datetime
import uuid

from boto3.dynamodb.conditions import Key  # noqa: F401  (kept for symmetry/tooling)

from common import (
    TABLE,
    respond,
    parse_body,
    to_dynamo,
    user_pk,
    attempt_sk,
    domain_sk,
)
from grade import load_bank, grade


def handler(event, context):
    body = parse_body(event)
    user_id = (body.get("userId") or "").strip()
    exam_id = (body.get("examId") or "").strip()
    answers = body.get("answers")

    if not user_id:
        return respond(400, {"error": "userId is required"})
    if not exam_id:
        return respond(400, {"error": "examId is required"})
    if not isinstance(answers, dict) or not answers:
        return respond(400, {"error": "answers must be a non-empty object"})

    bank = load_bank(exam_id)
    if not bank:
        return respond(404, {"error": f"no question bank for exam {exam_id}"})

    result = grade(bank, answers)
    if result["total"] == 0:
        return respond(400, {"error": "no answered questions matched this exam's bank"})

    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    attempt_id = f"{ts}#{uuid.uuid4().hex[:8]}"
    sk = attempt_sk(attempt_id, exam_id)

    TABLE.put_item(
        Item=to_dynamo(
            {
                "PK": user_pk(user_id),
                "SK": sk,
                "type": "attempt",
                "examId": exam_id,
                "createdAt": ts,
                "correct": result["correct"],
                "total": result["total"],
                "percent": result["percent"],
                "byDomain": result["byDomain"],
                "weakDomains": result["weakDomains"],
            }
        )
    )

    # Roll each domain's cumulative totals forward. ADD creates the item on first
    # touch, so no read-before-write is needed.
    for d in result["byDomain"]:
        TABLE.update_item(
            Key={"PK": user_pk(user_id), "SK": domain_sk(exam_id, d["domain"])},
            UpdateExpression=(
                "SET #ex = :ex, #dm = :dm, #ty = :ty "
                "ADD #qs :seen, #qc :correct, #at :one"
            ),
            ExpressionAttributeNames={
                "#ex": "examId",
                "#dm": "domain",
                "#ty": "type",
                "#qs": "questionsSeen",
                "#qc": "questionsCorrect",
                "#at": "attempts",
            },
            ExpressionAttributeValues=to_dynamo(
                {
                    ":ex": exam_id,
                    ":dm": d["domain"],
                    ":ty": "domain",
                    ":seen": d["total"],
                    ":correct": d["correct"],
                    ":one": 1,
                }
            ),
        )

    return respond(200, {"attemptId": attempt_id, "score": result})
