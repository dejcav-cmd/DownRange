#!/usr/bin/env python3
"""
Publishes the Falcon Optic thermal lineup / Medusa M1V2.0-650L first-look feature on DownRange.
- Facts come from Falcon Optic's own US pages (manufacturer-listed specs are labeled as such).
- Real photos only: scraped from the M1V2.0-650L product page, validated, uploaded to the Sanity CDN,
  credited "Image: Falcon Optic". No real image = no article.
- Idempotent createOrReplace. Editor-written per-platform social copy + a timed social post.
"""
import os, re, sys, json, html, hashlib, datetime, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import publish_g45_feature as G  # reuse HTTP, image validation, Sanity helpers

HOME = "https://us.falconoptic.com/"
PRODUCT = "https://us.falconoptic.com/products/falcon-m1v2-0-650l-thermal-scope"
BF = "https://us.falconoptic.com/pages/black-friday-sale"
SCOPES = "https://us.falconoptic.com/collections/thermal-scope"
MONOS = "https://us.falconoptic.com/collections/thermal-monocular"
G.SRC = PRODUCT
BLOG_ID = "blog-falcon-optic-medusa-m1v2-650l-first-look"
SLUG = "falcon-medusa-m1v2-650l-thermal-scope"
RESULT_FILE = "falcon_feature_result.json"
TITLE = "Falcon Optic Thermal Lineup: A First Look at the Medusa M1V2.0-650L"
EXCERPT = ("A first look at Falcon Optic's thermal scopes and the Medusa M1V2.0-650L: 640x512 sensor, 50mm lens, "
           "1000-yard laser rangefinder, 5-year warranty and Black Friday pricing.")
TAGS = ["Falcon Optic", "Medusa M1V2.0-650L", "Thermal Scope", "Thermal Optics", "Hunting Optics", "Black Friday",
        "Laser Rangefinder", "640x512", "Night Hunting"]
HERO_URL = "https://us.falconoptic.com/cdn/shop/files/m1v2.0-thermal-scope-laser-rangefinder-15_ca41f721-9160-4fa4-af47-778b28c1a41f.jpg?v=1786064796&width=3200"  # chosen by DJ
SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "bluesky"]  # Threads/Reddit are not configured on the site
SOCIAL_COPY = {
    "twitter": "Falcon's Medusa M1V2.0-650L thermal: 640x512, 50mm, 1000yd LRF. First look:",
    "bluesky": ("First look: Falcon Optic's Medusa M1V2.0-650L thermal scope. 640x512 sensor, 50mm lens, "
                "1000-yd rangefinder, 5-year warranty. Hands-on review coming."),
    "threads": ("Thermal on your Black Friday list? We broke down Falcon Optic's lineup and the Medusa M1V2.0-650L: "
                "640x512 sensor, 50mm F1.0 lens, 1000-yd laser rangefinder, Wi-Fi app, IP67 and a 5-year warranty. "
                "The sale runs through Nov. 30 (EST). Hands-on review coming soon."),
    "facebook": ("Thermal scope shoppers: we put together a first look at Falcon Optic's thermal lineup and its Medusa M1V2.0-650L. "
                 "Manufacturer-listed specs include a 640x512 sensor, 50mm F1.0 lens, 1000-yard laser rangefinder, built-in ballistic "
                 "calculator, Wi-Fi app and IP67 rating, plus a 5-year warranty. Falcon's Black Friday sale runs through Nov. 30 (EST). "
                 "We have not tested it yet, and a hands-on review is coming soon. Are you running thermal on your hunting rifle?"),
    "instagram": ("Falcon Optic Medusa M1V2.0-650L thermal scope: first look. Manufacturer-listed specs: 640x512 sensor, 50mm F1.0 lens, "
                  "1000-yd laser rangefinder, ballistic calculator, Wi-Fi and IP67, with a 5-year warranty. Black Friday pricing runs "
                  "through Nov. 30 (EST). Hands-on review coming soon."),
    "reddit": ("Falcon Optic Medusa M1V2.0-650L thermal scope: specs, lineup and Black Friday pricing (first look, "
               "hands-on review to follow)"),
}


def L(href, text):
    return G.link(href, text)


