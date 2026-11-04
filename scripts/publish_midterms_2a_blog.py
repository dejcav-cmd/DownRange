#!/usr/bin/env python3
"""
Publishes the 2026 midterms Second Amendment state-by-state blog post on DownRange.
- Hero: real photo from Wikimedia Commons (US Capitol), validated, uploaded to the Sanity CDN (never hotlinked).
- Body images: real public-domain/CC0 photos from Commons, validated, credited in captions.
- No valid hero = no article (nothing is published).
- Idempotent: createOrReplace on a fixed _id. Sets editor-written social copy and a timed social post.
"""
import os
import re
import json
import hashlib
import datetime
import urllib.parse
import urllib.request
import urllib.error
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midterms_2a_content as C  # noqa: E402

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

RESULT_FILE = "midterms_2a_blog_result.json"
BLOG_ID = "blog-midterms-2026-second-amendment"
SLUG = "midterms-2a-outlook-by-state-2026"
SITE = "https://www.downrangeco.com"

TITLE = "2026 Midterms: What the Results Mean for Gun Owners, State by State"
EXCERPT = ("Democrats took Congress and flipped Texas and Georgia, while two gun ballot measures won big. "
           "Our 50-state and D.C. Second Amendment outlook, with uncalled races marked.")
ALT_HERO = "U.S. Capitol east front, Washington, D.C."

HERO_TITLES = ["File:US Capitol east side.JPG", "File:United States Capitol - west front edit.jpg"]
BODY_SEARCHES = ["polling place voters", "voting booth", "ballot box election", "voters line election day", "state capitol building"]
BODY_OK = re.compile(r"poll|voting|voter|ballot|election|capitol", re.I)
BODY_BAD = re.compile(r"logo|icon|diagram|drawing|svg|map|flag|poster|cartoon|protest|riot|rally|campaign|"
                      r"portrait|official|trump|biden|harris|obama|clinton|candidate|crowd|police|shoot|"
                      r"\bUK\b|britain|british|england|scotland|wales|london|german|france|french|canad|india|japan|russia|"
                      r"australia|mexico|brazil|africa|korea|hong kong|taiwan|iraq|afghan|ukrain|example", re.I)

SOCIAL_COPY = {
    "twitter": "Democrats won Congress and flipped TX & GA. Gun owners, here is all 50 states:",
    "bluesky": ("Democrats took Congress and flipped Texas and Georgia, and two gun ballot measures won "
                "about 70% each. Our 50-state outlook, uncalled races marked."),
    "threads": ("The morning-after map for gun owners: Democrats won Congress and flipped governors in TX, GA, NV, OH and IA. "
                "Massachusetts kept its gun law (~69%). Arkansas voted ~70% to strengthen its arms right. "
                "We went through all 50 states + D.C.: who won, what is still uncalled, and what could change in 2027."),
    "facebook": ("Election results are in, and the Second Amendment map looks different this morning. Democrats won Congress and "
                 "flipped governors in Texas, Georgia, Nevada, Ohio and Iowa. Massachusetts voters kept their 2024 gun law, while "
                 "Arkansas approved a stronger arms-rights amendment with roughly 70%. We built a state-by-state outlook for all "
                 "50 states and D.C., with every uncalled race marked as uncalled and every source linked. Where does your state land?"),
    "instagram": ("Congress flipped. Texas and Georgia got new governors. Two gun ballot measures passed with roughly 70% each, "
                  "in opposite directions. Here is what the 2026 midterms mean for gun owners in all 50 states and D.C., with "
                  "uncalled races marked and sources linked."),
    "reddit": ("2026 midterms: Democrats win Congress, TX and GA flip to Democratic governors, Massachusetts keeps its gun law, "
               "Arkansas expands its arms right. State-by-state Second Amendment outlook with uncalled races marked"),
}
SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "threads", "bluesky", "reddit"]
TAGS = ["Midterms 2026", "Second Amendment", "Gun Laws", "State Gun Laws", "Election Results", "Gun Rights",
        "NFA", "Supreme Court", "Texas", "Georgia", "Nevada", "North Carolina", "Massachusetts", "Arkansas"]

