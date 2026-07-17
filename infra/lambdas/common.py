"""Shared helpers for every Lambda. Keeps the handlers small and consistent.

The table is single-table, keyed per user. See infra/lib/data-stack.ts for the
full layout; the key builders below are the one place those conventions live.
"""
import decimal
import json
import os

import boto3

_dynamodb = boto3.resource("dynamodb")
TABLE = _dynamodb.Table(os.environ["TABLE_NAME"])

CORS_HEADERS = {
    "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


# --- key builders: the single-table conventions, in one place --------------

def user_pk(user_id: str) -> str:
    return f"USER#{user_id}"


def attempt_sk(iso_ts: str, exam_id: str) -> str:
    return f"ATTEMPT#{iso_ts}#{exam_id}"


def domain_sk(exam_id: str, domain: str) -> str:
    return f"DOMAIN#{exam_id}#{domain}"


ATTEMPT_SK_PREFIX = "ATTEMPT#"
DOMAIN_SK_PREFIX = "DOMAIN#"


# --- response + serialization helpers --------------------------------------

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS_HEADERS},
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(o):
    if isinstance(o, decimal.Decimal):
        # Whole numbers come back as int, the rest as float, so JSON stays clean.
        return int(o) if o % 1 == 0 else float(o)
    return str(o)


def parse_body(event) -> dict:
    raw = event.get("body")
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return {}


def to_dynamo(obj):
    """Make a dict safe to put_item: DynamoDB rejects float, wants Decimal.

    Round-trips through JSON so every float becomes a Decimal in one shot.
    """
    return json.loads(json.dumps(obj, default=str), parse_float=decimal.Decimal)
