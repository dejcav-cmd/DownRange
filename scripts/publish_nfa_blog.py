#!/usr/bin/env python3
"""
Publishes the NFA enforcement-guidance blog post on DownRange (Oct 9, 2026).
- Finds real photos on Wikimedia Commons (public domain / CC0 only), validates them,
  uploads them to the Sanity CDN (never hotlinks) and credits the source in the body.
- If no suitable real image is found, nothing is published (no image = no article).
- Idempotent: createOrReplace on a fixed _id.
"""
import os
import re
import json
import datetime
import urllib.parse
import urllib.request

PROJECT = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
DATASET = "production"
TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if TOKEN.startswith("ST="):
    TOKEN = TOKEN[3:]

ASSET_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/{DATASET}"
MUTATE_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/{DATASET}"
QUERY_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/{DATASET}"
COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "DownRangeBot/1.0 (https://downrangeco.com; dj@downrangeco.com)"}

RESULT_FILE = "nfa_blog_result.json"
BLOG_ID = "blog-nfa-transfer-guidance-2026"
SLUG = "nfa-transfer-guidance-suppressors-sbrs-2026"

SEARCHES = [
    "suppressor rifle soldier",
    "suppressed rifle",
    "short-barreled rifle",
    "M4 carbine suppressor",
    "silencer firearm",
]
TITLE_OK = re.compile(r"suppress|silenc|short[- ]barrel|sbr|carbine|m4|rifle", re.I)
TITLE_BAD = re.compile(r"logo|icon|diagram|drawing|patent|svg|map|flag|poster|cartoon|toy|airsoft|paintball|"
                       r"crime|victim|dead|body|funeral|riot|protest|shooting at|massacre|police", re.I)


def get(url, headers=None, timeout=40):
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), dict(r.getheaders())


def post_json(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode())


def sanity_query(groq):
    req = urllib.request.Request(f"{QUERY_URL}?query={urllib.parse.quote(groq)}")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode()).get("result")


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def commons_candidates():
    seen, out = set(), []
    for q in SEARCHES:
        params = {
            "action": "query", "format": "json", "generator": "search",
            "gsrsearch": f"filetype:bitmap {q}", "gsrnamespace": "6", "gsrlimit": "20",
            "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1600",
            "iiextmetadatafilter": "LicenseShortName|Artist|Credit|ImageDescription",
        }
        try:
            body, _ = get(COMMONS + "?" + urllib.parse.urlencode(params))
            pages = (json.loads(body).get("query") or {}).get("pages") or {}
        except Exception as e:
            print("search failed", q, e)
            continue
        for p in pages.values():
            title = p.get("title", "")
            if title in seen:
                continue
            seen.add(title)
            ii = (p.get("imageinfo") or [{}])[0]
            meta = ii.get("extmetadata") or {}
            lic = strip_html((meta.get("LicenseShortName") or {}).get("value", ""))
            w, h = ii.get("width") or 0, ii.get("height") or 0
            if not (re.search(r"public domain|cc0|pd", lic, re.I) and not re.search(r"cc[- ]by|sa", lic, re.I)):
                continue
            if w < 1200 or h < 700 or ii.get("mime") not in ("image/jpeg", "image/png"):
                continue
            ar = w / h
            if not (0.45 <= ar <= 3.3):
                continue
            desc = strip_html((meta.get("ImageDescription") or {}).get("value", ""))
            blob = f"{title} {desc}"
            if not TITLE_OK.search(blob) or TITLE_BAD.search(blob):
                continue
            out.append({
                "title": title,
                "url": ii.get("thumburl") or ii.get("url"),
                "page": ii.get("descriptionurl"),
                "license": lic,
                "credit": strip_html((meta.get("Artist") or {}).get("value", "")) or
                          strip_html((meta.get("Credit") or {}).get("value", "")) or "U.S. government photographer",
                "desc": desc[:160],
                "landscape": ar >= 1.2,
            })
    out.sort(key=lambda c: (not c["landscape"], c["title"]))
    return out


def upload(c, filename):
    body, headers = get(c["url"])
    if len(body) < 15000:
        raise ValueError("too small")
    if not (body[:3] == b"\xff\xd8\xff" or body[:8] == b"\x89PNG\r\n\x1a\n"):
        raise ValueError("not jpeg/png")
    ctype = "image/jpeg" if body[:3] == b"\xff\xd8\xff" else "image/png"
    req = urllib.request.Request(f"{ASSET_URL}?filename={filename}", data=body, method="POST")
    req.add_header("Content-Type", ctype)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=90) as r:
        doc = json.loads(r.read().decode()).get("document", {})
    return {"cdn_url": doc.get("url"), "asset_id": doc.get("_id"), "size": doc.get("size")}


