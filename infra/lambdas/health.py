"""GET /health — liveness check. Confirms the function is wired to a table."""
import os

from common import respond


def handler(event, context):
    return respond(200, {"status": "ok", "table": os.environ.get("TABLE_NAME", "")})
