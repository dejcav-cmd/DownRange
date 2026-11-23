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
HERO_URL = "https://us.falconoptic.com/cdn/shop/files/m1v2.0-thermal-scope-50mm-objective-3_2d14f24a-310e-4469-a697-ace29e971a6e.jpg?v=1786064797&width=3200"  # chosen by DJ
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


FILES = "https://us.falconoptic.com/cdn/shop/files/"
FEATURES = [
    # key, file path (+version), alt, caption
    ("gal1", "M1V2-2.jpg?v=1795252364&width=2048", "Falcon Optic Medusa M1V2.0-650L thermal scope", "The Medusa M1V2.0-650L, as pictured on Falcon's product page."),
    ("lens", "m1v2.0-thermal-scope-slogan-2_84059545-24e4-4c11-8036-c977789298d0.jpg?v=1786064795&width=2048", "Falcon lens and 640 sensor", "Falcon's graphic for the lens and 640 sensor pairing."),
    ("core", "m1v2.0-thermal-scope-640-512-sensor-4_1.jpg?v=1789625092&width=2048", "Falcon 640x512 thermal core", "The 640x512 thermal core."),
    ("hz", "m1v2.0-thermal-scope-50hz-refresh-5_20e71942-1769-42a4-885d-09f5252fed8b.jpg?v=1786064795&width=2048", "60Hz refresh rate on the Falcon thermal scope", "Falcon's 60Hz refresh graphic."),
    ("oled", "m1v2.0-thermal-scope-1920-1080-oled-8_3c6447d8-6a60-414e-9720-e4b8594a51f8.jpg?v=1786064795&width=2048", "1920x1080 OLED display on the Medusa M1V2.0-650L", "The 1920x1080 OLED display."),
    ("ball", "m1v2.0-thermal-scope-slogan-14_f1a88af4-f277-40d6-a66c-41e70a7f2abc.jpg?v=1786064795&width=2048", "Falcon thermal scope ballistic calculation", "\"Range it, hold with confidence,\" per Falcon."),
    ("prof", "m1v2.0-thermal-scope-ballistics-16_948a85b7-d085-47df-a9bc-1ab8ab62833a.jpg?v=1786064795&width=2048", "Ten weapon profiles, five reticle colors and ten reticle styles", "Ten gun profiles, five reticle colors and ten reticle styles."),
    ("auto", "m1v2.0-thermal-scope-auto-ballistic-calculation-17_0c1060c1-efc2-4283-90db-9f4e2c8ebdd2.jpg?v=1786064796&width=2048", "Automatic ballistic calculation on the thermal scope", "Automatic ballistic calculation."),
    ("tough", "m1v2.0-thermal-scope-slogan-18_2437dadb-b5cb-4a0d-935a-db416351fa26.jpg?v=1786064795&width=2048", "Falcon Optic thermal scope durability testing", "Falcon lists impact, waterproof, temperature-cycling and aging tests."),
    ("power", "m1v2.0-thermal-scope-power-24_66fc2a32-43ad-411f-b1e6-8714be35cf9d.jpg?v=1786064795&width=2048", "Quick-swap battery on the Medusa M1V2.0-650L", "The quick-swap battery design."),
    ("hand", "m1v2.0-thermal-scope-slogan-25_5256ffbc-1185-4edf-bd8f-0304d274501a.jpg?v=1786064795&width=2048", "Medusa M1V2.0-650L thermal scope in hand", "Falcon's \"Easy to handhold\" graphic."),
    ("c_lrf", "m1v2.0-thermal-scope-built-in-objective-rangefinder-26_a41b0763-230d-48c2-81bf-14e923466c19.jpg?v=1786064795&width=1500", "Built-in laser rangefinder", "Built-in laser rangefinder."),
    ("c_cap", "m1v2.0-thermal-scope-magnetic-silent-lens-cap-27_439e3aba-4d91-4422-a948-aadb7cabd9a0.jpg?v=1786064795&width=1500", "Magnetic silent lens cap", "Magnetic silent lens cap."),
    ("c_amb", "m1v2.0-thermal-scope-ambidextrous-controls-28_934270f0-4651-4824-883c-3f4434f0ff32.jpg?v=1786064795&width=1500", "Ambidextrous controls", "Ambidextrous controls."),
    ("c_wifi", "m1v2.0-thermal-scope-built-in-wifi-29_db881793-af54-42be-8a98-fec5cd0de9c5.jpg?v=1786064795&width=1500", "Built-in Wi-Fi", "Built-in Wi-Fi."),
    ("box", "Falcon_M1v2.0-650L_Thermal_Scope_Packing_List-PC-1.jpg?v=1794994334&width=2048", "Falcon M1V2.0-650L thermal scope packing list", "Falcon's packing-list graphic."),
]


