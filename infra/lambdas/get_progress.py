"""GET /progress?userId=<uuid> — cumulative per-domain accuracy and weak domains.

Aggregates the rolling per-domain totals the submit route maintains, so this is a
single Query with no scan of the attempt history.
"""
from boto3.dynamodb.conditions import Key

from common import TABLE, respond, user_pk, DOMAIN_SK_PREFIX
from grade import WEAK_DOMAIN_THRESHOLD


def handler(event, context):
    params = event.get("queryStringParameters") or {}
    user_id = (params.get("userId") or "").strip()
    if not user_id:
        return respond(400, {"error": "userId is required"})

    res = TABLE.query(
        KeyConditionExpression=Key("PK").eq(user_pk(user_id))
        & Key("SK").begins_with(DOMAIN_SK_PREFIX),
    )

    progress = []
    for it in res.get("Items", []):
        seen = int(it.get("questionsSeen", 0))
        correct = int(it.get("questionsCorrect", 0))
        accuracy = round(correct / seen, 4) if seen else 0.0
        progress.append(
            {
                "examId": it.get("examId", ""),
                "domain": it.get("domain", ""),
                "questionsSeen": seen,
                "questionsCorrect": correct,
                "attempts": int(it.get("attempts", 0)),
                "accuracy": accuracy,
            }
        )

    progress.sort(key=lambda r: (r["examId"], r["domain"]))
    weak_domains = [
        r["domain"]
        for r in sorted(progress, key=lambda r: r["accuracy"])
        if r["questionsSeen"] > 0 and r["accuracy"] <= WEAK_DOMAIN_THRESHOLD
    ]

    return respond(200, {"progress": progress, "weakDomains": weak_domains})
