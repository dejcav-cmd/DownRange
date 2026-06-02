#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

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

BODY = """<p>Virginia State Police announced in late May 2026 that they intended to resume enforcing the state's universal background check law on private firearm transfers — even though a federal court had already blocked that enforcement with an injunction. The Firearms Policy Coalition and other gun rights organizations responded by filing a contempt motion, arguing the agency had crossed a line that the court system doesn't let slide: you don't get to ignore a court order because you disagree with it.</p>

<h2>What Virginia Did</h2>
<p>In 2020, Virginia enacted SB 70, requiring background checks on all firearm transfers, including private sales. Before the law, as in most states, private sales between individuals didn't require a NICS check. The new law closed that gap — or tried to. Gun rights groups immediately challenged it, and the litigation eventually produced a court injunction halting enforcement while the legal fight continued.</p>
<p>State Police decided that injunction was no longer their problem. Their announcement framed it as a policy clarification, but the practical effect was clear: they were moving forward with enforcement of a law the courts had told them to leave alone. Whether that was a tactical choice by the Youngkin administration's successor, a bureaucratic miscommunication, or a deliberate test of the injunction's staying power remains unclear. What's clear is that gun rights groups treated it as a direct defiance of judicial authority and responded accordingly.</p>

<h2>The Court Order VSP Ignored</h2>
<p>Federal injunctions are not suggestions. When a court issues preliminary injunctive relief, it means enforcement of the targeted law must stop while the court resolves the underlying constitutional question. Violating that order — intentionally or through willful ignorance — is contempt of court. It doesn't matter whether the agency believes the law is constitutional, or whether they think the injunction was wrongly issued. The order stands until a higher court changes it.</p>
<p>The injunction in this case was built on Second Amendment grounds, consistent with the framework established in <em>New York State Rifle &amp; Pistol Association v. Bruen</em> (2022). Under <em>Bruen</em>, firearms regulations must be consistent with the historical tradition of firearm regulation in America. Universal background check requirements on private sales don't have a clear analog in the Founding-era regulatory landscape, which is exactly the argument the challengers made. The district court agreed enough to issue the injunction — meaning the plaintiffs showed a likelihood of success on the merits.</p>

<h2>The Contempt Motion</h2>
<p>The Firearms Policy Coalition and co-plaintiffs filed a motion for contempt after the State Police announcement. Contempt motions in this context ask the court to: find that the defendant violated its order, impose sanctions or corrective measures, and require compliance going forward. Courts take contempt seriously — government agencies don't get to selectively obey court orders any more than private parties do. If the court agrees that VSP defied the injunction, it can impose fines, mandate compliance plans, and in extreme cases hold individual officials personally accountable.</p>
<p>FPC's contempt filing serves a dual purpose. First, it forces a court ruling on whether VSP's announcement actually violated the injunction — which will clarify the scope of the order and close any ambiguity VSP may have been exploiting. Second, it creates a public record that gun rights groups are watching and will respond to bureaucratic defiance with legal action, not just press releases.</p>

<h2>What This Means for Gun Owners</h2>
<p>If you're a Virginia resident who engages in private firearm transfers — buying a gun from a neighbor, selling to a friend, gifting within family — you're in a legally murky position while this plays out. The injunction theoretically protects you from prosecution under SB 70, but VSP's announcement signals the agency doesn't think they're bound by that protection. Getting caught in the middle of a contempt dispute isn't where you want to be.</p>
<p>The practical advice: consult the FPC's case page for current status before engaging in any private transfer. If VSP follows through on enforcement and the court hasn't yet ruled on the contempt motion, the risk of an enforcement action — even one that might ultimately be invalid — is real. Courts move slowly; prosecutors don't always wait for finality.</p>

<h2>What to Watch Next + DownRange Bottom Line</h2>
<p>The contempt motion ruling is the next significant event. If the court finds VSP in contempt, it will likely issue a clarifying order with teeth — real sanctions, real consequences for noncompliance. That outcome strengthens the injunction and makes future enforcement attempts riskier for the state. If the court declines to find contempt, VSP gets more room to maneuver, and the underlying constitutional challenge becomes the controlling battleground.</p>
<p>The underlying case itself is also worth watching. <em>Bruen</em>'s historical tradition framework has been applied inconsistently across circuits since 2022, and universal background check requirements on private sales are unresolved in most jurisdictions. Virginia could be a test case that produces precedent cutting one way or the other.</p>
<p><strong>DownRange Bottom Line:</strong> Virginia State Police decided a federal court injunction was optional. Gun rights groups decided it wasn't. The courts will settle this — but the willingness of a state law enforcement agency to openly defy an injunction protecting Second Amendment rights should concern every gun owner paying attention to how these laws get enforced. Watch the contempt ruling. That's where this goes next.</p>"""

slug = "virginia-state-police-defy-court-injunction-on-background-checks-gun-rights-groups-file-contempt"
article = sq('*[_type=="newsArticle" && slug.current=="' + slug + '"][0]{_id,title,body}')
print("Article found: " + str(bool(article)))
if article:
    print("Current body length: " + str(len(article.get("body","") or "")))
    mutate([{"patch": {"id": article["_id"], "set": {"body": BODY, "qualityReviewed": True}}}])
    print("Article written: " + str(len(BODY)) + " chars")
else:
    print("Article not found by slug, searching by title...")
    articles = sq('*[_type=="newsArticle" && title match "Virginia*police*injunction*"][0...3]{_id,title,slug}')
    for a in articles:
        print("  " + a.get("title","")[:60] + " | slug: " + str(a.get("slug",{}).get("current","")))

output = "Virginia article " + ("written" if article else "NOT FOUND") + ": " + str(len(BODY)) + " chars"

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
payload = {"message":"chore: virginia result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("DONE")
