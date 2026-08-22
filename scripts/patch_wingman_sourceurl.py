#!/usr/bin/env python3
"""
Patches the Wingman SBR firearmRelease + blogPost:
- Fixes sourceUrl to the real manufacturer product page
- Upgrades hero/secondary images to the official higher-res manufacturer photos
"""
import os
import re
import json
import urllib.request

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

ASSET_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/{SANITY_DATASET}"
MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}"
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"

RELEASE_ID = "release-88c40ff6a52f"
BLOG_ID = "blog-fierce-wingman-sbr-2026"
CORRECT_SOURCE_URL = "https://fiercearms.com/firearm/wingman-sbr/"

HERO_CANDIDATES = [
    "https://fiercearms.com/wp-content/uploads/2026/08/DSC09418.jpg",
]
SECONDARY_CANDIDATES = [
    "https://fiercearms.com/wp-content/uploads/2026/08/DSC09446-1.jpg",
    "https://i0.wp.com/fiercearms.com/wp-content/uploads/2026/08/DSC09446-1.jpg?fit=1920%2C1283&ssl=1",
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
            if len(body) < 20000:
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


BLOG_INTRO = (
    "Fierce Firearms has never been shy about building precision rifles that punch above their category, "
    "and the new Wingman SBR is the clearest example yet of where that philosophy is headed. At 5.4 pounds bare, "
    "with a titanium action and a 12.5-inch carbon-fiber barrel, the Wingman is built on the company's CT Mini Rogue "
    "platform, shortened into a package that rides under a truck seat, behind a UTV bench, or in a daypack, and "
    "comes out shooting.</p>\n{secondary_img_tag}\n<p>I've spent enough time around varmint and predator rigs to know"
)


def main():
    if not SANITY_TOKEN:
        print(json.dumps({"ok": False, "error": "SANITY_API_TOKEN not set"}))
        return

    result = {"ok": False, "steps": []}

    hero = upload_first_working(HERO_CANDIDATES, SANITY_TOKEN, "fierce-wingman-sbr-hero-official.jpg")
    result["steps"].append({"upload_hero": hero})
    secondary = upload_first_working(SECONDARY_CANDIDATES, SANITY_TOKEN, "fierce-wingman-sbr-secondary-official.jpg")
    result["steps"].append({"upload_secondary": secondary})

    mutations = []

    # Patch firearmRelease: sourceUrl always; heroImage only if upload succeeded
    release_set = {"sourceUrl": CORRECT_SOURCE_URL}
    if hero.get("asset_id"):
        release_set["heroImage"] = {"_type": "image", "asset": {"_type": "reference", "_ref": hero["asset_id"]}}
        release_set["imageUrl"] = None
        release_set["imageMethod"] = "manual-real-photo-manufacturer"
    mutations.append({"patch": {"id": RELEASE_ID, "set": release_set}})

    # Patch blogPost: imageUrl + rebuilt body with inline secondary image, only if hero upload succeeded
    if hero.get("asset_id"):
        # Fetch current body to preserve everything after the intro paragraph
        current = sanity_query(f'*[_id == "{BLOG_ID}"][0]{{body}}', SANITY_TOKEN)
        current_body = current.get("result", {}).get("body", "")
        if secondary.get("asset_id"):
            img_tag = (
                f'<img src="{secondary["cdn_url"]}" alt="Fierce Firearms Wingman SBR precision rifle" '
                'style="width:100%;border-radius:6px;margin:16px 0;" />'
            )
        else:
            img_tag = ""
        # Replace the opening paragraph + old image (if any) with the fresh intro + new/no image tag
        new_intro = (
            "<h2>A Full-Size Rifle That Fits Behind the Seat</h2>\n<p>" + BLOG_INTRO.format(secondary_img_tag=img_tag)
        )
        rebuilt_body = re.sub(
            r"<h2>A Full-Size Rifle That Fits Behind the Seat</h2>.*?<p>I've spent enough time",
            new_intro,
            current_body,
            count=1,
            flags=re.DOTALL,
        )
        blog_set = {"imageUrl": hero["cdn_url"], "body": rebuilt_body}
        mutations.append({"patch": {"id": BLOG_ID, "set": blog_set}})

    mutate_result = http_post_json(MUTATE_URL, {"mutations": mutations}, SANITY_TOKEN)
    result["steps"].append({"mutate_result": mutate_result})

    verify = sanity_query(
        '{"release": *[_id == "%s"][0]{_id, sourceUrl, heroImage{asset->{url}}}, '
        '"blog": *[_id == "%s"][0]{_id, imageUrl}}' % (RELEASE_ID, BLOG_ID),
        SANITY_TOKEN,
    )
    result["verify"] = verify.get("result")
    result["ok"] = True

    with open("wingman_patch_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
