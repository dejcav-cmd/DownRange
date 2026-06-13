#!/usr/bin/env python3
import urllib.request, json, os

CRON_SECRET = os.environ.get("CRON_SECRET", "")
BASE = "https://downrangeco.com"

def call(path, method="GET", body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {
        "Authorization": f"Bearer {CRON_SECRET}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode()[:200]}"}, e.code
    except Exception as e:
        return {"error": str(e)}, 0

print("=== GLM Live Test ===\n")

print("── Provider & Chain Status ─────────────────────────────")
d, status = call("/api/admin/ai-status")
if "error" in d:
    print(f"  ERROR: {d['error']}")
else:
    avail  = d.get("available", {})
    chains = d.get("chains", {})
    print("  Providers present in Vercel:")
    for k, v in avail.items():
        print(f"    {'YES ✓' if v else 'NO  ✗'}  {k}")
    print()
    print("  Active chains:")
    for k, v in chains.items():
        glm_first = v.lower().startswith("glm")
        tag = "✓ GLM" if glm_first else "  ---"
        print(f"    {tag}  {k:15s}: {v}")
    glm_ok = avail.get("glm", False)
    print()
    print(f"  GLM_API_KEY detected: {'YES ✓ — cost savings ACTIVE' if glm_ok else 'NO ✗ — still using Anthropic'}")

print()
print("── Direct GLM call test ────────────────────────────────")
d, status = call("/api/admin/ai-test", "POST", {
    "provider": "glm",
    "prompt": "Reply with only: GLM working",
    "maxTokens": 20
})
if "error" in d:
    print(f"  ERROR: {d['error']}")
else:
    result = d.get("text") or d.get("result") or d.get("response") or str(d)
    ok = d.get("ok", False) or "working" in str(result).lower()
    print(f"  Response: {str(result)[:100]}")
    print(f"  Status:   {'PASS ✓' if ok else 'CHECK →'} {json.dumps(d)[:200]}")

print()
print("=== Done ===")