def I(href, text):
    return G.ilink(href, text)


def fig(img, alt):
    return (f'<figure class="pr-fig" style="margin:20px 0;"><img src="{img["cdn_url"]}" alt="{html.escape(alt, quote=True)}" '
            f'style="width:100%;border-radius:6px;" loading="lazy" /><figcaption style="font-size:12px;color:var(--text-dim);margin-top:6px;">'
            f'Image: Falcon Optic (from the {L(PRODUCT, "product page")})</figcaption></figure>')


def build_body(f1, f2, f3):
    HOME_LINK = L(HOME, "Falcon Optic's US site")
    T = G.table
    glance = T([["Sensor", "640&times;512, 12&micro;m pixels"], ["Sensitivity (NETD)", "&le;15mK"], ["Objective", "50mm, F1.0"],
                ["Field of view", "8.8&deg; &times; 6.6&deg;"], ["Optical magnification", "2.8x (digital 1x to 8x)"],
                ["Laser rangefinder", "1000 yards"], ["Display", "1920&times;1080, 60Hz"], ["Weight", "650g without mount and battery"],
                ["Protection", "IP67, 10,000J recoil rating"], ["Warranty", "5 years (3 standard + 2 free)"],
                ["Price", "$2,199.00 listed; $1,759.20 after the automatic 20% Black Friday discount"]], ["SPEC", "MEDUSA M1V2.0-650L"])
    lineup = T([
        ["<strong>Medusa M1V2.0-650L</strong>", "Scope", "640&times;512", "50mm", "&le;15mK", "1000yd LRF", "$2,199"],
        ["Medusa M3-635L", "Scope", "640&times;512", "35mm", "&le;18mK", "1000yd LRF", "$1,899"],
        ["Medusa M4V2.0-225L", "Scope", "256&times;192", "25mm", "&le;30mK", "1000yd LRF", "$889"],
        ["Medusa M5-650L", "Scope", "640&times;512", "50mm", "&le;18mK", "1000yd LRF", "$2,999"],
        ["Surtur S1 series", "Monocular", "640&times;512", "n/a listed", "&le;18mK", "1000yd LRF", "from $1,599"],
        ["Titan T1-650L", "Multi-spectral scope", "640&times;512 thermal / 2K digital night vision", "50mm", "&le;18mK", "1000yd LRF", "$1,300 (list $1,999)"],
        ["Ymir Y1LV2.0", "Digital night vision scope", "2592&times;1944", "70mm", "n/a", "n/a", "$699"]],
        ["MODEL", "TYPE", "SENSOR", "LENS", "NETD", "RANGEFINDER", "LISTED PRICE"])
    box = T([["Sensor", "640&times;512"], ["Pixel size", "12&micro;m"], ["NETD", "&le;15mK"], ["Objective", "50mm F1.0"], ["Field of view", "8.8&deg; &times; 6.6&deg;"],
             ["Optical magnification", "2.8x"], ["Digital zoom steps", "1x, 1.5x, 2x, 2.5x, 3x, 4x, 6x, 8x"], ["Detection range (listed)", "&gt;2,500m"],
             ["Laser rangefinder", "1000yd"], ["Display", "1920&times;1080, 60Hz (OLED per product text)"], ["Color modes", "White Hot, Black Hot, Red Hot, High Contrast, Low Light, Fusion"],
             ["Reticles", "10 designs, 5 colors"], ["Gun profiles", "10"], ["Battery", "18650, 3500mAh, replaceable; 5 hours listed runtime; external power capable"],
             ["Start-up", "7 seconds (power-saver resume also 7s)"], ["Weight", "650g &plusmn;5g (no mount or battery)"], ["Dimensions", "224 &times; 75 &times; 91mm"],
             ["Operating temperature", "-20&deg;C to +50&deg;C"], ["Recoil resistance", "10,000J"], ["Waterproofing", "IP67"]], ["SPEC", "MANUFACTURER LISTING"])
    parts = [
        '<p style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:var(--text-dim);">Prices, promotions and specifications are as listed on Falcon Optic\'s US site on November 23, 2026. Specs are the manufacturer\'s claims; DownRange has not tested this scope yet. Header image: Falcon Optic (from the ' + L(PRODUCT, 'product page') + ').</p>',
        "<h2>The Short Version</h2>",
        f"<p>Falcon Optic's tagline is \"Sensor 640 for the Rest of Us,\" and the Medusa M1V2.0-650L is where that pitch lands. It is a thermal riflescope with a 640&times;512 sensor, a 50mm F1.0 objective, a built-in 1000-yard laser rangefinder, a ballistic calculator, Wi-Fi and an IP67 rating, listed at $2,199 on {HOME_LINK}. During the company's Black Friday sale, the product page shows 20% off applied automatically at checkout, which brings it to $1,759.20. "
        "This is a first look built from Falcon's published numbers. A hands-on review is coming, and we list the questions we plan to answer further down.</p>",
        f1,
        "<h2>At a Glance</h2>", glance,
        "<h2>Who Is Falcon Optic?</h2>",
        f"<p>Falcon describes itself on its {L('https://us.falconoptic.com/pages/about-us', 'About page')} as a professional thermal imaging and night vision manufacturer, and says it develops the core thermal solution in-house: optical design, image processing, firmware, rangefinding, power management and housing. It also says, \"We are new here,\" which is useful context: this is not a decades-old thermal brand. "
        "The company claims it rejects any sensor above 18mK NETD and tests every unit for recoil, freezing, heat, continuous running and water exposure. Those are company statements, and we have not verified them. "
        "The US store lists a US warehouse, free standard shipping within the contiguous United States (3 to 5 workdays), 30-day returns and a warranty described as three years standard plus two years free.</p>",
        "<h2>The Falcon Thermal Lineup</h2>",
        f"<p>Falcon's thermal range splits into riflescopes and a portable monocular, with a multi-spectral scope and a digital night vision scope alongside. Browse the full range in the {L(SCOPES, 'thermal scope collection')} and the {L(MONOS, 'thermal monocular collection')}. Prices below are the sale prices shown on the site on November 23.</p>",
        lineup,
        "<ul><li><strong>Medusa series (scopes).</strong> The M1V2.0-650L is the headline model with the lowest listed NETD (&le;15mK). The M5-650L shares its 640&times;512 sensor and 50mm lens at a higher price and a listed &le;18mK. The M3-635L steps down to a 35mm lens, which trades magnification for a wider view at a lower price. The M4V2.0-225L is the budget entry with a 256&times;192 sensor.</li>"
        "<li><strong>Surtur series (monocular).</strong> A handheld 640&times;512 thermal with a 1000-yard rangefinder for scouting, spotting and recovery, from $1,599.</li>"
        "<li><strong>Titan T1-650L.</strong> A multi-spectral scope that pairs a 640&times;512 thermal sensor with 2K digital night vision for day-to-night use, listed at $1,300 against a $1,999 list price.</li>"
        "<li><strong>Ymir Y1LV2.0.</strong> A digital night vision scope (2592&times;1944, 70mm) at $699, for hunters who want night capability without thermal.</li></ul>",
        "<h2 id=\"m1\">Medusa M1V2.0-650L: The Detailed Look</h2>",
        "<h3>Sensor and optics</h3>",
        "<p>The M1V2.0-650L uses a 640&times;512 sensor with 12&micro;m pixels and a listed sensitivity of &le;15mK NETD. NETD is a measure of how small a temperature difference the sensor can pick up; lower is better, and &le;15mK is the lowest figure Falcon lists across its Medusa scopes. Behind a 50mm F1.0 objective, Falcon lists an 8.8&deg; &times; 6.6&deg; field of view and 2.8x optical magnification, with digital steps of 1.5x, 2x, 2.5x, 3x, 4x, 6x and 8x.</p>"
        "<p><strong>DownRange math.</strong> A 12&micro;m pixel behind a 50mm lens covers about 0.24 milliradians. At 100 yards, one sensor pixel spans roughly 0.86 inches of the scene, and 640 pixels across at 0.24 mrad works out to about 8.8 degrees, which matches Falcon's listed field of view. In plain terms, that is the detail budget you are working with: a deer 40 inches long spans roughly 45 pixels across at 100 yards, and about 15 at 300 yards. Detection range is listed at more than 2,500 meters, which is a detection claim for a heat source, not a distance at which you can identify what it is.</p>",
        f2,
        "<h3>Display and image modes</h3>",
        "<p>The display is listed at 1920&times;1080 with a 60Hz frame rate (the product text calls it OLED). Color modes are White Hot, Black Hot, Red Hot, High Contrast, Low Light and Fusion, and Falcon lists AI image enhancement. Ten reticle designs in five colors and ten saved gun profiles are included.</p>",
        "<h3>Laser rangefinder and ballistics</h3>",
        "<p>A built-in laser rangefinder with a 1000-yard listed range feeds a smart automatic ballistic calculator, so you can range a target and hold for the drop without a separate device. Falcon's page uses the line \"Range it, hold with confidence.\" How accurate that solution is in the field depends on your inputs, your ammunition data and the rangefinder's consistency on low-contrast targets, which is exactly what we plan to test.</p>",
        "<h3>Recording, Wi-Fi and the app</h3>",
        "<p>The scope records onboard photos and video and supports Wi-Fi image sharing and remote control from a phone through the Falcon Outdoor app, including live streaming. The listing describes recording as onboard photo and video, and does not list automatic or recoil-triggered recording.</p>",
        "<h3>Power</h3>",
        "<p>The M1V2.0-650L runs on a replaceable 18650 battery (3500mAh) with a listed runtime of 5 hours, and it can run from external power. The package includes two 18650 batteries and a 5V/2A adapter. Falcon's homepage banner reads \"Forget the battery. Hunt till dawn.\" Listed runtime is a manufacturer figure, and real-world hours depend on temperature, Wi-Fi use and rangefinder use.</p>",
        "<h3>Build and durability</h3>",
        "<p>Falcon lists IP67 waterproofing, a 10,000J recoil rating, an operating range of -20&deg;C to +50&deg;C and a weight of 650g (&plusmn;5g) without the mount and battery. The listing mentions impact, waterproof, temperature-cycling and aging tests. Controls are ambidextrous, and the scope has a magnetic silent lens cap. Dimensions are 224 &times; 75 &times; 91mm. Start-up takes about 7 seconds.</p>",
        f3,
        "<h3>Full specifications (manufacturer-listed)</h3>", box,
        "<h3>What is in the box</h3>",
        "<p>The scope, a user manual, a warranty card, a cleaning cloth, two 18650 batteries, a 5V/2A adapter, a Type-C data cable, an installation tool, a Picatinny mount and a shoulder strap.</p>",
        "<h2>What Buyers on the Product Page Say</h2>",
        f"<p>The {L(PRODUCT, 'product page')} shows a 4.6 star rating from 7 reviews: four 5-star and three 4-star. Some written reviews mention battery drain, gaps in the manual and trouble with the app, and Falcon replied to at least one app complaint. Seven reviews is a small sample, and these are customer comments on the seller's own site, not independent tests. We read them as a list of things to check.</p>",
        "<h2>What We Plan to Test</h2>",
        "<ul><li><strong>Identification range.</strong> How far can we tell a hog from a coyote, not just see a hot spot?</li>"
        "<li><strong>Real battery life.</strong> Hours against the listed 5, with Wi-Fi and the rangefinder in use and in cold weather.</li>"
        "<li><strong>Rangefinder performance.</strong> Consistency on animals, brush and low-contrast targets, and how the ballistic solution compares with actual impacts.</li>"
        "<li><strong>Zero retention.</strong> Whether the scope holds zero across repeated shots and remounts.</li>"
        "<li><strong>App stability.</strong> Whether Wi-Fi pairing, recording and live streaming work in the field.</li>"
        "<li><strong>Image comparison.</strong> A side-by-side with other 640-class scopes.</li></ul>",
        "<h2>What We Could Not Verify</h2>",
        "<p>Falcon's site does not state a country of origin, and we did not find an export-control statement on the pages we read. We also have no independent lab data on the specs above. If country of origin or service location matters to you, ask Falcon before you buy; the " + L("https://us.falconoptic.com/pages/contact", "contact page") + " promises a reply within 24 business hours.</p>",
        "<h2>Before You Hunt With Thermal</h2>",
        "<p>Rules on using thermal and night-vision devices for hunting vary by state, species and season, and some states restrict them for certain game or hours. Check your state wildlife agency's current regulations before you buy or hunt, and see our " + I("/hunting", "hunting page") + " and " + I("/laws", "state gun laws hub") + " for state-level information.</p>",
        "<h2>Falcon Optic's Black Friday Sale</h2>",
        f"<p>Falcon says its Black Friday sale runs from <strong>November 16 to November 30, 2026 (EST)</strong>. The sale page is {L(BF, 'here')}. As listed on November 23:</p>"
        "<ul><li><strong>Up to 20% off.</strong> The sale page is headlined \"Up to 20% off,\" and the M1V2.0-650L product page shows 20% off applied automatically at checkout ($1,759.20). No promo code was needed on the pages we read.</li>"
        "<li><strong>Free Battery Pack.</strong> Falcon says every eligible product purchase comes with one.</li>"
        "<li><strong>Combo bonus.</strong> Spend $1,900 or more on combo products and receive an additional free accessory pack (batteries, a charger, a Falcon hat and a patch).</li>"
        "<li><strong>Lucky Spin Wheel.</strong> One free spin for entering an email, with prizes of discounts, free gifts or a grand prize valued up to $1,999. Falcon lists eligibility as US residents 18 or older, and the coupons are for non-accessory products and cannot be combined unless stated.</li>"
        "<li><strong>Shipping and returns.</strong> The site lists free shipping on all orders and 30-day returns.</li></ul>"
        f"<p>Promotions change and have terms, so confirm everything at checkout. Start at {L(HOME, 'us.falconoptic.com')}, or go straight to the {L(PRODUCT, 'Medusa M1V2.0-650L page')} or the {L(BF, 'Black Friday sale page')}.</p>",
        "<div style=\"background:rgba(200,146,42,0.08);border-left:4px solid var(--gold);padding:1rem 1.25rem;margin:2rem 0;\"><p style=\"margin:0;\"><strong>Hands-on review coming soon.</strong> We will put the Medusa M1V2.0-650L through field testing and publish a full hands-on review here on DownRange. Check "
        + I("/blog", "the DownRange blog") + " and " + I("/deals", "our deals feed") + " for updates.</p></div>",
    ]
    return "\n".join(p for p in parts if p)


