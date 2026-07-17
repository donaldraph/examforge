"""GET /attempts?userId=<uuid>&limit=N — attempt history, newest first."""
from boto3.dynamodb.conditions import Key

from common import TABLE, respond, user_pk, ATTEMPT_SK_PREFIX

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


def handler(event, context):
    params = event.get("queryStringParameters") or {}
    user_id = (params.get("userId") or "").strip()
    if not user_id:
        return respond(400, {"error": "userId is required"})

    try:
        limit = min(int(params.get("limit", DEFAULT_LIMIT)), MAX_LIMIT)
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT

    res = TABLE.query(
        KeyConditionExpression=Key("PK").eq(user_pk(user_id))
        & Key("SK").begins_with(ATTEMPT_SK_PREFIX),
        ScanIndexForward=False,  # ISO timestamps sort lexically -> newest first
        Limit=limit,
    )
    return respond(200, {"attempts": res.get("Items", [])})
