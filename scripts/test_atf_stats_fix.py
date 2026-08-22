#!/usr/bin/env python3
import re, json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
with urllib.request.urlopen(req, timeout=30) as resp:
    md = resp.read().decode("utf-8", errors="replace")

def grab(label_pattern):
    # Match the label, then skip over any repeated bold-label junk (non-pipe chars),
    # landing on the LAST number-like token before the next pipe.
    m = re.search(label_pattern + r"\s*\|[^|\n]*?([\d,]+)\s*\|", md, re.I)
    return int(m.group(1).replace(",", "")) if m else None

stats = {
    "totalNfaReceived": grab(r"Total number of NFA applications received"),
    "silencerAppsReceived": grab(r"Total number of Form 4 silencer applications received"),
    "nfaFinalized": grab(r"Total number of NFA applications finalized"),
    "medianEForm4": grab(r"Median processing times for individual eForm 4 applications"),
    "silencersRegistered": grab(r"\bSilencers\b"),
    "sbrRegistered": grab(r"Short-Barreled Rifles"),
}

with open("test_atf_stats_fix_result.json", "w") as f:
    json.dump(stats, f, indent=2)
print(json.dumps(stats, indent=2))