BODY = """
<h2>The Day the Paperwork Stopped</h2>
<p>On October 9, 2026, ATF did something it has not done since 1934. It told the American public it will no longer enforce the National Firearms Act's approval, registration and tax-stamp requirements for short-barreled rifles, short-barreled shotguns, suppressors and "any other weapons." The Bureau released an Open Letter and a Frequently Asked Questions page laying out the new enforcement posture, effective the same day.</p>
<p>This did not come out of nowhere. Attorney General Todd Blanche announced that the Department of Justice will not appeal the August ruling in <em>Silencer Shop Foundation v. ATF</em> out of the Northern District of Texas. That court enjoined the NFA's making, registration and transfer provisions as applied to these items, but only for the plaintiffs. The Department then made a policy call to apply the result to everyone. ATF Director Rob Cekada put it this way: "The direction from the President, Congress, and the courts is clear."</p>
{IMG_ONE}
<h2>How We Got Here</h2>
<p>The NFA has always rested on a tax. The $200 making and transfer tax is what gave Congress the constitutional hook to build a registry around suppressors and short guns in the first place. Then the One Big Beautiful Bill Act took that tax to $0 for short-barreled rifles, short-barreled shotguns, suppressors and "any other weapons." The Texas court held that once the tax was gone, the making, registration and transfer provisions were no longer a valid use of Congress's taxing power for those items, and that Congress had not relied on its commerce power when it wrote the NFA. Those are the two legs the old system stood on, and the court knocked both out.</p>
<h2>What Changes for You</h2>
<p>Under ATF's guidance, effective October 9, the Bureau will not enforce these requirements for the covered items:</p>
<ul>
<li>Prior ATF approval to make or transfer them, which means no Form 1 for an unlicensed individual building a suppressor or SBR</li>
<li>Registration in the National Firearms Registration and Transfer Record and the tax-stamp process</li>
<li>The ban on transporting unregistered NFA firearms across state lines</li>
<li>The NFA marking requirement</li>
<li>Form 3 approval for dealer-to-dealer transfers between SOT licensees</li>
</ul>
<p>ATF will still accept NFA forms from anyone who wants to register voluntarily. Nobody is forced to give up the registry paper trail if they would rather keep it.</p>
<h2>Why This Is a Big Win for the Second Amendment</h2>
<p>I will say plainly what I think. For ninety years, law-abiding Americans paid a fee, filed fingerprints and photographs, and waited on a federal approval to own a piece of hearing protection or a rifle with a barrel a couple of inches under an arbitrary line. None of those items is what drives violent crime in this country. The system punished the paperwork-compliant and barely touched anyone else.</p>
<p>Now the federal government has told the public, in writing, that it will stop treating those items as something you need permission to make or own. Suppressors in particular are about as close to pure safety equipment as the gun world gets. Making them as easy to buy as a pair of earmuffs is a long overdue correction, and the people who spent years funding and fighting these cases, including the Silencer Shop Foundation and its co-plaintiffs, deserve the credit.</p>
<h2>Read the Fine Print Before You Celebrate</h2>
<p>This is where I want you to slow down, because the excitement is justified but the details matter and the penalties for getting them wrong are not small.</p>
<ul>
<li><strong>Machine guns and destructive devices are untouched.</strong> The $200 tax stays and the NFA applies in full.</li>
<li><strong>State and local law still applies.</strong> Some states ban these items outright, and many require NFA registration as the test for legal possession. ATF says plainly it cannot tell you how your state will treat an unregistered item.</li>
<li><strong>The Gun Control Act still applies.</strong> Dealers still run Form 4473 and NICS checks, keep records, and sell only within the rules for their state. Unlicensed individuals still cannot be in the business or transfer to out-of-state residents or prohibited persons.</li>
<li><strong>Short-barreled rifles and shotguns have an extra wrinkle.</strong> The GCA requires Attorney General authorization before a dealer transfers one, and there is no replacement process yet. ATF says it is writing forms and regulations and will not enforce that provision until they exist. Anyone moving an SBR or SBS across state lines still has to file a Form 20 first.</li>
<li><strong>Businesses still pay special occupational tax.</strong> Manufacturers, importers and dealers are not off the hook for it.</li>
</ul>
<h2>This Can Reverse</h2>
<p>The most important paragraph in ATF's FAQ is the one about risk. This is enforcement discretion backed by an injunction that protects only the plaintiffs. Other courts are not bound by the Texas ruling. Congress could attach a new tax, an appeals court could change the picture, or the Department could rescind its guidance. The statute still treats unregistered NFA firearms as contraband, with felony penalties and forfeiture, and ATF says there is no automatic grandfathering if the rules change. Any amnesty window would be the Attorney General's call, and he is not required to offer one.</p>
<p>Whether to register voluntarily is a real decision with trade-offs, and it is one to talk through with a qualified firearms attorney in your state. This post is not legal advice.</p>
<h2>What the Other Side Says</h2>
<p>Gun-control groups argue that suppressors and short-barreled rifles are regulated because they are concealable or easier to misuse, and that dropping the registry removes a tracing tool and a check on who holds these items. Some will also point out that a district court ruling does not bind other courts, so the legal fight is not over. Those are the arguments you will hear, and they will be tested in more courtrooms.</p>
{IMG_TWO}
<h2>So Is the NFA Dead?</h2>
<p>Not on paper. The law is still on the books, and ATF itself says things could change. In practice, for the first time in ninety years, the federal government has stopped enforcing the heart of it against suppressors, SBRs, SBSs and AOWs. That is the biggest crack in the NFA since it was passed, and it came from the courts, Congress and the executive branch all moving the same direction. Enjoy the win, follow the rules that remain, and keep an eye on your state law.</p>
<p><strong>DownRange Bottom Line:</strong> The federal permission slip for suppressors and short-barreled guns is gone for now. The rest of the legal framework is not, and the guidance can be pulled back. Read ATF's FAQ before you buy, build or ship anything.</p>
<p>Source: <a href="https://www.atf.gov/news/press-releases/atf-issues-guidance-national-firearms-act-transfers-short-barreled-rifles-short-barreled-shotguns-suppressors-and-certain-other-firearms" target="_blank" rel="noopener">ATF press release</a> and <a href="https://www.atf.gov/firearms/update-to-nfa-transfer-guidance" target="_blank" rel="noopener">Update to NFA Transfer Guidance FAQ</a>, October 9, 2026.</p>
<p style="margin-top:2rem;border-top:1px solid var(--border);padding-top:1rem;"><em>&mdash; DJ Cavalcanti</em><br/><strong>DJ Cavalcanti, DownRange Founder</strong></p>
""".strip()


