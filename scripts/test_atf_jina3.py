#!/usr/bin/env python3
import json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
result = {}

# anonymous + html format (no auth key at all)
try:
    req = urllib.request.Request("https://r.jina.ai/" + ATF_URL, headers={"X-Return-Format": "html"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    result["anon_html_format"] = {"status": "ok", "length": len(text), "snippet": text[:800]}
except Exception as e:
    result["anon_html_format"] = {"status": "error", "error": str(e)}

with open("test_atf_jina3_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:2000])
