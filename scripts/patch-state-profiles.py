#!/usr/bin/env python3
"""
Patch all 50 state profiles in Sanity with correct data
Runs via GitHub Actions with SANITY_TOKEN
"""
import urllib.request, urllib.parse, json, os, sys

TOKEN = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
DATASET = "production"
API = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

# Ground-truth state data (verified April 2026)
# Sources: NRA-ILA, state statutes, DownRange audit
STATE_CORRECTIONS = {
    "WA": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 10, "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Legal", "rating": "D",  "ccwPermit": "Concealed Pistol License (CPL)"},
    "CA": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 10, "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Prohibited", "rating": "F", "ccwPermit": "Concealed Carry Permit"},
    "IL": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 3,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Prohibited", "rating": "F", "ccwPermit": "FOID + CCLP"},
    "NY": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Prohibited", "rating": "F", "ccwPermit": "Pistol Permit (county-issued)"},
    "NJ": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 7,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Prohibited", "rating": "F", "ccwPermit": "Permit to Carry Handgun"},
    "MA": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Permit Required", "rating": "F", "ccwPermit": "License to Carry (LTC)"},
    "CT": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 14, "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Permit Required", "rating": "F", "ccwPermit": "Pistol Permit"},
    "MD": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 7,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Permit Required", "rating": "F", "ccwPermit": "Wear and Carry Permit"},
    "HI": {"magLimit": 10, "awbStatus": "Full",    "waitPeriod": 14, "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": True,  "openCarry": "Prohibited", "rating": "F", "ccwPermit": "License to Carry Loaded"},
    "CO": {"magLimit": 15, "awbStatus": "None",    "waitPeriod": 3,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "C", "ccwPermit": "Concealed Handgun Permit"},
    "DE": {"magLimit": 17, "awbStatus": "None",    "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "D", "ccwPermit": "License to Carry Concealed Deadly Weapon"},
    "RI": {"magLimit": 10, "awbStatus": "None",    "waitPeriod": 7,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": False, "bgcPrivate": False, "openCarry": "Prohibited", "rating": "D", "ccwPermit": "License to Carry"},
    "VT": {"magLimit": 10, "awbStatus": "None",    "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "C+", "ccwPermit": "No permit required (Constitutional Carry)"},
    "OR": {"magLimit": None,"awbStatus": "None",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "C", "ccwPermit": "Concealed Handgun License (CHL)"},
    "TX": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "License to Carry (LTC) — optional"},
    "FL": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 3,  "constitutionalCarry": True,  "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": False, "openCarry": "Prohibited", "rating": "B+", "ccwPermit": "Concealed Weapon License (CWL) — optional"},
    "GA": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Permit Required", "rating": "A-", "ccwPermit": "Weapons Carry License (WCL) — optional"},
    "AZ": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "Concealed Weapons Permit — optional"},
    "AK": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "WY": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "MT": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "ID": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "Enhanced Permit — optional"},
    "SD": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "ND": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "Class 1/2 Firearm License — optional"},
    "KS": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "OK": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "AR": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "MS": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "MO": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "IA": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 3,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A-","ccwPermit": "No permit required (Constitutional Carry)"},
    "TN": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "IN": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "OH": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A-","ccwPermit": "No permit required (Constitutional Carry)"},
    "AL": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "SC": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A-","ccwPermit": "No permit required (Constitutional Carry)"},
    "NC": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "B", "ccwPermit": "Concealed Handgun Permit"},
    "VA": {"magLimit": None,"awbStatus": "None",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "C", "ccwPermit": "Concealed Handgun Permit"},
    "PA": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "B+","ccwPermit": "License to Carry Firearms"},
    "MI": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 3,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "B", "ccwPermit": "Concealed Pistol License (CPL)"},
    "WI": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "B", "ccwPermit": "Concealed Carry Weapon (CCW) License"},
    "MN": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 7,  "constitutionalCarry": False, "redFlagLaw": True,  "suppressors": True,  "bgcPrivate": False, "openCarry": "Permit Required", "rating": "C+","ccwPermit": "Permit to Carry a Pistol"},
    "NV": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "B-","ccwPermit": "Concealed Firearm Permit"},
    "NM": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": True,  "openCarry": "Legal", "rating": "C", "ccwPermit": "Concealed Handgun License"},
    "KY": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "WV": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "LA": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": False, "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A-","ccwPermit": "Concealed Handgun Permit"},
    "ME": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "NH": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
    "UT": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "Concealed Firearm Permit — optional"},
    "NE": {"magLimit": None,"awbStatus": "none",   "waitPeriod": 0,  "constitutionalCarry": True,  "redFlagLaw": False, "suppressors": True,  "bgcPrivate": False, "openCarry": "Legal", "rating": "A", "ccwPermit": "No permit required (Constitutional Carry)"},
}

def sanity_query(q):
    url = f"{API}/query/{DATASET}?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url = f"{API}/mutate/{DATASET}?returnIds=true"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Step 1: Get all existing stateProfile docs
print("Fetching existing state profiles from Sanity...")
existing = sanity_query('*[_type == "stateProfile"]{ _id, abbr, name }')
existing_map = {doc["abbr"]: doc["_id"] for doc in existing}
print(f"Found {len(existing)} existing profiles: {sorted(existing_map.keys())}")

# Step 2: Patch each state
updated = []
created = []
errors = []

STATE_NAMES = {
    'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado',
    'CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho',
    'IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana',
    'ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi',
    'MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
    'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma',
    'OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota',
    'TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington',
    'WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
}

for abbr, fields in STATE_CORRECTIONS.items():
    try:
        if abbr in existing_map:
            # Patch existing doc
            doc_id = existing_map[abbr]
            result = sanity_mutate([{"patch": {"id": doc_id, "set": fields}}])
            updated.append(abbr)
            print(f"  ✅ PATCHED {abbr} — magLimit={fields.get('magLimit')}, awbStatus={fields.get('awbStatus')}, cc={fields.get('constitutionalCarry')}")
        else:
            # Create new doc
            doc = {
                "_type": "stateProfile",
                "name": STATE_NAMES.get(abbr, abbr),
                "abbr": abbr,
                **fields
            }
            result = sanity_mutate([{"create": doc}])
            created.append(abbr)
            print(f"  ✅ CREATED {abbr}")
    except Exception as e:
        errors.append(abbr)
        print(f"  ❌ ERROR {abbr}: {e}")

print(f"\nDone. Updated: {len(updated)}, Created: {len(created)}, Errors: {len(errors)}")
if errors:
    print(f"Errors: {errors}")

# Write result file
with open("scripts/diag-result.txt", "w") as f:
    f.write(f"State profile patch complete\n")
    f.write(f"Updated: {len(updated)} | Created: {len(created)} | Errors: {len(errors)}\n\n")
    f.write(f"Updated: {updated}\n")
    if errors:
        f.write(f"Errors: {errors}\n")
