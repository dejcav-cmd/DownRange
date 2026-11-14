#!/usr/bin/env python3
"""
Publishes a DownRange feature on Paul Rackley's Hook & Barrel review of the GLOCK G45 Gen6.
- Original summary and commentary with clear attribution and a visible link to the full review.
- Real photos only: scraped from the source page (og/twitter/JSON-LD/img/srcset/picture), validated by magic
  bytes + dimensions, uploaded to the Sanity CDN, credited "Image: Hook & Barrel". No real image = no article.
- Idempotent: createOrReplace on a fixed _id. No social post is scheduled.
"""
import os, re, json, html, hashlib, datetime, struct, urllib.parse, urllib.request, urllib.error

PROJECT = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
DATASET = "production"
TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if TOKEN.startswith("ST="):
    TOKEN = TOKEN[3:]
ASSET_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/{DATASET}"
MUTATE_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/{DATASET}"
QUERY_URL = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/{DATASET}"

SRC = "https://www.hookandbarrel.com/shooting/glock-g45-gen6-review"
BLOG_ID = "blog-glock-g45-gen6-hook-barrel-feature"
SLUG = "glock-g45-gen6-review-paul-rackley-hook-and-barrel"
RESULT_FILE = "g45_feature_result.json"
TITLE = "GLOCK G45 Gen6 Review: What Paul Rackley's Range Test Found"
EXCERPT = ("Paul Rackley of Hook & Barrel ran the GLOCK G45 Gen6 through red-dot groups, holster drills and a "
           "no-malfunction ammo test. Here are the numbers, the Gen6 changes and what to weigh before buying.")
BROWSER = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
           "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}
BAD = re.compile(r"logo|icon|sprite|avatar|favicon|badge|social|facebook|twitter|instagram|pixel|spacer|placeholder|"
                 r"newsletter|subscribe|banner-ad|/ads?/|author|headshot|gravatar|svg|gif", re.I)
A = 'style="color:var(--gold);text-decoration:underline;"'
DEBUG = []


def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers=headers or BROWSER)
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


def kind_dims(b):
    """Returns (mime, w, h) from magic bytes, or None."""
    try:
        if b[:8] == b"\x89PNG\r\n\x1a\n":
            w, h = struct.unpack(">II", b[16:24]); return "image/png", w, h
        if b[:3] == b"\xff\xd8\xff":
            i = 2
            while i < len(b) - 9:
                if b[i] != 0xFF:
                    i += 1; continue
                m = b[i + 1]
                if m in (0xC0, 0xC1, 0xC2):
                    h, w = struct.unpack(">HH", b[i + 5:i + 9]); return "image/jpeg", w, h
                i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
        if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
            t = b[12:16]
            if t == b"VP8X":
                w = 1 + int.from_bytes(b[24:27], "little"); h = 1 + int.from_bytes(b[27:30], "little"); return "image/webp", w, h
            if t == b"VP8 ":
                w, h = struct.unpack("<HH", b[26:30]); return "image/webp", w & 0x3FFF, h & 0x3FFF
            if t == b"VP8L":
                v = int.from_bytes(b[21:25], "little"); return "image/webp", (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    except Exception:
        pass
    return None


def collect_image_urls(page_html):
    urls = []
    def add(u):
        if not u: return
        u = html.unescape(u.strip())
        if u.startswith("data:"): return
        u = urllib.parse.urljoin(SRC, u)
        if u not in urls: urls.append(u)
    for m in re.finditer(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)[^>]*>', page_html, re.I):
        c = re.search(r'content=["\']([^"\']+)', m.group(0), re.I)
        if c: add(c.group(1))
    for blob in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', page_html, re.S | re.I):
        for u in re.findall(r'https?:[^"\\\s]+\.(?:jpe?g|png|webp)[^"\\\s]*', blob.replace("\\/", "/"), re.I): add(u)
    for tag in re.findall(r'<(?:img|source)\b[^>]*>', page_html, re.I):
        for attr in ("src", "data-src", "data-lazy-src", "data-original"):
            m = re.search(attr + r'=["\']([^"\']+)', tag, re.I)
            if m: add(m.group(1))
        for attr in ("srcset", "data-srcset"):
            m = re.search(attr + r'=["\']([^"\']+)', tag, re.I)
            if m:
                parts = [p.strip().split(" ") for p in m.group(1).split(",") if p.strip()]
                def width(p):
                    try: return int(p[1].rstrip("w"))
                    except Exception: return 0
                for p in sorted(parts, key=width, reverse=True): add(p[0])
    for u in re.findall(r'https?:\\?/\\?/[^"\'\s<>\\]+?\.(?:jpe?g|png|webp)(?:\?[^"\'\s<>\\]*)?', page_html, re.I):
        add(u.replace("\\/", "/"))
    for m in re.finditer(r'url\(["\']?([^)"\']+\.(?:jpe?g|png|webp)[^)"\']*)', page_html, re.I): add(m.group(1))
    return urls


def variants(u):
    out = [u]
    base = re.sub(r"-\d{2,4}x\d{2,4}(\.\w+)(\?|$)", r"\1\2", u)
    if base != u: out.insert(0, base)
    q = u.split("?")[0]
    if q != u: out.append(q)
    seen, res = set(), []
    for x in out:
        if x not in seen: seen.add(x); res.append(x)
    return res


def fetch_valid(u):
    for v in variants(u):
        try:
            hdr = dict(BROWSER); hdr["Referer"] = SRC
            body, _ = get(v, hdr, 90)
        except Exception as e:
            DEBUG.append({"get": v[:110], "err": str(e)[:80]}); continue
        kd = kind_dims(body)
        if len(body) < 15000 or not kd:
            DEBUG.append({"reject": v[:110], "why": f"size {len(body)} kd {kd}"}); continue
        mime, w, h = kd
        if w < 400 or h < 240 or not (0.45 <= w / h <= 3.3):
            DEBUG.append({"reject": v[:110], "why": f"dims {w}x{h}"}); continue
        return {"url": v, "body": body, "mime": mime, "w": w, "h": h, "sha1": hashlib.sha1(body).hexdigest()}
    return None


def upload(img, filename):
    req = urllib.request.Request(f"{ASSET_URL}?filename={filename}", data=img["body"], method="POST")
    req.add_header("Content-Type", img["mime"]); req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=120) as r:
        doc = json.loads(r.read().decode()).get("document", {})
    return {"cdn_url": doc.get("url"), "asset_id": doc.get("_id")}