def to_full(u):
    p = urllib.parse.urlparse(u)
    q = urllib.parse.parse_qs(p.query)
    q["width"] = ["2048"]
    return urllib.parse.urlunparse((p.scheme, p.netloc, p.path, "", urllib.parse.urlencode({k: v[0] for k, v in q.items()}), ""))


def main():
    result = {"ok": False, "steps": []}

    def finish():
        result["debug"] = G.DEBUG[:50]
        open(RESULT_FILE, "w").write(json.dumps(result, indent=2))
        print(json.dumps(result, indent=2)[:5000])

    if not G.TOKEN:
        result["error"] = "SANITY_API_TOKEN not set"; return finish()
    try:
        page, _ = G.get(PRODUCT, G.BROWSER, 60)
        page_html = page.decode("utf-8", "ignore")
        result["page_len"] = len(page_html)
    except Exception as e:
        result["error"] = f"could not fetch product page: {e}"; return finish()
    raw = G.collect_image_urls(page_html)
    cands, seen_paths = [], set()
    for u in raw:
        pth = urllib.parse.urlparse(u)
        if "/cdn/shop/files/" not in pth.path or G.BAD.search(u):
            continue
        name = pth.path.rsplit("/", 1)[-1]
        if not re.search(r"m1v2", name, re.I) or re.search(r"footer|payment|review|banner", name, re.I):
            continue
        if pth.path in seen_paths:
            continue
        seen_paths.add(pth.path)
        cands.append(to_full(u))
    result["candidates"] = cands
    used_rows = G.sanity_query('*[_type=="blogPost" && _id != "%s"]{imageUrl}' % BLOG_ID) or []
    used = " ".join(r.get("imageUrl") or "" for r in used_rows)
    valid, shas = [], set()
    for u in cands:
        img = G.fetch_valid(u)
        if not img or img["sha1"] in shas:
            continue
        shas.add(img["sha1"]); img["src"] = u; valid.append(img)
    if not valid:
        result["error"] = "No valid real product image found; nothing published."; return finish()
    # hero: wide enough, and a ratio Instagram accepts (0.8-1.91), never a hero used on another post
    def hero_ok(i):
        r = i["w"] / i["h"]
        return i["w"] >= 1000 and 1.0 <= r <= 1.9 and i["sha1"] not in used
    hero = G.fetch_valid(HERO_URL)
    if hero:
        hero["src"] = HERO_URL
        valid = [i for i in valid if i["sha1"] != hero["sha1"]]
    else:
        result["steps"].append({"hero_override_failed": HERO_URL[:100]})
        heroes = [i for i in valid if hero_ok(i)] or [i for i in valid if i["sha1"] not in used]
        if not heroes:
            result["error"] = "No usable hero image; nothing published."; return finish()
        hero = heroes[0]
    body_imgs = [i for i in valid if i["sha1"] != hero["sha1"] and i["w"] >= 800][:3]
    got = []
    for n, img in enumerate([hero] + body_imgs, 1):
        ext = "png" if img["mime"] == "image/png" else "webp" if img["mime"] == "image/webp" else "jpg"
        up = G.upload(img, f"falcon-medusa-m1v2-650l-{n}.{ext}")
        img.update(up); img.pop("body", None); got.append(img)
        result["steps"].append({"uploaded": up["cdn_url"], "src": img["src"][:140], "dims": [img["w"], img["h"]]})
    hero = got[0]
    alts = ["Falcon Optic Medusa M1V2.0-650L thermal scope, side view", "Falcon Optic Medusa M1V2.0-650L thermal riflescope",
            "Falcon Optic Medusa M1V2.0-650L thermal scope with 50mm objective"]
    figs = [fig(got[i + 1], alts[i]) if i + 1 < len(got) else "" for i in range(3)]
    body = build_body(*figs)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    existing = G.sanity_query('*[_id=="%s"][0]{publishedAt,socialScheduleAt,socialScheduleDone}' % BLOG_ID) or {}
    now = datetime.datetime.utcnow().replace(microsecond=0)
    doc = {
        "_id": BLOG_ID, "_type": "blogPost", "title": TITLE, "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti", "authorRole": "Founder, DownRange", "category": "HUNTING", "excerpt": EXCERPT, "body": body,
        "imageUrl": hero["cdn_url"], "imageAlt": "Falcon Optic Medusa M1V2.0-650L thermal scope with built-in laser rangefinder",
        "heroImage": {"_type": "image", "asset": {"_type": "reference", "_ref": hero["asset_id"]}},
        "readTime": max(1, -(-words // 200)), "status": "published", "published": True, "featured": True,
        "publishedAt": existing.get("publishedAt") or (now.isoformat() + "Z"), "tags": TAGS,
        "editorLocked": True, "qualityReviewed": True, "socialCopy": SOCIAL_COPY,
    }
    if existing.get("socialScheduleDone"):
        doc["socialScheduleAt"] = existing.get("socialScheduleAt"); doc["socialScheduleDone"] = True
    else:
        doc["socialScheduleAt"] = (now + datetime.timedelta(minutes=6)).isoformat() + "Z"
        doc["socialSchedulePlatforms"] = SOCIAL_PLATFORMS; doc["socialScheduleDone"] = False
    result["steps"].append({"mutate": G.post_json(G.MUTATE_URL, {"mutations": [{"createOrReplace": doc}]})})
    result["verify"] = G.sanity_query('*[_id=="%s"][0]{_id,title,"slug":slug.current,status,imageUrl,"heroAsset":heroImage.asset._ref,readTime,category,publishedAt,socialScheduleAt,socialScheduleDone,"bodyImgs":count(string::split(body,"cdn.sanity.io/images"))-1}' % BLOG_ID)
    result["ok"] = bool(result["verify"]); result["blog_url"] = f"https://www.downrangeco.com/blog/{SLUG}"; result["words"] = words
    finish()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        open(RESULT_FILE, "w").write(json.dumps({"ok": False, "error": repr(e)}, indent=2)); print("FATAL", repr(e))
