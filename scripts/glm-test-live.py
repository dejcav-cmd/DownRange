#!/usr/bin/env python3
"""Test GLM integration via live Vercel endpoints."""
import urllib.request, json, os, sys

ADMIN_KEY = os.environ.get("AGENT_SECRET", os.environ.get("ADMIN_KEY", ""))
BASE = "https://downrangeco.com"

def call(path, method="GET", body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"x-admin-key": ADMIN_KEY, "Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode()[:200]}"}, e.code
    except Exception as e:
        return {"error": str(e)}, 0

print("=== GLM Live Test ===\n")

# 1. AI Status
print("── Provider & Chain Status ─────────────────────────────")
d, status = call("/api/admin/ai-status")
if "error" in d:
    print(f"  ERROR: {d['error']}")
else:
    avail = d.get("available", {})
    chains = d.get("chains", {})
    print("  Providers:")
    for k, v in avail.items():
        icon = "YES" if v else "NO "
        print(f"    {icon}  {k}")
    print()
    print("  Active chains (first = primary provider):")
    for k, v in chains.items():
        glm_first = v.startswith("glm")
        mark = "✓ GLM" if glm_first else "  ---"
        print(f"    {mark}  {k:15s}: {v}")
    glm_available = avail.get("glm", False)
    print()
    print(f"  GLM_API_KEY active: {'YES ✓' if glm_available else 'NO ✗ — key not reaching Vercel'}")

print()

# 2. Direct GLM test
print("── Direct GLM call ─────────────────────────────────────")
d, status = call("/api/admin/ai-test", "POST", {
    "provider": "glm",
    "prompt": "Reply with only these words: GLM working",
    "maxTokens": 20
})
if "error" in d:
    print(f"  ERROR: {d['error']}")
elif d.get("ok") or d.get("text") or d.get("result"):
    result = d.get("text") or d.get("result") or str(d)
    print(f"  Response: {result[:100]}")
    print(f"  Status: PASS ✓")
else:
    print(f"  Raw response: {json.dumps(d)[:300]}")

print()

# 3. Test news useCase routing (should pick GLM if available)
print("── News useCase routing test ────────────────────────────")
d, status = call("/api/admin/ai-test", "POST", {
    "useCase": "news",
    "prompt": "Say: routing works",
    "maxTokens": 20
})
provider = d.get("provider", d.get("model", "unknown"))
print(f"  Provider used: {provider}")
print(f"  GLM routing: {'YES ✓' if 'glm' in str(provider).lower() else 'NO — still on Anthropic'}")
print(f"  Raw: {json.dumps(d)[:200]}")

print()
print("=== Done ===")
