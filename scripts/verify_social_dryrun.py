import json
import os
import urllib.error
import urllib.request

ADMIN_KEY = os.environ["ADMIN_KEY"]

req = urllib.request.Request(
    "https://www.downrangeco.com/api/social/cron/instagram",
    data=json.dumps({"dryRun": True, "count": 5}).encode(),
    method="POST",
    headers={"Content-Type": "application/json", "x-admin-key": ADMIN_KEY},
)
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
except urllib.error.HTTPError as e:
    result = {"ok": False, "http_error": e.code, "body": e.read().decode(errors="replace")[:2000]}
except Exception as e:
    result = {"ok": False, "error": f"{type(e).__name__}: {e}"}

with open("docs/social_dryrun_result.json", "w") as f:
    json.dump(result, f, indent=2)

print(json.dumps(result, indent=2))
