#!/usr/bin/env python3
import os, re, json, urllib.request

JINA_API_KEY = os.environ.get("JINA_API_KEY", "")
ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"

headers = {"X-Return-Format": "html"}
if JINA_API_KEY:
    headers["Authorization"] = "Bearer " + JINA_API_KEY

req = urllib.request.Request("https://r.jina.ai/" + ATF_URL, headers=headers)
result = {}
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    result["status"] = "ok"
    result["length"] = len(html)

    # Mirror the app's parsing logic
    period = re.search(r"applications finalized in ([A-Za-z]+ \d{4})", html, re.I)
    result["reportMonth"] = period.group(1) if period else None

    forms = []
    for row in re.finditer(r"<tr[^>]*>([\s\S]*?)</tr>", html, re.I):
        cells = [re.sub(r"&nbsp;", " ", re.sub(r"<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", row.group(1), re.I)]
        if len(cells) < 3:
            continue
        name = cells[0]
        if not re.match(r"^form\s", name, re.I):
            continue
        day_cells = [c for c in cells if re.match(r"^\d+\s*days?$", c, re.I) or re.match(r"^\d+$", c) or c in ("-", "—")]
        if len(day_cells) < 2:
            continue
        forms.append({"name": name, "day_cells": day_cells})

    result["forms_found"] = len(forms)
    result["forms"] = forms[:15]
    with open("atf_snippet.html", "w") as f:
        f.write(html[:5000])
except Exception as e:
    result["status"] = "error"
    result["error"] = str(e)

with open("test_atf_jina_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
