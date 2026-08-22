#!/usr/bin/env python3
import json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
with urllib.request.urlopen(req, timeout=30) as resp:
    md = resp.read().decode("utf-8", errors="replace")

idx = md.find("Average processing times for applications finalized")
result = {"total_length": len(md), "anchor_index": idx}
result["table_snippet"] = md[idx:idx+4500] if idx >= 0 else "ANCHOR NOT FOUND"

with open("test_atf_markdown2_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(result["table_snippet"][:4000])
