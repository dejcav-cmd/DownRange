#!/usr/bin/env python3
import urllib.request, json, os, sys

# Try both possible key env vars
ADMIN_KEY = (os.environ.get("ADMIN_KEY") or 
             os.environ.get("AGENT_SECRET") or "")
BASE = "https://downrangeco.com"

print(f"Using key: {ADMIN_KEY[:8]}...{ADMIN_KEY[-4:] if len(ADMIN_KEY)>8 else ''}")

def call(path, method="GET", body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"x-admin-key": ADMIN_KEY, "Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()[:200]
        return {"error": f"HTTP {e.code}: {body_text}"}, e.code
    except Exception as e:
        return {"error": str(e)}, 0

print("=== GLM Live Test ===\n")

print("── Provider & Chain Status ─────────────────────────────")
d, status = call("/api/admin/ai-status")
if "error" in d:
    print(f"  ERROR: {d['error']}")
else:
    avail = d.get("available", {})
    chains = d.get("chains", {})
    print("  Providers:")
    for k, v in avail.items():
        print(f"    {'YES' if v else 'NO ':3s}  {k}")
    print()
    print("  Active chains (GLM = cost savings active):")
    for k, v in chains.items():
        glm_first = "glm" in v.split("->")[0].lower() if "->" in v else v.startswith("glm")
        mark = "✓ GLM FIRST" if glm_first else "  Anthropic "
        print(f"    {mark}  {k:15s}: {v}")
    glm_ok = avail.get("glm", False)
    print()
    print(f"  GLM_API_KEY in Vercel: {'YES ✓ — cost savings active' if glm_ok else 'NO ✗ — key not found'}")

print()
print("── Direct GLM call ─────────────────────────────────────")
d, status = call("/api/admin/ai-test", "POST", {
    "provider": "glm",
    "prompt": "Reply with only these words: GLM working",
    "maxTokens": 20
})
if "error" in d:
    print(f"  ERROR: {d['error']}")
else:
    result = d.get("text") or d.get("result") or d.get("response") or str(d)
    print(f"  Response: {str(result)[:100]}")
    ok = d.get("ok", False) or "glm" in str(result).lower() or "working" in str(result).lower()
    print(f"  Status: {'PASS ✓' if ok else 'CHECK OUTPUT'}")
    print(f"  Full: {json.dumps(d)[:300]}")

print()
print("=== Done ===")