DEBUG = []


def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), dict(r.getheaders())


def post_json(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def sanity_query(groq):
    req = urllib.request.Request(f"{QUERY_URL}?query={urllib.parse.quote(groq)}")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode()).get("result")


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def img_dims(b):
    try:
        if b[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", b[16:24])
        if b[:3] == b"\xff\xd8\xff":
            i = 2
            while i < len(b) - 9:
                if b[i] != 0xFF:
                    i += 1
                    continue
                m = b[i + 1]
                if m in (0xC0, 0xC1, 0xC2):
                    h, w = struct.unpack(">HH", b[i + 5:i + 9])
                    return w, h
                i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
    except Exception:
        pass
    return None


def commons_info(titles):
    params = {"action": "query", "format": "json", "titles": "|".join(titles), "prop": "imageinfo",
              "iiprop": "url|size|mime|extmetadata",
              "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription"}
    body, _ = get(COMMONS + "?" + urllib.parse.urlencode(params))
    return list(((json.loads(body).get("query") or {}).get("pages") or {}).values())


def to_cand(p, use_thumb=False):
    ii = (p.get("imageinfo") or [{}])[0]
    meta = ii.get("extmetadata") or {}
    return {
        "title": p.get("title", ""),
        "url": ii.get("url"),
        "page": ii.get("descriptionurl"),
        "w": ii.get("width") or 0, "h": ii.get("height") or 0, "mime": ii.get("mime"),
        "license": strip_html((meta.get("LicenseShortName") or {}).get("value", "")),
        "license_url": strip_html((meta.get("LicenseUrl") or {}).get("value", "")),
        "artist": strip_html((meta.get("Artist") or {}).get("value", "")),
        "desc": strip_html((meta.get("ImageDescription") or {}).get("value", ""))[:160],
    }


def download_validate(url, min_w=400, min_h=240):
    body, _ = get(url, UA, timeout=120)
    if len(body) < 15000:
        raise ValueError(f"too small {len(body)}")
    if not (body[:3] == b"\xff\xd8\xff" or body[:8] == b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"not jpeg/png head={body[:12]!r}")
    d = img_dims(body)
    if not d or d[0] < min_w or d[1] < min_h or not (0.45 <= d[0] / d[1] <= 3.3):
        raise ValueError(f"bad dims {d}")
    return body, d


def upload(body, filename):
    ctype = "image/jpeg" if body[:3] == b"\xff\xd8\xff" else "image/png"
    req = urllib.request.Request(f"{ASSET_URL}?filename={filename}", data=body, method="POST")
    req.add_header("Content-Type", ctype)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=120) as r:
        doc = json.loads(r.read().decode()).get("document", {})
    return {"cdn_url": doc.get("url"), "asset_id": doc.get("_id")}


def used_images():
    """Sanity CDN urls (and sha1 hashes embedded in them) of every other blog post's image."""
    rows = sanity_query('*[_type=="blogPost" && _id != "%s"]{imageUrl, "body": body}' % BLOG_ID) or []
    urls = set()
    for r in rows:
        if r.get("imageUrl"):
            urls.add(r["imageUrl"])
        for m in re.findall(r"https://cdn\.sanity\.io/images/[^\"'\s)]+", r.get("body") or ""):
            urls.add(m)
    return urls


def is_used(sha1, used):
    return any(sha1 in u for u in used)


