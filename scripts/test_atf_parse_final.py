#!/usr/bin/env python3
import re, json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL, headers={"X-Return-Format": "html"})
with urllib.request.urlopen(req, timeout=30) as resp:
    html = resp.read().decode("utf-8", errors="replace")

result = {"html_length": len(html)}

period = re.search(r"applications finalized in ([A-Za-z]+ \d{4})", html, re.I)
result["reportMonth"] = period.group(1) if period else None

FORM_MAP_KEYS = {
    'form 4 individual', 'form 4 trust', 'form 1', 'form 3', 'form 5',
    'form 2', 'form 9', 'form 10', 'form 20', 'form 7'
}

forms = []
for row in re.finditer(r"<tr[^>]*>([\s\S]*?)</tr>", html, re.I):
    cells_raw = re.findall(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", row.group(1), re.I)
    cells = [re.sub(r"&nbsp;", " ", re.sub(r"<[^>]+>", "", c)).strip() for c in cells_raw]
    if len(cells) < 3:
        continue
    name = cells[0]
    if not re.match(r"^form\s", name, re.I):
        continue
    day_cells = [c for c in cells if re.match(r"^\d+\s*days?$", c, re.I) or re.match(r"^\d+$", c) or c in ("-", "\u2014")]
    key = name.lower().strip()
    forms.append({
        "name": name,
        "key_in_map": key in FORM_MAP_KEYS,
        "all_cells": cells,
        "day_cells": day_cells,
    })

result["rows_found"] = len(forms)
result["forms"] = forms

# grab stats too
def grab(pattern):
    m = re.search(pattern, html, re.I)
    return int(m.group(1).replace(",", "")) if m else None

result["stats"] = {
    "silencerAppsReceived": grab(r"Total number of Form 4 silencer applications received[^\d]*([\d,]+)"),
    "totalNfaReceived": grab(r"Total number of NFA applications received[^\d]*([\d,]+)"),
    "nfaFinalized": grab(r"Total number of NFA applications finalized[^\d]*([\d,]+)"),
    "medianEForm4": grab(r"Median processing times for individual eForm 4 applications[^\d]*([\d,]+)"),
    "silencersRegistered": grab(r"Silencers[^\d]*([\d,]{6,})"),
    "sbrRegistered": grab(r"Short-Barreled Rifles[^\d]*([\d,]+)"),
}

with open("test_atf_parse_final_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:4000])
