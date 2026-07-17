"""POST /attempts — grade a finished attempt server-side and persist it.

Step 3 wires the route and the table grant; the grading, persistence, and
per-domain aggregate updates land in step 4. Until then this is an honest stub
so nothing silently pretends to have stored a score.
"""
from common import respond


def handler(event, context):
    return respond(501, {"error": "not implemented yet", "step": 4})
