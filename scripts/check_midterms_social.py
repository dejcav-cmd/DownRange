#!/usr/bin/env python3
"""Reads back the midterms blog post, its social post results, and the live page status (runs in Actions)."""
import os, json, urllib.parse, urllib.request, urllib.error

SLUG = "midterms-2a-outlook-by-state-2026"
BLOG_ID = "blog-midterms-2026-second-amendment"
Q = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if TOKEN.startswith("ST="):
    TOKEN = TOKEN[3:]


def q(groq):
    req = urllib.request.Request(Q + "?query=" + urllib.parse.quote(groq))
    req.add_header("Authorization", "Bearer " + TOKEN)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode()).get("result")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 DownRangeBot/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            b = r.read().decode("utf-8", "ignore")
            return r.status, b
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)


out = {}
out["post"] = q('*[_id=="%s"][0]{status,socialScheduleAt,socialScheduleDone,socialScheduleStartedAt}' % BLOG_ID)
out["social"] = q('*[_type=="socialPost" && articleSlug=="%s"]{platform,status,error,postUrl,postedAt,hasImage,content} | order(platform)' % SLUG)
st, html = fetch("https://www.downrangeco.com/blog/" + SLUG)
out["live"] = {"status": st, "has_title": "What the Results Mean for Gun Owners" in html,
               "has_canonical": ("rel=\"canonical\" href=\"https://www.downrangeco.com/blog/" + SLUG) in html,
               "has_jsonld": "BreadcrumbList" in html, "has_hero": "1870e0f68465ba17b2895ef46c6aa5f816a7a435" in html,
               "len": len(html)}
st2, sm = fetch("https://www.downrangeco.com/sitemap.xml")
out["sitemap"] = {"status": st2, "contains_slug": SLUG in sm}
with open("midterms_social_check.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2)[:5000])