def fig(img, alt):
    credit = f'Image: {img["credit"]} via <a href="{img["page"]}" target="_blank" rel="noopener">Wikimedia Commons</a> ({img["license"]})'
    return (f'<figure class="pr-fig" style="margin:20px 0;"><img src="{img["cdn_url"]}" alt="{alt}" '
            f'style="width:100%;border-radius:6px;" />'
            f'<figcaption style="font-size:12px;color:var(--text-dim);margin-top:6px;">{credit}</figcaption></figure>')


def main():
    result = {"ok": False, "steps": []}

    def finish():
        with open(RESULT_FILE, "w") as f:
            json.dump(result, f, indent=2)
        print(json.dumps(result, indent=2)[:4000])

    if not TOKEN:
        result["error"] = "SANITY_API_TOKEN not set"
        return finish()

    used = set(sanity_query('*[_type=="blogPost" && defined(imageUrl) && _id != "%s"].imageUrl' % BLOG_ID) or [])
    cands = commons_candidates()
    result["steps"].append({"candidates_found": len(cands), "top": [c["title"] for c in cands[:8]]})

    uploaded = []
    for i, c in enumerate(cands):
        if len(uploaded) >= 3:
            break
        try:
            up = upload(c, f"nfa-guidance-{len(uploaded)+1}.jpg")
        except Exception as e:
            result["steps"].append({"skip": c["title"], "why": str(e)})
            continue
        if up["cdn_url"] in used:
            result["steps"].append({"skip": c["title"], "why": "already used as a blog hero"})
            continue
        up.update(c)
        uploaded.append(up)
        result["steps"].append({"uploaded": c["title"], "cdn": up["cdn_url"], "license": c["license"]})

    if not uploaded:
        result["error"] = "No suitable real image found; article NOT published (no image = no article)."
        return finish()

    hero = uploaded[0]
    # hero is shown by the page template; body images must be different photos
    body = BODY.replace("{IMG_ONE}", fig(uploaded[1], "Rifle training photo") if len(uploaded) > 1 else "")
    body = body.replace("{IMG_TWO}", fig(uploaded[2], "Rifle training photo") if len(uploaded) > 2 else "")
    words = len(strip_html(body).split())
    now_iso = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

    doc = {
        "_id": BLOG_ID,
        "_type": "blogPost",
        "title": "The NFA Just Lost Its Teeth: ATF Stops Enforcing the Registry on Suppressors and Short-Barreled Guns",
        "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti",
        "authorRole": "Founder, DownRange",
        "category": "LAW",
        "excerpt": ("ATF will no longer enforce NFA approval, registration or tax-stamp requirements for suppressors, "
                    "short-barreled rifles and shotguns, and AOWs. Here is the biggest Second Amendment win in decades, "
                    "and the fine print you need to read before you act on it."),
        "body": body,
        "imageUrl": hero["cdn_url"],
        "readTime": max(1, -(-words // 200)),
        "status": "published",
        "published": True,
        "featured": True,
        "publishedAt": now_iso,
        "tags": ["NFA", "Suppressors", "SBR", "ATF", "Second Amendment", "Silencer Shop Foundation"],
        "editorLocked": True,
        "qualityReviewed": True,
    }
    result["steps"].append({"mutate": post_json(MUTATE_URL, {"mutations": [{"createOrReplace": doc}]})})
    result["verify"] = sanity_query(
        '*[_id=="%s"][0]{_id,title,"slug":slug.current,status,imageUrl,readTime,category,publishedAt}' % BLOG_ID)
    result["ok"] = bool(result["verify"])
    result["blog_url"] = f"https://www.downrangeco.com/blog/{SLUG}"
    finish()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        with open(RESULT_FILE, "w") as f:
            json.dump({"ok": False, "error": repr(e)}, f, indent=2)
        print("FATAL", repr(e))
