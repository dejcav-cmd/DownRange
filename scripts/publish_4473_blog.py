#!/usr/bin/env python3
"""Publishes the '4473-only vs Form 4' blog post (original analysis; Capitol Armory credited as source)."""
import os, re, sys, json, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import publish_nfa_blog as B

RESULT_FILE = "blog_4473_result.json"
BLOG_ID = "blog-4473-vs-form-4-suppressors-2026"
SLUG = "4473-only-vs-form-4-suppressors-after-nfa-change"
CAP_URL = "https://www.capitolarmory.com/4473-only-vs-form-4-risks"

SEARCHES = ["suppressor", "suppressed rifle", "silencer firearm", "suppressed weapon soldier", "rifle suppressor range"]

BODY = """
<h2>The Tax Is Gone. The Registry Question Isn't.</h2>
<p>ATF's October 9 announcement changed what suppressor buyers are allowed to do. For the first time, a buyer in many states can walk out with a suppressor on a regular Form 4473 and a background check, with no approved NFA Form 4 and no registration. That is a real shift, and it raises a practical question: should you take that route, or still file a Form 4?</p>
<p>Capitol Armory, a Texas suppressor and NFA retailer, published a detailed page arguing that most buyers are better off with a Form 4. I read it alongside ATF's own guidance. Below is my summary of the retailer's points, where they are backed by ATF's FAQ, and where they are the seller's opinion.</p>
{IMG_ONE}
<h2>First, What Each Route Means</h2>
<ul>
<li><strong>Form 4473 only:</strong> a standard dealer sale with the usual background check. The suppressor is not registered in the National Firearms Registration and Transfer Record. It works only in states whose laws allow it.</li>
<li><strong>Form 4:</strong> the traditional route. The transfer is approved by ATF, the item is registered to you or your trust, and you hold the approved form as proof.</li>
</ul>
<p>The federal tax on suppressors is now $0, so cost is no longer the difference. The difference is legal status and how well it holds up if the rules shift.</p>
<h2>The Core Risk: It Rests on Enforcement Discretion</h2>
<p>This is the point everything else hangs on. ATF says it is exercising enforcement discretion, backed by a court injunction that protects only the plaintiffs in that case. The statute itself still treats unregistered NFA items as contraband. Capitol Armory points out that if policy reverses, because Congress adds a new tax, a court rules differently or the Justice Department withdraws its guidance, an unregistered suppressor could suddenly be a felony problem, and federal law generally does not allow registering one after the fact. Any amnesty would be the Attorney General's choice. I covered the original ATF announcement <a href="/blog/nfa-transfer-guidance-suppressors-sbrs-2026">in an earlier DownRange article</a>.</p>
<h2>Where the 4473 Route Gets Complicated</h2>
<p>According to the retailer, these are the situations where a Form 4 holds up better:</p>
<ul>
<li><strong>Sharing.</strong> Under the NFA a loan can count as a transfer. Letting a friend or family member use your suppressor is simple with a Form 4 and a trust. Under a 4473 purchase it could become a problem if enforcement returns.</li>
<li><strong>Travel.</strong> ATF says it is not currently enforcing the interstate transport rule for unregistered items. If that changes, crossing state lines with one could become a federal issue, and every state has its own law on top.</li>
<li><strong>Your state's law.</strong> Many states tie legal suppressor ownership to NFA compliance. The retailer cites Ohio as an example, where possessing an unregistered suppressor is a felony under state law. In those states a 4473-only purchase is not an option at all. Check your state before anything else.</li>
<li><strong>Inheritance.</strong> A trust can pass a registered suppressor to heirs. The retailer says an unregistered one has no clear path and could be treated as contraband in an estate.</li>
<li><strong>Repairs and warranty.</strong> ATF's guidance on shipping for repair is an enforcement policy, not a statute. The retailer says at least one manufacturer will not warranty 4473 suppressors, and that others may change their position. Ask the manufacturer before you buy.</li>
<li><strong>Resale.</strong> Selling is easier today, but the next owner inherits the same risk and some dealers may refuse a trade-in.</li>
<li><strong>Proof of ownership.</strong> A Form 4 is paperwork you can point to. A 4473 purchase relies on current ATF policy.</li>
</ul>
<h2>Speed Is Less of a Gap Than You Would Think</h2>
<p>The main appeal of a 4473 purchase is speed. The retailer argues the gap is small. It cites ATF average processing in August of about 6 days for individual eForm 4s and about 20 days for trusts, and says some trust approvals come through in a day when the background check is an immediate proceed. Same-day pickup also depends on the dealer having it in stock and your background check clearing, and some states add waiting periods. Treat those processing figures as the retailer's numbers and check ATF's current times yourself.</p>
{IMG_TWO}
<h2>A Fair Caution About the Source</h2>
<p>Capitol Armory sells both kinds of suppressors and says it recommends the Form 4. That is a commercial interest, so weigh its advice accordingly. Its points about the registry being confidential tax-return information, and about approval times, are the seller's claims and I have not verified them independently. Where the page quotes ATF's FAQ, you can read ATF's own wording on the <a href="https://www.atf.gov/firearms/update-to-nfa-transfer-guidance" target="_blank" rel="noopener">Update to NFA Transfer Guidance page</a>.</p>
<p>There is also a reasonable counter-view. Some gun owners would rather not be on a federal registry at all, and the 4473 route is the first time in 90 years that option has existed. That is a legitimate position. The trade-off is the legal risk described above, and you should talk it through with a firearms attorney in your state.</p>
<h2>How I Would Decide</h2>
<p>Use this as a quick filter, not legal advice:</p>
<ul>
<li>Does your state require NFA registration for legal possession? Then you need a Form 4.</li>
<li>Will anyone else use it, might it leave your state, or might you sell it or leave it to family? A Form 4 with a trust is the safer path.</li>
<li>Is the answer no to all of those, and your state allows it? A 4473 purchase can make sense, as long as you accept that the policy could be reversed.</li>
</ul>
<p><strong>DownRange Bottom Line:</strong> The new option is real, but it depends on a policy that can be withdrawn. Before you choose, check your state law, ask the manufacturer about warranty, and decide how much legal uncertainty you are willing to hold. If you are unsure, a Form 4 is the more conservative choice.</p>
<p>Source: <a href="https://www.capitolarmory.com/4473-only-vs-form-4-risks" target="_blank" rel="noopener">Capitol Armory, &ldquo;4473 Suppressor vs. Form 4&rdquo;</a>, with ATF's <a href="https://www.atf.gov/firearms/update-to-nfa-transfer-guidance" target="_blank" rel="noopener">Update to NFA Transfer Guidance FAQ</a>. Summarized and analyzed in my own words; the retailer's page is undated and reflects policy as of October 2026.</p>
{HERO_CREDIT}
<p style="margin-top:2rem;border-top:1px solid var(--border);padding-top:1rem;"><em>&mdash; DJ Cavalcanti</em><br/><strong>DJ Cavalcanti, DownRange Founder</strong></p>
""".strip()


