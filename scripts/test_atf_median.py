#!/usr/bin/env python3
import re, json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
with urllib.request.urlopen(req, timeout=30) as resp:
    md = resp.read().decode("utf-8", errors="replace")

idx = md.lower().find("median")
snippet = md[max(0,idx-100):idx+300] if idx >= 0 else "NOT FOUND"

with open("test_atf_median_result.json", "w") as f:
    json.dump({"idx": idx, "snippet": snippet}, f, indent=2)
print(snippet)