def pick_hero(used):
    steps = []
    for t in HERO_TITLES:
        try:
            pages = commons_info([t])
            cand = to_cand(pages[0]) if pages else None
        except Exception as e:
            steps.append({"hero": t, "error": f"api {e}"})
            continue
        if not cand or not cand["url"]:
            steps.append({"hero": t, "error": "no imageinfo"})
            continue
        try:
            body, d = download_validate(cand["url"], 1200, 700)
        except Exception as e:
            steps.append({"hero": t, "error": f"validate {e}", "api_dims": [cand["w"], cand["h"]]})
            continue
        sha1 = hashlib.sha1(body).hexdigest()
        if is_used(sha1, used):
            steps.append({"hero": t, "skip": "already used on another blog post"})
            continue
        up = upload(body, "midterms-2026-hero.jpg")
        cand.update(up)
        cand["dims"] = list(d)
        cand["bytes"] = len(body)
        steps.append({"hero": t, "uploaded": up["cdn_url"], "dims": list(d), "license": cand["license"]})
        return cand, steps
    return None, steps


BODY_CATS = ["Category:Voting in the United States", "Category:Polling places in the United States",
             "Category:Election Day in the United States", "Category:Early voting in the United States",
             "Category:Voting booths in the United States", "Category:Ballot boxes in the United States",
             "Category:Voting machines in the United States"]
LIC_OK = re.compile(r"public domain|cc0|^pd|cc[- ]by", re.I)
LIC_BAD = re.compile(r"\bnc\b|\bnd\b|fair use|unknown", re.I)


def cat_members(cat, mtype):
    params = {"action": "query", "format": "json", "generator": "categorymembers", "gcmtitle": cat,
              "gcmtype": mtype, "gcmlimit": "80", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
              "iiurlwidth": "1600", "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription"}
    try:
        body, _ = get(COMMONS + "?" + urllib.parse.urlencode(params))
        return list(((json.loads(body).get("query") or {}).get("pages") or {}).values())
    except Exception as e:
        DEBUG.append({"cat": cat, "error": str(e)[:120]})
        return []


def pick_body_images(used, want=3):
    out, seen, pages = [], set(), []
    for cat in BODY_CATS:
        pages += cat_members(cat, "file")
        for sub in cat_members(cat, "subcat")[:6]:
            pages += cat_members(sub.get("title"), "file")
    pages.sort(key=lambda p: p.get("title", ""))
    for p in pages:
        if len(out) >= want:
            break
        title = p.get("title", "")
        if not title.startswith("File:") or title in seen:
            continue
        seen.add(title)
        ii = (p.get("imageinfo") or [{}])[0]
        c = to_cand(p)
        lic = c["license"]
        if not LIC_OK.search(lic) or LIC_BAD.search(lic):
            continue
        if c["w"] < 1200 or c["h"] < 700 or c["mime"] not in ("image/jpeg", "image/png"):
            continue
        if not (0.45 <= c["w"] / c["h"] <= 3.3):
            continue
        blob = f"{title} {c['desc']}"
        if BODY_BAD.search(blob):
            continue
        try:
            data, d = download_validate(ii.get("thumburl") or ii.get("url"))
        except Exception as e:
            DEBUG.append({"body": title, "error": str(e)[:120]})
            continue
        sha1 = hashlib.sha1(data).hexdigest()
        if is_used(sha1, used):
            continue
        up = upload(data, f"midterms-2026-body-{len(out) + 1}.jpg")
        used.add(up["cdn_url"])
        c.update(up)
        out.append(c)
    return out


def fig(img, alt, credit_html):
    return (f'<figure class="pr-fig" style="margin:20px 0;"><img src="{img["cdn_url"]}" alt="{alt}" '
            f'style="width:100%;border-radius:6px;" loading="lazy" />'
            f'<figcaption style="font-size:12px;color:var(--text-dim);margin-top:6px;">{credit_html}</figcaption></figure>')


def credit_for(img):
    artist = re.sub(r"\s+", " ", img.get("artist") or "").strip() or "Wikimedia Commons contributor"
    lic = img.get("license") or ""
    lic_html = f'<a href="{img["license_url"]}" target="_blank" rel="noopener" {C.A}>{lic}</a>' if img.get("license_url") else lic
    page = f'<a href="{img["page"]}" target="_blank" rel="noopener" {C.A}>file page</a>'
    return f"Image: {artist} / Wikimedia Commons, {lic_html} ({page})"