def main():
    result = {"ok": False, "steps": []}
    def finish():
        json.dump(result, open(RESULT_FILE, "w"), indent=2); print(json.dumps(result, indent=2)[:3000])
    if not B.TOKEN:
        result["error"] = "no token"; return finish()
    used = set(B.sanity_query('*[_type=="blogPost" && defined(imageUrl) && _id != "%s"].imageUrl' % BLOG_ID) or [])
    cands = B.commons_candidates(SEARCHES)
    cands.sort(key=lambda c: (not re.search(r"suppress|silenc", c["title"] + c.get("desc", ""), re.I), not c["landscape"]))
    result["candidates"] = [c["title"] for c in cands[:12]]
    got = []
    for c in cands:
        if len(got) >= 3: break
        try:
            up = B.upload(c, f"4473-form4-{len(got)+1}.jpg")
        except Exception as e:
            result["steps"].append({"skip": c["title"], "why": str(e)}); continue
        if up["cdn_url"] in used: continue
        used.add(up["cdn_url"]); up.update(c); got.append(up)
        result["steps"].append({"uploaded": c["title"], "license": c["license"], "cdn": up["cdn_url"]})
    if not got:
        result["error"] = "no images"; return finish()
    hero = got[0]
    body = BODY.replace("{IMG_ONE}", B.fig(got[1], "Suppressed rifle photo") if len(got) > 1 else "")
    body = body.replace("{IMG_TWO}", B.fig(got[2], "Suppressor photo") if len(got) > 2 else "")
    hc = (f'<p style="font-size:12px;color:var(--text-dim);">Header photo: {hero["credit"]} via '
          f'<a href="{hero["page"]}" target="_blank" rel="noopener">Wikimedia Commons</a> ({hero["license"]})</p>')
    body = body.replace("{HERO_CREDIT}", hc)
    words = len(B.strip_html(body).split())
    existing = B.sanity_query('*[_id=="%s"][0]{publishedAt}' % BLOG_ID) or {}
    now_iso = existing.get("publishedAt") or datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    doc = {
        "_id": BLOG_ID, "_type": "blogPost",
        "title": "4473-Only vs. Form 4: Which Suppressor Purchase Holds Up After the NFA Change?",
        "slug": {"_type": "slug", "current": SLUG},
        "author": "DJ Cavalcanti", "authorRole": "Founder, DownRange", "category": "LAW",
        "excerpt": ("ATF's new policy lets some buyers pick up a suppressor with just a Form 4473. A suppressor retailer argues "
                    "the Form 4 is still the safer buy. Here is how the two routes compare, and who has a stake in the answer."),
        "body": body, "imageUrl": hero["cdn_url"],
        "readTime": max(1, -(-words // 200)),
        "status": "published", "published": True, "featured": False,
        "publishedAt": now_iso,
        "tags": ["Suppressors", "NFA", "Form 4", "Form 4473", "ATF"],
        "editorLocked": True, "qualityReviewed": True,
        # 7:00 AM PDT Oct 13, 2026 = 14:00 UTC
        "socialScheduleAt": "2026-10-13T14:00:00Z",
        "socialSchedulePlatforms": ["facebook", "instagram", "twitter", "threads", "bluesky", "reddit"],
        "socialScheduleDone": False,
    }
    result["steps"].append({"mutate": B.post_json(B.MUTATE_URL, {"mutations": [{"createOrReplace": doc}]})})
    result["verify"] = B.sanity_query('*[_id=="%s"][0]{_id,title,"slug":slug.current,status,imageUrl,readTime,socialScheduleAt}' % BLOG_ID)
    result["ok"] = bool(result["verify"])
    result["blog_url"] = f"https://www.downrangeco.com/blog/{SLUG}"
    finish()

if __name__ == "__main__":
    try: main()
    except Exception as e:
        json.dump({"ok": False, "error": repr(e)}, open(RESULT_FILE, "w")); print("FATAL", repr(e))
