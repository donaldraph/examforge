"""GET /progress?userId= — per-domain rollup and weak domains.

Step 3 wires the route and the read grant; the query lands in step 4.
"""
from common import respond


def handler(event, context):
    return respond(501, {"error": "not implemented yet", "step": 4})
