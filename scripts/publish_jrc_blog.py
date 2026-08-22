#!/usr/bin/env python3
"""
Publishes the JRC Guns Glock Frame Weight System as a blogPost on DownRange.
- Downloads the real manufacturer product photos from jrcguns.com
- Uploads them to the Sanity CDN (never hotlinks)
- Creates/updates the blogPost document (idempotent via createOrReplace)
"""
import os
import re
import json
import datetime
import urllib.request

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

ASSET_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/{SANITY_DATASET}"
MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}"
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"

HERO_CANDIDATES = [
    "https://jrcguns.com/airo-assets/images/products/jrc-glock-frame-weight-2",
]
SECONDARY_CANDIDATES = [
    "https://jrcguns.com/airo-assets/images/products/jrc-glock-frame-weight",
    "https://jrcguns.com/airo-assets/images/products/jrc-glock-frame-weight-3",
]


def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read(), dict(resp.getheaders())


def http_post_json(url, payload, token):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanity_query(groq, token):
    import urllib.parse
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def upload_first_working(candidates, token, filename):
    last_err = None
    for url in candidates:
        try:
            body, headers = http_get(url)
            if len(body) < 5000:
                last_err = f"too small ({len(body)} bytes) from {url}"
                continue
            content_type = headers.get("Content-Type", "image/jpeg")
            req = urllib.request.Request(f"{ASSET_URL}?filename={filename}", data=body, method="POST")
            req.add_header("Content-Type", content_type)
            req.add_header("Authorization", f"Bearer {token}")
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            doc = result.get("document", {})
            return {"asset_id": doc.get("_id"), "cdn_url": doc.get("url"), "size": doc.get("size"), "source": url}
        except Exception as e:
            last_err = str(e)
            continue
    return {"asset_id": None, "cdn_url": None, "error": last_err}


BLOG_BODY = """
<h2>Six Ounces, Zero Reciprocating Mass</h2>
<p>JRC Guns just launched a Glock frame weight, and the pitch is refreshingly narrow: add about 6 ounces to the front of the gun, keep every bit of it off the slide, and let physics do the rest. The JRC Glock Frame Weight System bolts to the accessory rail under the barrel, and because the mass lives on the frame instead of the slide, it doesn't add a single gram to what's cycling back and forth when you pull the trigger.</p>
{secondary_img_tag}
<p>That distinction matters more than it sounds. A lot of the recoil-taming products on the market work by adding weight to the slide or barrel &mdash; a heavier guide rod, a compensator, a slide weight &mdash; and all of that mass has to accelerate and decelerate on every single shot. It's part of the reciprocating system, which means it changes how the gun cycles, and sometimes changes it in ways that hurt reliability with certain loads. A frame weight sidesteps that problem entirely. The mass just sits there, lowering the gun's balance point and giving the muzzle something to fight against on recoil, without ever moving relative to the frame.</p>
<h2>Built by Someone Who's Lived the Problem</h2>
<p>JRC Guns is a small Georgia shop run by John and Rachel Nagel, and the frame weight comes directly out of John's background &mdash; more than two decades building and shooting Glock competition guns as a gunsmith and machinist. That kind of pedigree matters for a product like this, because a frame weight lives or dies on tolerances: too loose and it rattles or shifts under recoil, too tight and it won't seat on the rail at all. Nagel's design goal, in his own words, was to put the weight "where it can help control muzzle rise" while keeping it off the reciprocating components &mdash; which is really just the plain-language version of what makes a frame weight work at all.</p>
<h2>Fit, Finish, and What It Costs</h2>
<p>The JRC Glock Frame Weight is precision-machined steel, compatible with Gen 3, Gen 4, and Gen 5 Glock pistols, and available in Armor Black or Flat Dark Earth. It mounts without touching the trigger group or any cycling parts, and for shooters who want more support up front, JRC sells an optional Modular Thumb Rest Kit that bolts onto the same weight. MSRP is $149.99, and it's shipping now directly from jrcguns.com.</p>
<h2>Where This Fits</h2>
<p>Frame weights aren't a new category &mdash; shops like SJC and Toni System have been building them for years &mdash; but most of that market is built by and for hardcore USPSA Open shooters running heavily modified guns. JRC's version reads more like a straightforward, no-drama option for someone who wants the recoil-control benefit on a stock or lightly modified Glock without hunting through a catalog of race-gun parts. At $149.99, it's priced right in line with the category, and the non-reciprocating design is the right call for anyone who doesn't want to second-guess their gun's reliability to shave off some muzzle flip.</p>
<p><strong>DownRange Bottom Line:</strong> If you shoot a Glock in competition, or just want flatter recoil for practice, a frame weight is one of the cheapest, lowest-risk upgrades on the market, and JRC's version does the fundamentals right &mdash; real weight, real machining, and zero impact on how the gun cycles. Worth a look if you're already comparing frame weights for USPSA or Steel Challenge.</p>
""".strip()


def main():
    if not SANITY_TOKEN:
        print(json.dumps({"ok": False, "error": "SANITY_API_TOKEN not set"}))
        return

    result = {"ok": False, "steps": []}

    hero = upload_first_working(HERO_CANDIDATES, SANITY_TOKEN, "jrc-glock-frame-weight-hero.jpg")
    result["steps"].append({"upload_hero": hero})
    secondary = upload_first_working(SECONDARY_CANDIDATES, SANITY_TOKEN, "jrc-glock-frame-weight-2.jpg")
    result["steps"].append({"upload_secondary": secondary})

    now_iso = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    blog_id = "blog-jrc-glock-frame-weight-2026"

    if secondary.get("asset_id"):
        img_tag = (
            f'<img src="{secondary["cdn_url"]}" alt="JRC Glock Frame Weight System, Armor Black finish" '
            'style="width:100%;border-radius:6px;margin:16px 0;" />'
        )
    else:
        img_tag = ""
    body_final = BLOG_BODY.format(secondary_img_tag=img_tag)
    plain_words = len(re.sub("<[^>]+>", " ", body_final).split())
    read_time = max(1, -(-plain_words // 200))

    blog_post_doc = {
        "_id": blog_id,
        "_type": "blogPost",
        "title": "JRC Guns' New Glock Frame Weight Adds 6 Ounces Where It Actually Helps",
        "slug": {"_type": "slug", "current": "jrc-guns-glock-frame-weight-2026"},
        "author": "DJ Cavalcanti",
        "authorRole": "Founder, DownRange",
        "category": "GEAR",
        "excerpt": "JRC Guns just launched a USA-made frame weight that adds 6 ounces to the front of your Glock without touching the slide. Here's why non-reciprocating mass is the whole point.",
        "body": body_final,
        "imageUrl": hero.get("cdn_url"),
        "readTime": read_time,
        "status": "published",
        "published": True,
        "featured": False,
        "publishedAt": now_iso,
        "tags": ["Glock", "Frame Weight", "Competition", "Recoil Control", "JRC Guns"],
        "editorLocked": True,
        "qualityReviewed": True,
    }

    mutate_result = http_post_json(MUTATE_URL, {"mutations": [{"createOrReplace": blog_post_doc}]}, SANITY_TOKEN)
    result["steps"].append({"mutate_result": mutate_result})

    verify = sanity_query(
        '*[_id == "%s"][0]{_id, title, slug, status, imageUrl, readTime, category, tags}' % blog_id,
        SANITY_TOKEN,
    )
    result["verify"] = verify.get("result")
    result["ok"] = bool(verify.get("result"))
    result["blog_url"] = "https://www.downrangeco.com/blog/jrc-guns-glock-frame-weight-2026"

    with open("jrc_publish_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
