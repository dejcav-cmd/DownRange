#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, time

TOKEN   = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def sanity_query(q):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ALL Indian, Philippine, and other non-US sources
BLOCKED_DOMAINS = [
    # India — comprehensive
    "devdiscourse.com","thehindu.com","hindustantimes.com","timesofindia.com",
    "ndtv.com","indianexpress.com","livemint.com","deccanherald.com",
    "tribuneindia.com","firstpost.com","newindianexpress.com","dnaindia.com",
    "zeenews.india.com","indiatoday.in","news18.com","scroll.in","thewire.in",
    "business-standard.com","financialexpress.com","asianage.com",
    "thestatesman.com","telegraphindia.com","moneycontrol.com",
    "mid-day.com","freepressjournal.in","livehindustan.com",
    "jagran.com","bhaskar.com","patrika.com",
    # Philippines
    "sunstar.com.ph","inquirer.net","philstar.com","rappler.com",
    "mb.com.ph","gmanetwork.com","cnn.ph","pna.gov.ph","abs-cbn.com",
    "manilatimes.net","businessmirror.com.ph","philnews.ph",
    # Pakistan / Bangladesh / Sri Lanka
    "dawn.com","thenews.com.pk","geo.tv","thedailystar.net",
    "dailymirror.lk","dailynews.lk",
    # UK tabloids / non-2A sites
    "mirror.co.uk","thesun.co.uk","dailymail.co.uk","express.co.uk",
    "freerepublic.com",
    # AU/NZ
    "canberratimes.com.au","theage.com.au","heraldsun.com.au","couriermail.com.au",
    "thewest.com.au","ntnews.com.au","themercury.com.au",
    # Bogus/non-firearms sources
    "fontsinuse.com","fonts.com","myfonts.com",
    # Other Asian / intl
    "channelnewsasia.com","straitstimes.com","scmp.com","aljazeera.com",
]

# Title/content keywords that signal non-US articles
BLOCKED_KEYWORDS = [
    # India cities/states/terms
    "thane","navi mumbai","mumbai","delhi","bengaluru","chennai","kolkata",
    "hyderabad","pune","ahmedabad","lucknow","jaipur","surat","kanpur",
    "nagpur","indore","bhopal","visakhapatnam","patna","vadodara",
    "karnataka","belagavi","maharashtra","uttar pradesh","bihar",
    "rajasthan","odisha","assam","punjab police","haryana police",
    "indian police","india police","country-made guns","country made guns",
    "desi katta","mephedrone","mdma india","npa india",
    # Philippines
    "shabu","pnp","pro-7","pro 7","cebu","davao","manila",
    "philippine national police","mindanao","quezon city",
    "makati","pasay","caloocan","philipp","pdea","nbi philippines",
    # Bogus AI placeholder articles
    "no firearms content available","no content available","placeholder",
    # Pakistan / Bangladesh
    "pakistan","bangladesh","afghanistan","karachi","lahore","islamabad",
    "peshawar","quetta","dhaka","chittagong",
]

STOCK_DOMAINS = [
    "pixabay.com","cdn.pixabay.com",
    "images.pexels.com","pexels.com",
    "images.unsplash.com","unsplash.com",
    "lorempixel.com","picsum.photos","dummyimage.com",
    "placeholder.com","via.placeholder.com","placehold.co","fakeimg.pl",
]

def is_stock(url):
    if not url: return False
    try:
        from urllib.parse import urlparse
        h = urlparse(url).hostname or ""
        h = h.replace("www.", "")
        return any(h == d or h.endswith("." + d) for d in STOCK_DOMAINS)
    except:
        return False

def pick_photo(title, category=""):
    t = (title + " " + category).lower()
    if any(k in t for k in ["law","atf","bill","court","constitution","legal","2a","amendment","ban","rule","scotus","bruen"]): return "/img/photos/law.jpg"
    if any(k in t for k in ["pistol","handgun","glock","sig","beretta","colt","revolver","1911","carry","edc"]): return "/img/photos/pistol.jpg"
    if any(k in t for k in ["rifle","ar-15","ar 15","m4","carbine","ak","sbr"]): return "/img/photos/rifle.jpg"
    if any(k in t for k in ["shotgun","mossberg","gauge","pump"]): return "/img/photos/shotgun.jpg"
    if any(k in t for k in ["suppressor","silencer","nfa"]): return "/img/photos/suppressor.jpg"
    if any(k in t for k in ["ammo","ammunition","cartridge","bullet"]): return "/img/photos/ammo.jpg"
    if any(k in t for k in ["hunt","deer","elk","game"]): return "/img/photos/hunting.jpg"
    if any(k in t for k in ["competi","uspsa","idpa"]): return "/img/photos/competition.jpg"
    if any(k in t for k in ["train","range","practice"]): return "/img/photos/training.jpg"
    if any(k in t for k in ["gear","holster","optic","scope"]): return "/img/photos/gear.jpg"
    if any(k in t for k in ["home defense","self defense","self-defense"]): return "/img/photos/homedefense.jpg"
    if any(k in t for k in ["military","army","marine","soldier"]): return "/img/photos/military.jpg"
    return "/img/photos/news.jpg"

print("Fetching articles...")
# Scan last 1000 to catch everything
articles = sanity_query('*[_type == "newsArticle"] | order(publishedAt desc) [0...1000] { _id, title, imageUrl, "sourceUrl": externalUrl, source }')
print(f"Got {len(articles)} articles to scan")

to_delete = []
to_fix    = []

for a in articles:
    url   = (a.get("sourceUrl") or "").lower()
    title = (a.get("title")     or "").lower()
    src   = (a.get("source")    or "").lower()

    domain_blocked  = any(d in url for d in BLOCKED_DOMAINS)
    keyword_blocked = any(k in title for k in BLOCKED_KEYWORDS)
    # Also catch by source name field
    source_blocked  = any(d.split(".")[0] in src for d in BLOCKED_DOMAINS)
    # Also block by explicit source name
    BAD_SOURCE_NAMES = ["canberra times","fontsinuse","fonts in use",
                        "the mirror","daily mail","the sun","freerepublic"]
    source_name_blocked = any(b in src for b in BAD_SOURCE_NAMES)

    if domain_blocked or keyword_blocked or source_blocked or source_name_blocked:
        to_delete.append(a["_id"])
        print(f"  DELETE [{('domain' if domain_blocked else 'keyword' if keyword_blocked else 'source')}]: {a.get('title','')[:70]}")
    elif is_stock(a.get("imageUrl")):
        to_fix.append({"id": a["_id"], "title": a.get("title","")})
        print(f"  FIX IMG: {a.get('title','')[:60]}")

print(f"\nTo delete: {len(to_delete)} | To fix images: {len(to_fix)}")

deleted = 0
for i in range(0, len(to_delete), 50):
    batch     = to_delete[i:i+50]
    mutations = [{"delete": {"id": _id}} for _id in batch]
    sanity_mutate(mutations)
    deleted  += len(batch)
    print(f"Deleted {deleted} so far...")
    time.sleep(0.3)

fixed = 0
fix_mutations = [{"patch": {"id": a["id"], "set": {"imageUrl": pick_photo(a["title"])}}} for a in to_fix]
for i in range(0, len(fix_mutations), 50):
    sanity_mutate(fix_mutations[i:i+50])
    fixed += min(50, len(fix_mutations) - i)
    time.sleep(0.3)

print(f"\nDONE: deleted={deleted}, images_fixed={fixed}")