def fig(img, alt, cap):
    if not img:
        return ""
    return (f'<figure class="pr-fig" style="margin:22px 0;"><img src="{img["cdn_url"]}" alt="{html.escape(alt, quote=True)}" '
            f'style="width:100%;border-radius:6px;" loading="lazy" /><figcaption style="font-size:12px;color:var(--text-dim);margin-top:6px;">'
            f'{html.escape(cap)} Image: Falcon Optic (from the {L(PRODUCT, "product page")}).</figcaption></figure>')


def grid(imgs):
    imgs = [i for i in imgs if i]
    if not imgs:
        return ""
    cells = "".join(
        f'<figure style="margin:0;"><img src="{i[0]["cdn_url"]}" alt="{html.escape(i[1], quote=True)}" style="width:100%;border-radius:6px;" loading="lazy" />'
        f'<figcaption style="font-size:12px;color:var(--text-dim);margin-top:4px;">{html.escape(i[2])}</figcaption></figure>' for i in imgs)
    return (f'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:22px 0;">{cells}</div>'
            f'<p style="font-size:12px;color:var(--text-dim);margin-top:-10px;">Images: Falcon Optic (from the {L(PRODUCT, "product page")}).</p>')


def build_body(F):
    def f(k):
        e = next((x for x in FEATURES if x[0] == k), None)
        return fig(F.get(k), e[2], e[3]) if e else ""
    def g(keys):
        out = []
        for k in keys:
            e = next(x for x in FEATURES if x[0] == k)
            out.append((F.get(k), e[2], e[3]) if F.get(k) else None)
        return grid(out)
    HOME_LINK = L(HOME, "Falcon Optic's US site")
    T = G.table
    glance = T([["Sensor", "640&times;512, 12&micro;m pixels"], ["Sensitivity (NETD)", "&le;15mK"], ["Objective", "50mm, F1.0"],
                ["Field of view", "8.8&deg; &times; 6.6&deg;"], ["Optical magnification", "2.8x (digital up to 8x)"],
                ["Laser rangefinder", "1000 yards"], ["Display", "1920&times;1080 OLED, 60Hz"], ["Weight", "650g without mount and battery"],
                ["Protection", "IP67, 10,000J recoil rating"], ["Warranty", "5 years (3 standard + 2 free)"],
                ["Price", "$2,199.00 shown; $1,759.20 with the automatic 20% Black Friday discount"]], ["SPEC", "MEDUSA M1V2.0-650L"])
    lineup = T([
        ["<strong>Medusa M1V2.0-650L</strong>", "Scope", "640&times;512", "50mm", "&le;15mK", "1000yd LRF", "$2,199"],
        ["Medusa M3-635L", "Scope", "640&times;512", "35mm", "&le;18mK", "1000yd LRF", "$1,899"],
        ["Medusa M4V2.0-225L", "Scope", "256&times;192", "25mm", "&le;30mK", "1000yd LRF", "$889"],
        ["Medusa M5-650L", "Scope", "640&times;512", "50mm", "&le;18mK", "1000yd LRF", "$2,999"],
        ["Surtur S1 series", "Monocular", "640&times;512", "n/a listed", "&le;18mK", "1000yd LRF", "from $1,599"],
        ["Titan T1-650L", "Multi-spectral scope", "640&times;512 thermal / 2K digital night vision", "50mm", "&le;18mK", "1000yd LRF", "$1,300 (regular $1,999)"],
        ["Ymir Y1LV2.0", "Digital night vision scope", "2592&times;1944", "70mm", "n/a", "n/a", "$699"]],
        ["MODEL", "TYPE", "SENSOR", "LENS", "NETD", "RANGEFINDER", "PRICE SHOWN"])
    box = T([["Sensor", "640&times;512"], ["Pixel size", "12&micro;m"], ["NETD", "&le;15mK"], ["Objective", "50mm F1.0"], ["Field of view", "8.8&deg; &times; 6.6&deg;"],
             ["Optical magnification", "2.8x"], ["Digital zoom steps", "1x, 1.5x, 2x, 2.5x, 3x, 4x, 6x, 8x"], ["Detection range", "&gt;2,500m"],
             ["Laser rangefinder", "1000yd"], ["Display", "1920&times;1080 OLED, 60Hz"], ["Color modes", "White Hot, Black Hot, Red Hot, High Contrast, Low Light, Fusion"],
             ["Reticles", "10 designs, 5 colors"], ["Gun profiles", "10"], ["Battery", "18650, 3500mAh, replaceable; 5 hours expected; external power capable"],
             ["Start-up", "7 seconds (power-saver mode also 7s)"], ["Weight", "650g &plusmn;5g (no mount or battery)"], ["Dimensions", "224 &times; 75 &times; 91mm"],
             ["Operating temperature", "-20&deg;C to +50&deg;C"], ["Recoil resistance", "10,000J"], ["Waterproofing", "IP67"]], ["SPEC", "MANUFACTURER LISTING"])
    parts = [
        '<p style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:var(--text-dim);">Prices, promotions and specifications are as shown on Falcon Optic\'s US site on November 23, 2026. Specs are the manufacturer\'s claims; DownRange has not tested this scope yet. Photos and graphics: Falcon Optic (from the ' + L(PRODUCT, 'product page') + ').</p>',
        "<h2>Why Everyone Is Talking About Sub-$2,000 640 Thermal</h2>",
        f"<p>For years, a thermal scope with a 640&times;512 sensor, a big objective and a built-in rangefinder meant a price tag that made most hunters shrug and keep their spotlight. Falcon Optic wants to change that. Its tagline is \"Sensor 640 for the Rest of Us,\" and the Medusa M1V2.0-650L is the scope that has to back it up: a 640&times;512 sensor at &le;15mK NETD, a 50mm F1.0 lens, a 1000-yard laser rangefinder, automatic ballistics, Wi-Fi and an IP67 rating, shown at $2,199 on {HOME_LINK}. "
        "With Falcon's Black Friday sale running, the product page applies 20% off automatically, which brings it to <strong>$1,759.20</strong>.</p>",
        "<p>Below: what the scope is, what each feature means for a hunter, how the rest of Falcon's lineup stacks up, and every Black Friday perk we found. This is a first look built from Falcon's own numbers and photos. A hands-on review is coming.</p>",
        f("gal1") if False else f("gal1"),
        "<h2>At a Glance</h2>", glance,
        "<h2>Who Is Falcon Optic?</h2>",
        f"<p>Falcon describes itself on its {L('https://us.falconoptic.com/pages/about-us', 'About page')} as a professional thermal imaging and night vision manufacturer, and says it develops the core thermal solution in-house: optical design, image processing, firmware, rangefinding, power management and housing. It also says, \"We are new here,\" which is honest context: this is not a decades-old thermal brand. "
        "The company claims it rejects any sensor above 18mK NETD and tests every unit for recoil, freezing, heat, continuous running and water exposure. Those are company statements, and we have not verified them. "
        "The US store lists free shipping within the US, 30-day returns and a five-year warranty (three years standard plus two years free).</p>",
        "<h2>The Falcon Thermal Lineup</h2>",
        f"<p>Falcon's range splits into riflescopes and a portable monocular, with a multi-spectral scope and a digital night vision scope alongside. Browse the {L(SCOPES, 'thermal scope collection')} and the {L(MONOS, 'thermal monocular collection')}. Prices below are what the sale page showed on November 23.</p>",
        lineup,
        "<ul><li><strong>Medusa series (scopes).</strong> The M1V2.0-650L is the headline model and has the lowest NETD Falcon lists across the Medusa scopes (&le;15mK). The M5-650L shares its 640&times;512 sensor and 50mm lens at a higher price and a listed &le;18mK. The M3-635L steps down to a 35mm lens for a wider view at a lower price. The M4V2.0-225L is the budget entry with a 256&times;192 sensor.</li>"
        "<li><strong>Surtur series (monocular).</strong> A handheld 640&times;512 thermal with a 1000-yard rangefinder for scouting, spotting and recovery, from $1,599.</li>"
        "<li><strong>Titan T1-650L.</strong> A multi-spectral scope pairing a 640&times;512 thermal sensor with 2K digital night vision for day-to-night use, shown at $1,300 against a $1,999 regular price (Falcon's page says 35% off).</li>"
        "<li><strong>Ymir Y1LV2.0.</strong> A digital night vision scope (2592&times;1944, 70mm) at $699 for hunters who want night capability without thermal.</li></ul>",
        "<h2 id=\"m1\">Medusa M1V2.0-650L: The Detailed Look</h2>",
        "<h3>The sensor and glass: where the image comes from</h3>",
        "<p>The heart of the scope is a 640&times;512 core with 12&micro;m pixels and a listed sensitivity of &le;15mK NETD. NETD measures the smallest temperature difference the sensor can pick up; lower is better. Falcon says it tunes the core together with its own optics, image processing and firmware rather than dropping in a generic module.</p>",
        f("lens"),
        "<p>Up front sits a 50mm F1.0 objective. Falcon lists an 8.8&deg; &times; 6.6&deg; field of view and 2.8x optical magnification, with digital steps of 1.5x, 2x, 2.5x, 3x, 4x, 6x and 8x. Falcon pitches the 50mm glass for open fields and longer lanes, with hog, coyote and deer in mind.</p>",
        "<p><strong>DownRange math.</strong> A 12&micro;m pixel behind a 50mm lens covers about 0.24 milliradians. At 100 yards, one pixel spans roughly 0.86 inches, and 640 pixels across at 0.24 mrad works out to about 8.8 degrees, matching Falcon's listed horizontal field of view. That is the detail budget: a 40-inch deer spans roughly 46 pixels across at 100 yards and about 15 at 300. Falcon lists detection range at more than 2,500 meters. That is a claim about spotting a heat source, not about identifying what it is.</p>",
        f("core"),
        "<h3>The display: 1080p OLED at 60Hz</h3>",
        "<p>You look at a 1920&times;1080 OLED display refreshed at 60Hz. Falcon's pitch is \"No Lag, No Smear,\" meaning an easier time tracking a moving animal while you scan. Six color modes are on tap: White Hot, Black Hot, Red Hot, High Contrast, Low Light and Fusion, and Falcon lists AI image enhancement.</p>",
        g(["hz", "oled"]),
        "<h3>Range it, hold it: rangefinder and ballistics</h3>",
        "<p>The built-in laser rangefinder is listed at 1000 yards and feeds an automatic ballistic calculator, so you range the target and hold for the drop without a second device. The scope stores ten gun profiles and offers ten reticle designs in five colors. Falcon's line: \"Range it, hold with confidence.\" Whether that confidence is earned depends on your ballistic inputs and how the rangefinder behaves on low-contrast targets, which is exactly what we plan to test. One buyer on the product page reports first-round hits at 331 yards after tuning, and another notes ballistic input is metric only. Those are customer comments, not our results.</p>",
        g(["ball", "prof", "auto"]),
        "<h3>Recording, Wi-Fi and the app</h3>",
        "<p>The scope records photos and video onboard, and built-in Wi-Fi handles image sharing and remote control from a phone through the Falcon Outdoor app, which also live-streams the scope view. Falcon's listing gives no recording resolution or storage size and does not list recoil-activated recording; one reviewer points that out.</p>",
        "<h3>Power: quick-swap and external</h3>",
        "<p>It runs on a replaceable 18650 battery (3500mAh) with an expected runtime of 5 hours, and it can run from external power. Two 18650 batteries ship in the box. Falcon's homepage banner reads \"Forget the battery. Hunt till dawn.\" Real runtime depends on cold, Wi-Fi and rangefinder use, and a few buyers say the battery drains fast. We will measure it.</p>",
        g(["power", "hand"]),
        "<h3>Built to take recoil</h3>",
        "<p>Falcon lists IP67 waterproofing, a 10,000J recoil rating, an operating range of -20&deg;C to +50&deg;C and a weight of 650g (&plusmn;5g) without the mount and battery. Dimensions are 224 &times; 75 &times; 91mm, and start-up takes about 7 seconds. Falcon names impact, waterproof, temperature-cycling and aging tests on the page but gives no test details.</p>",
        f("tough"),
        "<h3>Controls that help in the field</h3>",
        "<p>Falcon highlights four hunting-focused details: the built-in laser rangefinder, a magnetic silent lens cap, ambidextrous controls and built-in Wi-Fi.</p>",
        g(["c_lrf", "c_cap", "c_amb", "c_wifi"]),
        "<h3>Full specifications (manufacturer-listed)</h3>", box,
        "<h3>What is in the box</h3>",
        "<p>The scope, a user manual, a warranty card, a cleaning cloth, two 18650 batteries, a 5V/2A adapter, a Type-C data cable, installation tool accessories, a Picatinny mount and a shoulder strap. A digital manual is available from Falcon's product page.</p>",
        f("box"),
        "<h2>What Buyers on the Product Page Say</h2>",
        f"<p>The {L(PRODUCT, 'product page')} shows a 4.6 star rating from 7 reviews: four 5-star and three 4-star. Reviewers praise image clarity, the 50mm lens and the rangefinder. On the other side, comments mention ballistics setup taking effort, a thin manual, fast battery drain and one app problem that Falcon replied to. Seven reviews is a small sample, and these are customer comments on the seller's own site, not independent tests. We treat them as a checklist.</p>",
        "<h2>What We Plan to Test</h2>",
        "<ul><li><strong>Identification range.</strong> How far can we tell a hog from a coyote, not just see a hot spot?</li>"
        "<li><strong>Real battery life.</strong> Hours against the listed 5, with Wi-Fi and the rangefinder in use and in cold weather.</li>"
        "<li><strong>Rangefinder and ballistics.</strong> Consistency on animals, brush and low-contrast targets, and how the solution compares with actual impacts.</li>"
        "<li><strong>Zero retention.</strong> Whether the scope holds zero across repeated shots and remounts.</li>"
        "<li><strong>App stability.</strong> Whether Wi-Fi pairing, recording and live streaming work in the field.</li>"
        "<li><strong>Image comparison.</strong> A side-by-side with other 640-class scopes.</li></ul>",
        "<h2>What We Could Not Verify</h2>",
        "<p>Falcon's site does not state a country of origin, and we did not find an export-control statement on the pages we read. We also have no independent lab data on the specs above. If country of origin or service location matters to you, ask Falcon before you buy; the " + L("https://us.falconoptic.com/pages/contact", "contact page") + " promises a reply within 24 business hours.</p>",
        "<h2>Before You Hunt With Thermal</h2>",
        "<p>Rules on using thermal and night-vision devices for hunting vary by state, species and season, and some states restrict them for certain game or hours. Check your state wildlife agency's current regulations before you buy or hunt, and see our " + I("/hunting", "hunting page") + " and " + I("/laws", "state gun laws hub") + " for state-level information.</p>",
        "<h2>Falcon Optic's Black Friday Sale</h2>",
        f"<p>Falcon says its Black Friday sale runs from <strong>November 16 to November 30, 2026 (EST)</strong>. The sale page is {L(BF, 'here')}. As shown on November 23:</p>"
        "<ul><li><strong>Up to 20% off.</strong> The sale page is headlined \"Up to 20% off,\" and the M1V2.0-650L product page shows 20% off applied automatically at checkout ($1,759.20). Not every item carries the same discount: the Titan T1-650L, for example, shows 35% off its regular price.</li>"
        "<li><strong>Free Battery Pack.</strong> Falcon says every eligible product purchase comes with one.</li>"
        "<li><strong>Combo bonus.</strong> Spend $1,900 or more on combo products and receive an additional free accessory pack (batteries, a charger, a Falcon hat and a patch).</li>"
        "<li><strong>Lucky Spin Wheel.</strong> One free spin for entering an email (each successful friend referral adds a spin), with prizes of discounts, free gifts or a grand prize valued up to $1,999. Rewards must be claimed by November 30. Coupons apply to non-accessory products and cannot be combined with other offers unless stated, and eligibility is US residents 18 or older.</li>"
        "<li><strong>Shipping and returns.</strong> The product page lists free shipping within the US and 30-day returns.</li></ul>"
        f"<p>Promotions have terms and can change, so confirm everything at checkout. Start at {L(HOME, 'us.falconoptic.com')}, or go straight to the {L(PRODUCT, 'Medusa M1V2.0-650L page')} or the {L(BF, 'Black Friday sale page')}.</p>",
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
    hero = G.fetch_valid(HERO_URL)
    if not hero:
        result["error"] = "Hero image could not be fetched; nothing published."; return finish()
    hero["src"] = HERO_URL
    seen = {hero["sha1"]}
    ups = [hero]
    F = {}
    for n, (key, path, alt, cap) in enumerate(FEATURES, 1):
        u = FILES + path
        try:
            img = G.fetch_valid(u)
        except Exception as e:
            img = None
        if not img or img["sha1"] in seen:
            result["steps"].append({"skipped": key}); continue
        seen.add(img["sha1"]); img["src"] = u; ups.append(img); F[key] = img
    for n, img in enumerate(ups, 1):
        ext = "png" if img["mime"] == "image/png" else "webp" if img["mime"] == "image/webp" else "jpg"
        up = G.upload(img, f"falcon-medusa-m1v2-650l-{n}.{ext}")
        img.update(up); img.pop("body", None)
        result["steps"].append({"uploaded": up["cdn_url"], "dims": [img["w"], img["h"]]})
    hero = ups[0]
    body = build_body(F)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    existing = G.sanity_query('*[_id=="%s"][0]{publishedAt,socialScheduleAt,socialScheduleDone}' % BLOG_ID) or {}
    now = datetime.datetime.utcnow().replace(microsecond=0)
    doc = {
        "_id": BLOG_ID, "_type": "blogPost", "title": TITLE, "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti", "authorRole": "Founder, DownRange", "category": "HUNTING", "excerpt": EXCERPT, "body": body,
        "imageUrl": hero["cdn_url"], "imageAlt": "Falcon Optic Medusa M1V2.0-650L thermal scope with 50mm objective lens for hog, coyote and deer hunting",
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