def link(href, text):
    return f'<a href="{html.escape(href, quote=True)}" {A} target="_blank" rel="noopener">{text}</a>'


def ilink(href, text):
    return f'<a href="{href}" {A}>{text}</a>'


def fig(img, alt):
    return (f'<figure class="pr-fig" style="margin:20px 0;"><img src="{img["cdn_url"]}" alt="{html.escape(alt, quote=True)}" '
            f'style="width:100%;border-radius:6px;" loading="lazy" /><figcaption style="font-size:12px;color:var(--text-dim);margin-top:6px;">'
            f'Image: Hook &amp; Barrel (from the {link(SRC, "original review")})</figcaption></figure>')


def table(rows, head):
    th = "".join(f'<th style="padding:8px;text-align:left;border-bottom:2px solid var(--gold);color:var(--gold);font-family:\'IBM Plex Mono\',monospace;font-size:11px;">{h}</th>' for h in head)
    tr = "".join("<tr>" + "".join(f'<td style="padding:8px;border-bottom:1px solid var(--border);color:#CBD5E1;">{c}</td>' for c in r) + "</tr>" for r in rows)
    return f'<div style="overflow-x:auto;margin:1rem 0 1.5rem;"><table style="width:100%;border-collapse:collapse;"><tr>{th}</tr>{tr}</table></div>'


