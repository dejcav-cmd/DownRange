#!/usr/bin/env python3
import re, json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
with urllib.request.urlopen(req, timeout=30) as resp:
    md = resp.read().decode("utf-8", errors="replace")

with open("atf_full_markdown.txt", "w") as f:
    f.write(md)

idx = md.find("Form 1")
result = {"total_length": len(md), "form1_index": idx}
result["snippet_around_table"] = md[max(0, idx-800):idx+4000]

with open("test_atf_markdown_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(result["snippet_around_table"][:3000])
