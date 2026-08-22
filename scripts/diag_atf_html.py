#!/usr/bin/env python3
import urllib.request

url = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DownRange/1.0)"})
with urllib.request.urlopen(req, timeout=20) as resp:
    html = resp.read().decode("utf-8", errors="replace")

with open("atf_raw.html", "w") as f:
    f.write(html)

idx = html.find("Form 1")
print("Total length:", len(html))
print("First 'Form 1' at index:", idx)
print("---SNIPPET AROUND FIRST Form 1 (2000 chars)---")
print(html[max(0, idx-500):idx+2000])