def build_body(f1, f2, f3):
    review = link(SRC, "GLOCK G45 Gen6 Review: Tested With Optics and Holster Drills")
    hb = link("https://www.hookandbarrel.com", "Hook &amp; Barrel")
    specs = table([
        ["Action", "Striker-fired semi-automatic"], ["Caliber", "9mm"], ["Barrel length", "4.02 in"], ["Overall length", "7.44 in"],
        ["Capacity", "17+1"], ["Weight", "23.1 oz (empty magazine)"], ["Finish", "nDLC"],
        ["Sights", "Polymer U-shaped rear, white-dot front"], ["Grip texture", "Full-coverage RTF6"], ["MSRP", "$745"]], ["SPEC", "G45 GEN6"])
    scores = table([["Accuracy", "8.5"], ["Reliability", "10.0"], ["Handling", "9.5"], ["Aesthetics", "7.0"], ["Build quality", "8.0"],
                    ["Value", "8.0"], ["<strong>Overall</strong>", "<strong>8.5 / 10</strong>"]], ["CATEGORY", "SCORE"])
    parts = [
        f'<p style="font-size:.9rem;color:var(--text-dim);">DownRange feature. All test results below come from Paul Rackley\'s review at {hb}; we link to it so you can read the full test.</p>',
        "<h2>The Short Version</h2>",
        f"<p>Paul Rackley, who is credited as the tester on {hb}'s {review}, scored the GLOCK G45 Gen6 an <strong>8.5 out of 10</strong>. "
        "His headline findings: no malfunctions with every load he fed it, groups that tightened from just under 3 inches with iron sights to just over 2 inches with a red dot at 15 yards, and what he calls the best factory GLOCK trigger he has felt. "
        "The catch is a pull weight that still breaks near 6 pounds.</p>",
        f1,
        "<h2>Who Ran the Test</h2>",
        f"<p>The review lists Paul Rackley as the tester. He ran the Gen6 G45, a 9mm crossover with a full-size frame and a compact slide, first on factory sights and then with an Osight SE red dot mounted through GLOCK's Optics Ready System (ORS). "
        "His drills covered slow fire at 10 yards, low-ready and retention work from a Galco KingTuk holster, doubles and target transitions, and 15-yard rested groups.</p>",
        "<h2>What Is New in Gen6</h2>",
        "<ul><li><strong>Grip.</strong> Full-coverage texture, a redesigned palm swell and a deeper beavertail. Rackley calls it the highest, most secure grip he has had on a GLOCK.</li>"
        "<li><strong>Trigger guard and slide.</strong> A deeper trigger-guard undercut and deeper slide serrations, which help with press checks.</li>"
        "<li><strong>ORS optics mounting.</strong> Optics mount directly to the pistol with one plate and no separate plate-screw set, unlike the older MOS system. Three interchangeable plates are available; the review used the 04 plate.</li>"
        "<li><strong>Trigger.</strong> Flat-faced, roughly 6 pounds, with no grit, little play and a short reset.</li></ul>",
        f2,
        "<h2>The Numbers</h2>",
        "<ul><li><strong>Iron sights:</strong> averaged a little under 3 inches at 15 yards across a range of ammunition.</li>"
        "<li><strong>Red dot:</strong> groups tightened to just over 2 inches.</li>"
        "<li><strong>Best load:</strong> Federal Personal Defense Punch (9mm, 124-grain JHP) shot best with both setups.</li>"
        "<li><strong>Reliability:</strong> no malfunctions across all ammunition fed to the pistol.</li></ul>",
        scores,
        "<h2>Specifications</h2>", specs,
        "<h2>Pros and Cons, per the Review</h2>",
        "<p><strong>Pros:</strong> red-dot groups just over 2 inches; the most secure GLOCK grip he has used; ORS mounts optics without a second screw set; deeper serrations; the best factory GLOCK trigger he has felt; 17+1 capacity in a crossover size.</p>"
        "<p><strong>Cons:</strong> the trigger still breaks at almost 6 pounds, and the iron sights do not co-witness with an optic.</p>",
        f3,
        "<h2>What It Means for Buyers</h2>",
        "<p>This section is DownRange's read of the review, not a test of our own. The G45 has long been a bridge between the full-size G17 and the compact G19 for people who want a long grip and a shorter slide. "
        "Rackley's results suggest Gen6 improves the two things shooters complained about most on earlier GLOCKs: grip security and trigger feel. The ORS system also removes a step for anyone running a red dot, and his red-dot groups suggest the optic is worth adding. "
        "The trade-offs are the near-6-pound pull, which some shooters will want to swap, and the lack of a co-witness. At a $745 MSRP, it also helps to compare street prices in " + ilink("/deals", "our deals feed") + " before you buy. "
        "Magazine compatibility is another thing to check: the review notes Gen1 to Gen3 magazines work only with the left-side release, while Gen4 and later magazines work ambidextrously.</p>",
        "<h2>Read the Full Review</h2>",
        f"<p>The complete test, including Rackley's drill notes and ammunition list, is on {hb}: {review}. "
        f"For more gun coverage, see {ilink('/releases', 'new releases')}, {ilink('/news', 'news')} and {ilink('/blog', 'the DownRange blog')}. "
        "Pricing and availability change; confirm local laws before you buy: " + ilink("/laws", "state gun laws") + ".</p>",
        '<p style="margin-top:2rem;border-top:1px solid var(--border);padding-top:1rem;"><em>&mdash; DJ Cavalcanti</em><br/><strong>DJ Cavalcanti, DownRange Founder</strong></p>',
    ]
    return "\n".join(p for p in parts if p)


