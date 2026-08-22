#!/usr/bin/env python3
import re, json, urllib.request

ATF_URL = "https://www.atf.gov/resource-center/current-processing-times"
req = urllib.request.Request("https://r.jina.ai/" + ATF_URL)
with urllib.request.urlopen(req, timeout=30) as resp:
    md = resp.read().decode("utf-8", errors="replace")

FORM_LABELS = [
    "Form 4 Trust", "Form 4 Individual", "Form 1", "Form 2", "Form 3",
    "Form 5", "Form 7", "Form 9", "Form 10", "Form 20",
]

period = re.search(r"applications finalized in ([A-Za-z]+ \d{4})", md, re.I)
report_month = period.group(1) if period else None

lines = md.split("\n")
table_lines = [ln for ln in lines if ln.strip().startswith("|") and "ATF Form" in ln and "Processing Office" not in ln.split("|")[1]]
# only keep data rows (contain a numeral form reference), skip the header separator row
data_lines = [ln for ln in table_lines if re.search(r"\*\*Form\s", ln)]

forms = []
for ln in data_lines:
    matched_label = None
    for label in FORM_LABELS:
        # match "**Form 4 Trust**" style ending, word-boundary safe
        if re.search(r"\*\*" + re.escape(label) + r"\*\*", ln):
            matched_label = label
            break
    if not matched_label:
        continue
    eform_m = re.search(r"eForms\*+\s*(-|\d+)", ln)
    paper_m = re.search(r"Paper\*+\s*(-|\d+)", ln)
    eform = None if (not eform_m or eform_m.group(1) == "-") else int(eform_m.group(1))
    paper = None if (not paper_m or paper_m.group(1) == "-") else int(paper_m.group(1))
    forms.append({"label": matched_label, "eform": eform, "paper": paper})

def grab(pattern):
    m = re.search(pattern, md, re.I)
    return int(m.group(1).replace(",", "")) if m else None

stats = {
    "totalNfaReceived": grab(r"Total number of NFA applications received\s*\|\s*\*?\*?([\d,]+)"),
    "silencerAppsReceived": grab(r"Total number of Form 4 silencer applications received\s*\|\s*\*?\*?([\d,]+)"),
    "nfaFinalized": grab(r"Total number of NFA applications finalized\s*\|\s*\*?\*?([\d,]+)"),
    "medianEForm4": grab(r"Median processing times for individual eForm 4 applications\s*\|\s*\*?\*?(\d+)"),
    "silencersRegistered": grab(r"Silencers\s*\|\s*\*?\*?([\d,]+)"),
    "sbrRegistered": grab(r"Short-Barreled Rifles\s*\|\s*\*?\*?([\d,]+)"),
}

result = {
    "reportMonth": report_month,
    "forms_found": len(forms),
    "forms": forms,
    "stats": stats,
}
with open("test_atf_final_parser_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
