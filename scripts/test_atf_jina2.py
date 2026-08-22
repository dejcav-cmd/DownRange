#!/usr/bin/env python3
import os, json, urllib.request

JINA_API_KEY = os.environ.get("JINA_API_KEY", "")
ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"

result = {}

# Test 1: default format, with API key
headers1 = {}
if JINA_API_KEY:
    headers1["Authorization"] = "Bearer " + JINA_API_KEY
try:
    req = urllib.request.Request("https://r.jina.ai/" + ATF_URL, headers=headers1)
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    result["default_format_with_key"] = {"status": "ok", "length": len(text), "snippet": text[:1500]}
except Exception as e:
    result["default_format_with_key"] = {"status": "error", "error": str(e)}

# Test 2: default format, no API key at all
try:
    req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    result["default_format_no_key"] = {"status": "ok", "length": len(text), "snippet": text[:1500]}
except Exception as e:
    result["default_format_no_key"] = {"status": "error", "error": str(e)}

with open("test_atf_jina2_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:3000])