def main():
    result = {"ok": False, "steps": []}
    def finish():
        result["debug"] = DEBUG[:60]
        open(RESULT_FILE, "w").write(json.dumps(result, indent=2))
        print(json.dumps(result, indent=2)[:6000])
    if not TOKEN:
        result["error"] = "SANITY_API_TOKEN not set"; return finish()
    try:
        page, _ = get(SRC, BROWSER, 60)
        page_html = page.decode("utf-8", "ignore")
        result["page_len"] = len(page_html)
    except Exception as e:
        result["error"] = f"could not fetch source page: {e}"; return finish()
    cands = collect_image_urls(page_html)
    # Unwrap Cloudflare image-resizing URLs to the original file, keep only the review's own photos
    norm = []
    for u in cands:
        m = re.search(r"/(https://images\.hookandbarrel\.com/[^?]+)$", u)
        o = m.group(1) if m else u
        o = re.sub(r"-\d{2,4}x\d{2,4}(\.\w+)$", r"\1", o)
        if (o.startswith("https://images.hookandbarrel.com/2026/0")
                and re.search(r"/2026/0[78]/", o)
                and not re.search(r"popup|cover|exclusive|avif", o, re.I)
                and not BAD.search(o) and o not in norm):
            norm.append(o)
    cands = sorted(norm, key=lambda u: (0 if "LEAD" in u else 1))
    result["candidates"] = cands[:40]
    used_rows = sanity_query('*[_type=="blogPost" && _id != "%s"]{imageUrl}' % BLOG_ID) or []
    used = " ".join(r.get("imageUrl") or "" for r in used_rows)
    got, seen = [], set()
    for u in cands:
        if len(got) >= 4: break
        img = fetch_valid(u)
        if not img or img["sha1"] in seen: continue
        seen.add(img["sha1"])
        if got and img["w"] / img["h"] < 1.2:
            result["steps"].append({"skip_portrait_body": u}); continue
        if not got and img["sha1"] in used:
            result["steps"].append({"skip_hero_used": u}); continue
        up = upload(img, f"g45-gen6-{len(got) + 1}.{'png' if img['mime']=='image/png' else 'webp' if img['mime']=='image/webp' else 'jpg'}")
        img.update(up); img.pop("body")
        got.append(img); result["steps"].append({"uploaded": up["cdn_url"], "src": u[:140], "dims": [img["w"], img["h"]]})
    if not got:
        result["error"] = "No valid real image found on the source page; nothing published."; return finish()
    hero = got[0]
    alts = ["GLOCK G45 Gen6 pistol with Optics Ready System plate", "GLOCK G45 Gen6 pistol, quartering view", "GLOCK G45 Gen6 with Federal Punch 9mm ammunition"]
    figs = [fig(got[i + 1], alts[i]) if i + 1 < len(got) else "" for i in range(3)]
    body = build_body(*figs)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    existing = sanity_query('*[_id=="%s"][0]{publishedAt}' % BLOG_ID) or {}
    now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    doc = {
        "_id": BLOG_ID, "_type": "blogPost", "title": TITLE, "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti", "authorRole": "Founder, DownRange", "category": "REVIEW", "excerpt": EXCERPT, "body": body,
        "imageUrl": hero["cdn_url"], "imageAlt": "GLOCK G45 Gen6 pistol from the Hook & Barrel review",
        "heroImage": {"_type": "image", "asset": {"_type": "reference", "_ref": hero["asset_id"]}},
        "readTime": max(1, -(-words // 200)), "status": "published", "published": True, "featured": False,
        "publishedAt": existing.get("publishedAt") or now,
        "tags": ["GLOCK", "G45 Gen6", "Gun Review", "Paul Rackley", "Hook & Barrel", "9mm", "Optics Ready", "Red Dot"],
        "editorLocked": True, "qualityReviewed": True,
    }
    result["steps"].append({"mutate": post_json(MUTATE_URL, {"mutations": [{"createOrReplace": doc}]})})
    result["verify"] = sanity_query('*[_id=="%s"][0]{_id,title,"slug":slug.current,status,imageUrl,"heroAsset":heroImage.asset._ref,readTime,category,publishedAt,"bodyImgs":count(string::split(body,"cdn.sanity.io/images"))-1}' % BLOG_ID)
    result["ok"] = bool(result["verify"]); result["blog_url"] = f"https://www.downrangeco.com/blog/{SLUG}"; result["words"] = words
    finish()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        open(RESULT_FILE, "w").write(json.dumps({"ok": False, "error": repr(e)}, indent=2)); print("FATAL", repr(e))
