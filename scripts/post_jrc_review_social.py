import json, os, time, urllib.request
r = json.load(open("scripts/jrc_review_result.json"))
url, img = r["blog_url"], r["imageUrl"]
# wait for the live page
for _ in range(20):
    try:
        if urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).status == 200: break
    except Exception: time.sleep(15)
tag = "Parts by JRC Guns: jrcguns.com | YouTube @JRCGuns"
posts = [
 {"platform": "bluesky", "content": f"Glock upgrade look: JRC Guns' Heavy Weight Magwell + Frame Weight & Thumb Rest. The craftsmanship is outstanding. Range review coming soon. {tag} {url}"[:295]},
 {"platform": "threads", "content": f"We have JRC Guns' Heavy Weight Magwell, Frame Weight and Thumb Rest in hand, and the craftsmanship is amazing. Our range review is coming in the next few weeks. Full look: {url}\n\n{tag}"},
 {"platform": "facebook", "content": f"JRC Guns' Heavy Weight Magwell and Frame Weight & Thumb Rest Combo: we have them in hand and the craftsmanship is amazing. Here's what they do, what to know before you buy, and what we'll test when we hit the range in the coming weeks.\n\nRead it: {url}\n\nThanks to JRC Guns — jrcguns.com | https://www.facebook.com/profile.php?id=61591686637969 | YouTube @JRCGuns"},
 {"platform": "instagram", "content": f"Craftsmanship check: JRC Guns' Heavy Weight Magwell + Frame Weight & Thumb Rest for Glock. Range review coming in the next few weeks. Full article: link in our bio (downrangeco.com/blog).\n\n{tag}\n\n#Glock #JRCGuns #Magwell #FrameWeight #2A #DownRange"},
 {"platform": "twitter", "content": f"JRC Guns' Heavy Weight Magwell + Frame Weight & Thumb Rest for Glock: craftsmanship is outstanding. Range review coming soon. {url}\n{tag}"[:275]},
]
body = json.dumps({"posts": posts, "imageUrl": img, "title": "JRC Guns Heavy Weight Magwell and Frame Weight & Thumb Rest"}).encode()
rq = urllib.request.Request("https://www.downrangeco.com/api/admin/social-custom", data=body, method="POST",
    headers={"Content-Type": "application/json", "x-admin-key": os.environ["ADMIN_KEY"]})
try:
    out = json.loads(urllib.request.urlopen(rq, timeout=150).read())
except Exception as e:
    out = {"ok": False, "error": str(e)}
json.dump(out, open("scripts/jrc_review_social_result.json", "w"), indent=2)
print(json.dumps(out, indent=2))