def main():
    result = {"ok": False, "steps": []}

    def finish():
        result["debug"] = DEBUG
        with open(RESULT_FILE, "w") as f:
            json.dump(result, f, indent=2)
        print(json.dumps(result, indent=2)[:6000])

    if not TOKEN:
        result["error"] = "SANITY_API_TOKEN not set"
        return finish()

    used = used_images()
    hero, steps = pick_hero(used)
    result["steps"] += steps
    if not hero:
        result["error"] = "No valid real hero image; nothing published."
        return finish()
    used.add(hero["cdn_url"])
    body_imgs = pick_body_images(used)
    result["steps"].append({"body_images": [b["title"] for b in body_imgs]})

    hero_credit = (f'<p style="font-size:12px;color:var(--text-dim);margin:0 0 1rem;">{credit_for(hero)}</p>')
    alts = ["Voters at a polling place on Election Day", "Ballot box and voting booth", "A state capitol building"]
    figs = []
    for i in range(3):
        if i < len(body_imgs):
            b = body_imgs[i]
            alt = (b.get("desc") or alts[i])[:140]
            figs.append(fig(b, alt, credit_for(b)))
        else:
            figs.append("")
    body = C.build_body(hero_credit, figs[0], figs[1], figs[2])
    words = len(strip_html(body).split())

    existing = sanity_query('*[_id=="%s"][0]{publishedAt,socialScheduleAt,socialScheduleDone}' % BLOG_ID) or {}
    now = datetime.datetime.utcnow().replace(microsecond=0)
    published_at = existing.get("publishedAt") or (now.isoformat() + "Z")
    sched = existing.get("socialScheduleDone")

    doc = {
        "_id": BLOG_ID,
        "_type": "blogPost",
        "title": TITLE,
        "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti",
        "authorRole": "Founder, DownRange",
        "category": "LAW",
        "excerpt": EXCERPT,
        "body": body,
        "imageUrl": hero["cdn_url"],
        "imageAlt": ALT_HERO,
        "heroImage": {"_type": "image", "asset": {"_type": "reference", "_ref": hero["asset_id"]}, "alt": ALT_HERO},
        "readTime": max(1, -(-words // 200)),
        "status": "published",
        "published": True,
        "featured": True,
        "publishedAt": published_at,
        "tags": TAGS,
        "editorLocked": True,
        "qualityReviewed": True,
        "socialCopy": SOCIAL_COPY,
    }
    # Do not re-arm the social post on a re-run once it has gone out
    if not sched:
        doc["socialScheduleAt"] = (now + datetime.timedelta(minutes=12)).isoformat() + "Z"
        doc["socialSchedulePlatforms"] = SOCIAL_PLATFORMS
        doc["socialScheduleDone"] = False
    else:
        doc["socialScheduleAt"] = existing.get("socialScheduleAt")
        doc["socialScheduleDone"] = True
    result["steps"].append({"mutate": post_json(MUTATE_URL, {"mutations": [{"createOrReplace": doc}]})})
    result["verify"] = sanity_query(
        '*[_id=="%s"][0]{_id,title,"slug":slug.current,status,imageUrl,"heroAsset":heroImage.asset._ref,imageAlt,readTime,'
        'category,publishedAt,socialScheduleAt,socialScheduleDone,"bodyImgs":count(string::split(body,"cdn.sanity.io/images"))-1}'
        % BLOG_ID)
    result["ok"] = bool(result["verify"])
    result["blog_url"] = f"{SITE}/blog/{SLUG}"
    result["words"] = words
    finish()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        with open(RESULT_FILE, "w") as f:
            json.dump({"ok": False, "error": repr(e)}, f, indent=2)
        print("FATAL", repr(e))
