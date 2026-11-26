#!/usr/bin/env python3
"""Publishes the JRC Guns magwell + frame weight & thumb rest preview as a DownRange blogPost.
Reuses JRC's product photos (credited); tries extra product image URLs and skips any that fail."""
import os, re, json, datetime, urllib.request, urllib.parse

PID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
DS = "production"
TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if TOKEN.startswith("ST="): TOKEN = TOKEN[3:]
ASSET = f"https://{PID}.api.sanity.io/v2024-01-01/assets/images/{DS}"
MUTATE = f"https://{PID}.api.sanity.io/v2024-01-01/data/mutate/{DS}"

# Already on the Sanity CDN from the earlier frame-weight article
HERO = "https://cdn.sanity.io/images/vbnsqnkg/production/ce7527a81608b48cdd18e7816486282f864c9766-1448x1086.webp"
FW2 = "https://cdn.sanity.io/images/vbnsqnkg/production/089a976e1ed6b7dd4f86ab43e6993fbbd5eb5b84-1448x1086.jpg"
BASE = "https://jrcguns.com/airo-assets/images/products/"
MAG_C = ["jrc-heavy-weight-magwell", "jrc-heavy-weight-magwell-2", "jrc-glock-heavy-weight-magwell"]
TR_C = ["jrc-thumb-rest-gen3", "jrc-thumb-rest-gen3-2", "jrc-thumb-rest", "jrc-glock-thumb-rest"]
UA = {"User-Agent": "Mozilla/5.0"}

