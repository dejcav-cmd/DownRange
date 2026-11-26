import json, os, urllib.request
r = json.load(open("scripts/jrc_review_social_result.json"))
fb = [x for x in r["results"] if x["platform"] == "facebook"][0]
url = "https://www.downrangeco.com/blog/jrc-guns-heavy-weight-magwell-frame-weight-thumb-rest-2026"
PAGE = "61591686637969"
orig = ("JRC Guns' Heavy Weight Magwell and Frame Weight & Thumb Rest Combo: we have them in hand and the craftsmanship is amazing. "
        "Here's what they do, what to know before you buy, and what we'll test when we hit the range in the coming weeks.\n\n"
        f"Read it: {url}\n\nThanks to JRC Guns — jrcguns.com | https://www.facebook.com/profile.php?id={PAGE} | YouTube @JRCGuns")
new = ("JRC Guns' Heavy Weight Magwell and Frame Weight & Thumb Rest Combo: we have them in hand and the craftsmanship is amazing. "
       "Here's what they do, what to know before you buy, and what we'll test when we hit the range in the coming weeks.\n\n"
       f"Read it: {url}\n\nThank you @[{PAGE}] for sending us these products for review. Opinions are our own. jrcguns.com | YouTube @JRCGuns")
body = json.dumps({"facebookEdit": {"postId": fb["postId"], "message": new, "original": orig}}).encode()
rq = urllib.request.Request("https://www.downrangeco.com/api/admin/social-custom", data=body, method="POST",
    headers={"Content-Type": "application/json", "x-admin-key": os.environ["ADMIN_KEY"]})
try: out = json.loads(urllib.request.urlopen(rq, timeout=100).read())
except Exception as e: out = {"error": str(e)}
json.dump(out, open("scripts/fb_tag_result.json", "w"), indent=2); print(json.dumps(out, indent=2))
