#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64, hashlib, time

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
GH_PAT       = os.environ.get("GH_PAT","")
PROJECT      = "vbnsqnkg"
BASE         = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
S_HDRS       = {"Authorization": "Bearer " + SANITY_TOKEN, "Content-Type": "application/json"}
GH_HDRS      = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
                "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + SANITY_TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=S_HDRS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# Fetch all youtubeInfluencer docs
influencers = sq('*[_type == "youtubeInfluencer"] { _id, channelName, hostName, email, youtubeUrl, subscribers, tier, focus, bio, whyGoodFit, notes, instagram, twitter, source, addedAt }')
print("Found " + str(len(influencers)) + " youtubeInfluencer docs to migrate")

mutations = []
to_delete = []

for inf in influencers:
    # Create new outreachContact doc with type='youtube_emerging'
    _id = "outreach-yt-" + hashlib.md5((inf.get("channelName","") + "yt").encode()).hexdigest()[:14]
    
    # Build specialties from focus array
    focus_map = {
        "gun-reviews": "rifle", "CCW-EDC": "CCW", "AR-15": "rifle",
        "AK-platform": "rifle", "pistols": "pistol", "revolvers": "pistol",
        "shotguns": "shotgun", "suppressors-NFA": "NFA", "long-range": "long-range",
        "competition-USPSA-IDPA": "competition", "hunting": "rifle",
        "2A-advocacy": "2A-advocacy", "2A-law": "2A-advocacy",
        "home-defense": "pistol", "training-tactics": "CCW",
        "ammo-testing": "rifle", "gear-accessories": "rifle",
        "historical-firearms": "rifle", "budget-guns": "rifle",
        "beginners": "pistol", "women-shooters": "CCW",
        "minority-2A": "2A-advocacy", "military-veteran": "rifle", "law-enforcement": "rifle",
    }
    specialties = list(set([focus_map.get(f, "rifle") for f in (inf.get("focus") or [])]))[:5]

    subs = inf.get("subscribers", 0)
    tier = inf.get("tier", "micro (10K–50K)")

    notes_parts = []
    if inf.get("bio"):        notes_parts.append("Bio: " + inf["bio"])
    if inf.get("whyGoodFit"): notes_parts.append("Fit: " + inf["whyGoodFit"])
    if tier:                  notes_parts.append("Tier: " + tier)
    if inf.get("focus"):      notes_parts.append("Focus: " + ", ".join(inf["focus"][:6]))
    
    doc = {
        "_id":          _id,
        "_type":        "outreachContact",
        "type":         "youtube_emerging",
        "name":         inf.get("channelName", ""),
        "firstName":    (inf.get("hostName") or "").split(" ")[0] if inf.get("hostName") else "",
        "email":        inf.get("email", ""),
        "youtubeUrl":   inf.get("youtubeUrl", ""),
        "subscribers":  subs,
        "instagram":    inf.get("instagram", "") or "",
        "twitter":      inf.get("twitter", "") or "",
        "specialties":  specialties,
        "notes":        "\n\n".join(notes_parts),
        "tags":         (inf.get("focus") or [])[:8],
        "country":      "USA",
        "status":       "active",
    }
    mutations.append({"createOrReplace": doc})
    to_delete.append(inf["_id"])

# Create outreachContact docs
if mutations:
    for i in range(0, len(mutations), 10):
        result = mutate(mutations[i:i+10])
        print("  Created batch " + str(i//10+1))
        time.sleep(0.3)
    print("Created " + str(len(mutations)) + " outreachContact docs")

# Delete old youtubeInfluencer docs
if to_delete:
    del_mutations = [{"delete": {"id": _id}} for _id in to_delete]
    for i in range(0, len(del_mutations), 10):
        mutate(del_mutations[i:i+10])
        time.sleep(0.2)
    print("Deleted " + str(len(to_delete)) + " youtubeInfluencer docs")

output = "Migrated " + str(len(mutations)) + " influencers to outreachContact type:youtube_emerging"
print(output)

req = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())["object"]["sha"]
try:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode(), headers=GH_HDRS, method="POST"), timeout=10)
except:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH"), timeout=10)
file_sha = None
try:
    req3 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(req3) as r: file_sha = json.loads(r.read())["sha"]
except: pass
payload = {"message":"chore: migration result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
