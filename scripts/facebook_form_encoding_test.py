"""
Tests whether the /feed publish failure is caused by JSON-body vs form-encoded POST.
Posts a short, clearly-labeled test message using form-encoded data (the Graph API's
expected format). If it succeeds, immediately deletes the test post to keep the Page clean.
"""
import os
import json
import requests

PAGE_TOKEN = os.environ["FB_PAGE_TOKEN"]
PAGE_ID = os.environ["FB_PAGE_ID"]
GRAPH_VERSION = "v20.0"

result = {}

# Test the /photos endpoint specifically, since that's the branch actually failing in prod
post_resp = requests.post(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{PAGE_ID}/photos",
    data={
        "url": "https://cdn.sanity.io/images/vbnsqnkg/production/e8730ce9ccc0f86511960c4770aa06c3ec5ab3de-1920x1080.jpg",
        "caption": "BREAKING: The DOJ just let its stay expire on Silencer Shop's federal injunction—suppressors are NOW legal to transfer without Form 4, NFA registration, or the $200 tax stamp. \U0001F6A8 This is the first time in 90 years that suppressors have been available outside the NFA framework. The ruling stems from a successful constitutional challenge to the 1934 law. If you've been waiting to add a can to your setup, the legal landscape just changed. Will you take advantage of this? \U0001F52B\n\nFull article: https://downrangeco.com/news/doj-lets-the-stay-expire-silencer-shop-s-nfa-injunction-takes-effect-b63384\n#2A #GunRights #SecondAmendment #ConstitutionalCarry [TEST - will be deleted]",
        "access_token": PAGE_TOKEN,
    },
).json()
result["post_response"] = post_resp

if post_resp.get("id"):
    post_id = post_resp["id"]
    result["success"] = True
    result["post_id"] = post_id
    # Clean up immediately
    del_resp = requests.delete(
        f"https://graph.facebook.com/{GRAPH_VERSION}/{post_id}",
        params={"access_token": PAGE_TOKEN},
    ).json()
    result["delete_response"] = del_resp
else:
    result["success"] = False

print(json.dumps(result, indent=2))
