#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}
GH_HDRS = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

ARTICLE_ID = "ca-261a587cbe458c917e69f36bb9f72676"

BODY = """<p>The week of June 1, 2026 brought a sharp escalation in the fight over Ottawa's mandatory firearm confiscation program, with Ontario's Premier Doug Ford facing renewed public pressure to do more than challenge the policy in court. A new poll from the Canadian Taxpayers Federation showed strong Ontario support for using provincial legislation — not just litigation — to block the federal grab outright.</p>\n\n<h2>CTF Poll: Ontarians Want Legislative Action, Not Just Lawsuits</h2>\n<p>The Canadian Taxpayers Federation published survey results showing a majority of Ontarians want Premier Ford to follow the lead of Alberta and Saskatchewan and pass legislation directly blocking Ottawa's confiscation scheme within provincial borders. Ford's government has joined the Canadian Coalition for Firearm Rights' Supreme Court challenge as an intervenor, arguing cabinet lacks the constitutional authority to order a sweeping ban by Order in Council. That's the right move legally — but the CTF argues it isn't enough.</p>\n<p>\"Ford is right to stand up for firearm owners in court, but he also needs to pass legislation to block the gun grab in Ontario,\" said Gage Haubrich, CTF Prairie Director. Ford has publicly called the program ineffective. \"You're focusing on the wrong group,\" he said. \"I support law-abiding hunters and gun owners.\" What he hasn't done is put that on paper in the form of a provincial statute.</p>\n\n<h2>Supreme Court Case Still Pending</h2>\n<p>The Supreme Court of Canada is still deciding whether to hear the CCFR's constitutional challenge. Ontario is among several provinces intervening, arguing the 2020 ban — which prohibited hundreds of rifle and shotgun models and ordered their mandatory surrender — exceeded the scope of cabinet's authority under the Criminal Code. British Columbia and Quebec remain the only provinces cooperating with the federal program. Every other province has refused to participate or is actively fighting it in court.</p>\n\n<h2>Confiscation Program: Still Near-Zero Compliance</h2>\n<p>Ottawa's Assault-Style Firearms Compensation Program continues to see dismal participation. The Liberals have been booking confiscation appointments while simultaneously claiming the program is \"voluntary\" — a characterization Prime Minister Carney has used repeatedly, contradicting the plain text of the enabling legislation. Public Safety Canada's 2026–27 departmental plan shows the program budget has now exceeded $1 billion CAD, with a fraction of estimated prohibited firearms actually surrendered.</p>\n<p>The government's own numbers, released through proactive disclosure, suggest only a few tens of thousands of firearms have been surrendered out of an estimated 100,000-plus affected. The definition of \"prohibited\" has expanded multiple times since 2020, making accurate counts difficult.</p>\n\n<h2>What This Means for Canadian Gun Owners</h2>\n<p>The gap between what Ottawa wants and what Canadians are doing speaks for itself. Compliance is low, provincial governments are obstructing, and the case is heading to the country's highest court. The CTF poll adds public pressure to an already strained legal and political situation for the federal Liberals.</p>\n<p>For licensed Canadian firearm owners, the practical advice remains unchanged: document everything, stay current on legal developments through CCFR and NFA, and watch the Supreme Court docket. The constitutional argument — that cabinet overreached its authority when it banned firearms by OIC without parliamentary vote — is the strongest legal tool in play right now.</p>\n\n<h2>What to Watch Next</h2>\n<p>The Supreme Court's leave-to-appeal decision on the CCFR case is the most consequential near-term event. If the court agrees to hear it, the ban's legal foundation is directly at issue. Ontario's legislative posture is also worth watching — Ford has the political will, and now has public polling backing legislative action. Whether Queen's Park follows Alberta and Saskatchewan with a formal blocking statute before the court rules could define the next phase of this fight.</p>\n\n<p><strong>DownRange Bottom Line:</strong> Ottawa spent over a billion dollars on a program most provinces won't enforce and most owners won't comply with. The Supreme Court may decide whether the whole thing was constitutional to begin with. The week of June 1 showed that even in Ontario — Canada's most populous province — the political ground is shifting toward harder resistance to the federal grab.</p>"""

mutations = [{
    "patch": {
        "id": ARTICLE_ID,
        "set": {
            "title": "Canada Gun Rights News: Week of 2026 June 01",
            "body": BODY,
            "active": True,
            "author": "DJ Cavalcanti",
            "qualityReviewed": True,
            "type": "article"
        }
    }
}]

url = BASE + "/mutate/production"
body = json.dumps({"mutations": mutations}).encode()
req = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
with urllib.request.urlopen(req, timeout=30) as r:
    result = json.loads(r.read())

print(json.dumps(result, indent=2))

output = "Article updated: " + ARTICLE_ID

req2 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req2) as r:
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
payload = {"message":"chore: article update result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