def upload(cands, filename):
    for c in cands:
        try:
            req = urllib.request.Request(BASE + c, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                body, ct = r.read(), r.headers.get("Content-Type", "")
            if len(body) < 5000 or not ct.startswith("image"): continue
            rq = urllib.request.Request(f"{ASSET}?filename={filename}", data=body, method="POST")
            rq.add_header("Content-Type", ct); rq.add_header("Authorization", f"Bearer {TOKEN}")
            with urllib.request.urlopen(rq, timeout=60) as r2:
                d = json.loads(r2.read())["document"]
            return {"url": d["url"], "source": BASE + c}
        except Exception:
            continue
    return None

def fig(url, alt, cap):
    if not url: return ""
    return (f'<figure style="margin:20px 0"><img src="{url}" alt="{alt}" style="width:100%;border-radius:6px" />'
            f'<figcaption style="font-size:13px;opacity:.7">{cap} Photo: JRC Guns.</figcaption></figure>')

BODY = """
<p>Most Glock upgrades chase one thing: making the gun do what you already want it to do, only more consistently. <a href="https://www.jrcguns.com" rel="noopener">JRC Guns</a>, a small Georgia shop that builds in the USA as a licensed FFL manufacturer, has put together a trio of parts that go after exactly that: a heavy magwell for faster, steadier reloads, plus a frame weight and thumb rest pairing for flatter recoil and a repeatable support-thumb spot.</p>
<p>We have these parts in hand, and we'll be straight about where we are: <strong>we haven't put rounds through them yet.</strong> This is our close look at the hardware, what JRC publishes, and how it stacks up against the field. Our full range review is coming in the next few weeks, and we'll share it here.</p>
{fig_setup}
<h2>At a Glance</h2>
<table style="width:100%;border-collapse:collapse"><tr><th align="left">Part</th><th align="left">Price</th><th align="left">Fits</th><th align="left">Finish</th></tr>
<tr><td>Heavy Weight Magwell</td><td>$179.95</td><td>Glock Gen 1&ndash;4 (not Gen 5/6)</td><td>Armor Black or FDE</td></tr>
<tr><td>Frame Weight System</td><td>$149.99</td><td>Gen 1&ndash;5: G17, G22, G23, G20, G21, G31, G34, G35</td><td>Armor Black or FDE</td></tr>
<tr><td>Thumb Rest</td><td>$39.95</td><td>Mounts to the JRC Frame Weight</td><td>Machined aluminum</td></tr></table>
<p>Frame weight plus thumb rest is <strong>$189.94</strong>; add the magwell and the full setup is <strong>$369.89</strong>. JRC lists these as separate items, so you can build up in stages.</p>
<h2>Craftsmanship: This Is Where JRC Shines</h2>
<p>Let's start with the part that surprised us most. Pull these out of the box and the build quality is the first thing you notice. The craftsmanship is amazing, and we mean that plainly. The parts feel like they were made by people who shoot Glocks for a living, not by a shop chasing a trend. The Armor Black and FDE finishes are consistent across all three pieces, so the setup looks like one system instead of a pile of mismatched accessories, and the weight you feel in your hand is exactly what a product sold on mass should deliver.</p>
<p>That fits JRC's story: made in the USA, by a licensed FFL manufacturer, in a small Georgia shop. Parts like this live or die on fit and finish, and JRC clears that bar with room to spare. We're genuinely impressed, and it's a big reason we're excited to get them on the range.</p>
<h2>The Heavy Weight Magwell: Weight Where Your Hand Lives</h2>
<p>A magwell does two jobs. The flared opening gives a loaded magazine a bigger target on a reload, and the extra mass at the base of the grip shifts the gun's balance back toward your hand. Other heavy options have a following: S&amp;J Custom sells a brass Glock magwell on the basis of being about 3.5 times heavier than its aluminum ones, at 8.7 ounces. JRC is clearly after that same shooter.</p>
<p>It ships with a magwell plug at no extra cost (choose the Gen 1&ndash;3 or Gen 4 version at checkout, since they differ), and it matches the frame weight finish-for-finish.</p>
{fig_mag}
<h2>The Frame Weight: About Six Ounces Where Recoil Starts</h2>
<p>JRC's frame weight adds about 6 ounces to the front of the frame and is aimed at reducing muzzle rise and felt recoil <em>without adding mass to the slide</em>. That's the smart part: slide weight has to start and stop with every shot, while frame weight just sits there resisting muzzle lift. We covered this part earlier in <a href="/blog/jrc-guns-glock-frame-weight-2026">JRC Guns' New Glock Frame Weight Adds 6 Ounces Where It Actually Helps</a>; here we're looking at it as part of a system. JRC also says it fits CR-Speed World Shoot II holsters, with minor fitting possible.</p>
{fig_fw}
<h2>The Thumb Rest: A Consistent Place for Your Support Thumb</h2>
<p>Thumb rests started on competition guns and have been moving onto everyday pistols because they give the support thumb the same landing spot every time and something to push against as the muzzle rises. JRC's is precision-machined aluminum, mounts to the left side of the frame weight with four 1/4-inch screws (bring your own Allen wrench), and doesn't attach to the Glock frame itself, so there's no permanent change to your pistol.</p>
{fig_tr}
<h2>Why the Combo Makes Sense</h2>
<p>At $189.94 for the pair you get a forward-balanced gun and a fixed thumb position in one move, and the two parts are designed around each other. For anyone new to upgrades, that's a low-guesswork way to start.</p>
<h2>What We Like</h2>
<ul><li>Outstanding craftsmanship and consistent finishes across all three parts</li><li>Weight on the frame, not the slide</li><li>Made in the USA by a licensed FFL manufacturer</li><li>No permanent changes to the Glock frame for the weight and thumb rest</li><li>Magwell plug included, chosen per generation</li><li>Buy in stages: the thumb rest is only $39.95</li><li>Tracked UPS shipping from Georgia</li></ul>
<h2>Where JRC Could Improve</h2>
<ul><li>The magwell is Gen 1&ndash;4 only; JRC lists a Gen 5/6 version as in development.</li><li>Weights and materials aren't listed for the magwell, and the frame weight page doesn't name its material. For parts sold on mass, an ounce count would help.</li><li>Compatibility details differ in places (the thumb rest page cites Gen 1&ndash;5 in one spot and Gen 3&ndash;5 in another).</li><li>Competition legality lists differ between the product page and the FAQ, so check with your match director.</li><li>No warranty terms on the product pages.</li><li>The thumb rest mounts on the left side; JRC doesn't say whether a left-handed option exists.</li></ul>
<p>None of these are deal breakers; most are product-page fixes a small shop can make quickly.</p>
<h2>Who Should Look at This</h2>
<p>Competition shooters running a Glock 17, 34 or 35 (and the other listed models) get the clearest payoff. Range shooters who want calmer recoil will like it too. Concealed carriers should think twice: six extra ounces up front and a bigger magwell are range-gun traits.</p>
<p><strong>DownRange Bottom Line:</strong> JRC has built a coherent system: weight low in the grip, weight forward in the frame, and a thumb rest that ties it together, all with craftsmanship that impressed us right out of the box. We'll test it properly and report back in the coming weeks with real numbers from the range.</p>
<h2>Follow JRC Guns</h2>
<p>Thanks to JRC Guns for building parts like these. Find them at <a href="https://www.jrcguns.com" rel="noopener">jrcguns.com</a>, on <a href="https://www.facebook.com/profile.php?id=61591686637969" rel="noopener">Facebook</a> and on YouTube at <a href="https://www.youtube.com/@JRCGuns" rel="noopener">@JRCGuns</a>.</p>
<p style="font-size:13px;opacity:.75"><strong>Sources:</strong> specs and pricing from JRC Guns' product pages for the <a href="https://www.jrcguns.com/products/jrc-heavy-weight-magwell">Heavy Weight Magwell</a>, <a href="https://www.jrcguns.com/products/jrc-glock-frame-weight-system">Frame Weight System</a> and <a href="https://www.jrcguns.com/products/jrc-thumb-rest-gen3">Thumb Rest</a>, as listed at time of writing; magwell comparison from the <a href="https://www.shootersconnectionstore.com/SJC-Glock-Heavy-Weight-Mag-well-P4117.aspx">S&amp;J Custom listing</a>. Prices and compatibility can change; check JRC before buying. JRC states its products are not made, authorized, endorsed or warranted by GLOCK. This is a hands-on look at the hardware, not a range test.</p>
""".strip()

def main():
    if not TOKEN:
        print(json.dumps({"ok": False, "error": "no token"})); return
    mag = upload(MAG_C, "jrc-heavy-weight-magwell.jpg")
    tr = upload(TR_C, "jrc-thumb-rest.jpg")
    body = BODY.format(
        fig_setup=fig(HERO, "JRC Guns Glock frame weight on a pistol", "The JRC frame weight system."),
        fig_mag=fig(mag["url"] if mag else None, "JRC Heavy Weight Magwell", "JRC's Heavy Weight Magwell."),
        fig_fw=fig(FW2, "JRC Glock Frame Weight System, Armor Black", "The frame weight in Armor Black."),
        fig_tr=fig(tr["url"] if tr else None, "JRC Thumb Rest", "JRC's aluminum thumb rest."),
    )
    words = len(re.sub("<[^>]+>", " ", body).split())
    slug = "jrc-guns-heavy-weight-magwell-frame-weight-thumb-rest-2026"
    doc = {
        "_id": "blog-" + slug, "_type": "blogPost",
        "title": "JRC Guns' Heavy Weight Magwell and Frame Weight & Thumb Rest Combo: What to Know Before You Buy",
        "slug": {"_type": "slug", "current": slug},
        "author": "DownRange Co. Intel Desk", "authorRole": "Editorial Team, DownRange Co.",
        "authorImg": "/img/logo.png",
        "category": "GEAR",
        "excerpt": "We have JRC Guns' heavy magwell, frame weight and thumb rest in hand. The craftsmanship is outstanding. Here's what they do, what to watch for, and what we'll test on the range.",
        "body": body, "imageUrl": HERO, "readTime": max(1, -(-words // 200)),
        "status": "published", "published": True, "featured": False,
        "publishedAt": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "tags": ["Glock", "Magwell", "Frame Weight", "Thumb Rest", "JRC Guns"],
        "editorLocked": True, "qualityReviewed": True,
    }
    rq = urllib.request.Request(MUTATE, data=json.dumps({"mutations": [{"createOrReplace": doc}]}).encode(), method="POST")
    rq.add_header("Content-Type", "application/json"); rq.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(rq, timeout=30) as r:
        res = json.loads(r.read())
    out = {"ok": True, "slug": slug, "blog_url": f"https://www.downrangeco.com/blog/{slug}",
           "imageUrl": HERO, "magwell_img": mag, "thumbrest_img": tr, "mutate": res}
    json.dump(out, open("jrc_review_result.json", "w"), indent=2)
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
