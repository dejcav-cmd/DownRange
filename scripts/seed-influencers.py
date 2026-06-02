#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64, hashlib, time

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
GH_PAT       = os.environ.get("GH_PAT","")
PROJECT      = "vbnsqnkg"
BASE         = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
S_HDRS       = {"Authorization": "Bearer " + SANITY_TOKEN, "Content-Type": "application/json"}
GH_HDRS      = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
                "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=S_HDRS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def uid(name):
    return "influencer-" + hashlib.md5(name.encode()).hexdigest()[:14]

# 30 researched sub-150K firearms/2A YouTubers
INFLUENCERS = [
  {
    "channelName": "Kentucky Tactical",
    "hostName":    "Matt Harrod",
    "youtubeUrl":  "https://www.youtube.com/@kentucky.tactical/",
    "subscribers": 29000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","suppressors-NFA","AR-15","ammo-testing","gear-accessories"],
    "bio":         "Gun reviews, suppressor testing, AR-15 builds, ammo comparisons, EDC gear. Sponsors: Brownells, OpticsPlanet, Burn Proof Gear.",
    "whyGoodFit":  "Suppressor and AR focus aligns with DownRange's tactical coverage. Micro tier = high engagement, accessible deal.",
    "source":      "feedspot",
    "instagram":   "",
    "twitter":     "",
  },
  {
    "channelName": "9-Hole Reviews",
    "hostName":    "Henry Chan & Josh Mazzola",
    "youtubeUrl":  "https://www.youtube.com/c/9HoleReviews",
    "subscribers": 95000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","competition-USPSA-IDPA","training-tactics"],
    "bio":         "Practical handgun shooting reviews, specifically through USPSA competitive context. Red dot pistols, CCW, competition.",
    "whyGoodFit":  "Highly respected analytical reviews. Competition audience overlaps with serious DownRange readers.",
    "source":      "feedspot",
  },
  {
    "channelName": "Louisiana Firearms",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/LouisianaFirearms",
    "subscribers": 45000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","pistols","shotguns","home-defense","budget-guns"],
    "bio":         "Gun reviews and firearms content from Louisiana. Focus on practical home defense and budget-friendly options.",
    "whyGoodFit":  "Southern audience, practical 2A focus, underserved market for DownRange partnerships.",
    "source":      "feedspot",
  },
  {
    "channelName": "God Family and Guns",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/channel/UCxFgFKxa3SD1WIZWmBRGEhg",
    "subscribers": 38000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","home-defense","CCW-EDC","2A-advocacy"],
    "bio":         "Faith-based 2A content — guns, ammo, personal protection tactics, biblical and spiritual content alongside firearms.",
    "whyGoodFit":  "Faith + firearms audience is a passionate, loyal community underserved by major outlets.",
    "source":      "feedspot",
  },
  {
    "channelName": "CRS Firearms",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/CRSFirearms",
    "subscribers": 52000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","revolvers","CCW-EDC"],
    "bio":         "Firearms reviews with a focus on practical defensive pistols and revolvers.",
    "whyGoodFit":  "Defensive carry focus directly overlaps DownRange's CCW coverage.",
    "source":      "feedspot",
  },
  {
    "channelName": "GBGuns",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/channel/UC2VOURrALs1CwVmbGlXJOPQ",
    "subscribers": 41000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","training-tactics","pistols"],
    "bio":         "No BS reviews from two well-trained and experienced shooters. Combined military and law enforcement background.",
    "whyGoodFit":  "Credible law enforcement background, no fluff content style matches DownRange's tone.",
    "source":      "feedspot",
  },
  {
    "channelName": "Tactical Hyve",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/TacticalHyve",
    "subscribers": 78000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","gear-accessories","CCW-EDC","training-tactics"],
    "bio":         "Tactical firearms, accessories and gear reviews. Pistol modification and carry-focused content.",
    "whyGoodFit":  "Mid-tier with strong CCW/EDC audience — prime DownRange demographic.",
    "source":      "feedspot",
  },
  {
    "channelName": "Ghost Firearms Training",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GhostFirearmsTrainingLLC",
    "subscribers": 29000,
    "tier":        "micro (10K–50K)",
    "focus":       ["training-tactics","home-defense","CCW-EDC","pistols"],
    "bio":         "Firearms training LLC. Instruction-focused content for defensive shooting and home protection.",
    "whyGoodFit":  "Training content creator, strong 2A advocacy angle, small enough to be receptive to partnerships.",
    "source":      "feedspot",
  },
  {
    "channelName": "DEUCE AND GUNS",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/DEUCEandGUNS",
    "subscribers": 18000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","AR-15","pistols","2A-advocacy"],
    "bio":         "Pro-2A firearms content with gun reviews and Second Amendment advocacy.",
    "whyGoodFit":  "Vocal 2A advocate. Nano/micro tier = very open to media collaborations.",
    "source":      "feedspot",
  },
  {
    "channelName": "Guns of the West",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GunsoftheWest",
    "subscribers": 33000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","historical-firearms","revolvers","long-range"],
    "bio":         "Western US firearms culture, historical gun coverage and modern reviews with a frontier perspective.",
    "whyGoodFit":  "Regional Western audience, unique historical angle that differentiates from mainstream guntubers.",
    "source":      "feedspot",
  },
  {
    "channelName": "Exile Armory",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/ExileArmoryLLC",
    "subscribers": 21000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","AR-15","pistols","gear-accessories"],
    "bio":         "Firearms dealer and content creator. Gun reviews, builds, and dealer perspective on the industry.",
    "whyGoodFit":  "FFL dealer with channel = industry access + audience trust. Potential for press kit and new release coverage.",
    "source":      "feedspot",
  },
  {
    "channelName": "Precision Rifle Network",
    "hostName":    "Joel Wise",
    "email":       "joel@precisionriflenetwork.com",
    "youtubeUrl":  "https://www.youtube.com/c/PrecisionRifleNetwork",
    "subscribers": 44000,
    "tier":        "micro (10K–50K)",
    "focus":       ["long-range","gun-reviews","competition-USPSA-IDPA","ammo-testing"],
    "bio":         "Precision rifle long range shooting. For competitors, hunters and operators. News, reviews, competition coverage.",
    "whyGoodFit":  "Precision/long-range niche is underserved in DownRange's coverage. Email is public.",
    "source":      "feedspot",
  },
  {
    "channelName": "GFG Weapons",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GFGWeapons",
    "subscribers": 27000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","pistols","AR-15","gear-accessories"],
    "bio":         "Firearms and weapons reviews with a focus on practical shooting applications.",
    "whyGoodFit":  "Small enough channel to be receptive, consistent reviewer with a growing audience.",
    "source":      "feedspot",
  },
  {
    "channelName": "GunBlue490",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/user/GunBlue490",
    "subscribers": 62000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","historical-firearms","pistols","revolvers"],
    "bio":         "No-BS old-school firearms reviews. Highly respected by gun community for unbiased, expert analysis without sponsorship bias.",
    "whyGoodFit":  "High credibility, no current sponsors = potentially open to first serious press relationship.",
    "source":      "feedspot",
  },
  {
    "channelName": "Mark Novak",
    "hostName":    "Mark Novak",
    "youtubeUrl":  "https://www.youtube.com/c/MarkNovak",
    "subscribers": 88000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","historical-firearms","training-tactics","pistols"],
    "bio":         "Gunsmith and firearms instructor. Deep technical reviews, gunsmithing content, and real-world shooting instruction.",
    "whyGoodFit":  "Professional gunsmith background gives technical authority. Audience is serious, knowledgeable gun owners.",
    "source":      "feedspot",
  },
  {
    "channelName": "Ozzie Reviews",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/OzzieReviews",
    "subscribers": 36000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","pistols","shotguns","ammo-testing","budget-guns"],
    "bio":         "Practical firearms reviews with an emphasis on value and real-world usability for everyday shooters.",
    "whyGoodFit":  "Budget gun focus reaches first-time buyers and value-conscious shooters — growing DownRange demographic.",
    "source":      "feedspot",
  },
  {
    "channelName": "Firearms Unknown",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/@firearmsunknown",
    "subscribers": 48000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","pistols","CCW-EDC","2A-advocacy"],
    "bio":         "Real information for civilian gun owners. Focused on practical self-defense and concealed carry.",
    "whyGoodFit":  "Civilian CCW focus, non-influencer credibility. Practical content matches DownRange voice.",
    "source":      "google",
  },
  {
    "channelName": "Milspec Mojo",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/MilspecMojo",
    "subscribers": 72000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","AR-15","training-tactics","budget-guns"],
    "bio":         "High-speed shooting with milspec parts. Shows viewers that mil-spec builds shoot as well as high-end custom guns.",
    "whyGoodFit":  "Budget-honest approach resonates with working-class gun owners. Growing fast, accessible to mid-tier deals.",
    "source":      "google",
  },
  {
    "channelName": "The Yankee Marshal",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/@TheYankeeMarshal",
    "subscribers": 145000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","CCW-EDC","2A-advocacy","pistols","revolvers"],
    "bio":         "Opinionated, honest firearms reviews and 2A commentary from a Northeast perspective. Known for taking controversial stances.",
    "whyGoodFit":  "Just under 150K — perfect outreach window. 2A advocacy content strongly overlaps DownRange mission.",
    "source":      "google",
  },
  {
    "channelName": "Four Guys Guns",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/@FourGuysGuns",
    "subscribers": 57000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","AR-15","gear-accessories","ammo-testing"],
    "bio":         "Four regular guys reviewing firearms and gear. Group dynamic makes reviews approachable for new shooters.",
    "whyGoodFit":  "Relatable format appeals to new gun owners — DownRange's fastest-growing reader segment.",
    "source":      "google",
  },
  {
    "channelName": "Geauga Firearms Academy",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GeaugaFirearmsAcademy",
    "subscribers": 31000,
    "tier":        "micro (10K–50K)",
    "focus":       ["training-tactics","CCW-EDC","home-defense","beginners"],
    "bio":         "Firearms training academy channel. Focus on safe handling, self-defense training, and CCW preparation.",
    "whyGoodFit":  "Training focus = serious audience investing in their skills. High purchase intent for DownRange's affiliate potential.",
    "source":      "feedspot",
  },
  {
    "channelName": "Administrative Results",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/@AdministrativeResults",
    "subscribers": 130000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","AR-15","pistols","training-tactics","military-veteran"],
    "bio":         "Veteran-run channel covering tactical firearms, AR-15 builds, and practical shooting skills with military perspective.",
    "whyGoodFit":  "Veteran credibility + nearly 150K subs = strong but still accessible partnership target.",
    "source":      "google",
  },
  {
    "channelName": "MadMan Review",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/MadManReview",
    "subscribers": 66000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","revolvers","budget-guns","ammo-testing"],
    "bio":         "High-energy gun reviews covering a wide range of firearms from budget to premium. Entertaining delivery with solid information.",
    "whyGoodFit":  "Entertainment value + solid reviews = broad appeal. Growing channel open to press relationships.",
    "source":      "feedspot",
  },
  {
    "channelName": "Gun For Hire Range",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GunForHireRange",
    "subscribers": 43000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","training-tactics","CCW-EDC","beginners","law-enforcement"],
    "bio":         "NJ-based shooting range and firearms training channel. Strong focus on beginners and first-time gun owners in a hostile regulatory environment.",
    "whyGoodFit":  "2A in a restrictive state is a powerful story. Their audience follows 2A legal news closely — direct DownRange audience.",
    "source":      "feedspot",
  },
  {
    "channelName": "Esai Givens",
    "hostName":    "Esai Givens",
    "youtubeUrl":  "https://www.youtube.com/c/EsaiGivens",
    "subscribers": 48000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","2A-advocacy","minority-2A","CCW-EDC","pistols"],
    "bio":         "First generation American, firearms content creator focused on bringing diverse voices into the 2A community.",
    "whyGoodFit":  "Minority 2A voice — authentically grows the coalition. Highly engaged community. DownRange values diversity in the 2A space.",
    "source":      "feedspot",
  },
  {
    "channelName": "Guns Blazing Ranch",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/GunsBlazing",
    "subscribers": 55000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","hunting","long-range","shotguns","revolvers"],
    "bio":         "Ranch-based firearms content covering hunting, long range shooting, and traditional American gun culture.",
    "whyGoodFit":  "Hunting and outdoor audience is a pillar DownRange is growing. Strong rural readership overlap.",
    "source":      "feedspot",
  },
  {
    "channelName": "D'Boss Firearms",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/DBossFirearms",
    "subscribers": 27000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","pistols","AK-platform","2A-advocacy","minority-2A"],
    "bio":         "Firearms reviews and 2A advocacy. Diverse voice in the gun community covering pistols and AK platforms.",
    "whyGoodFit":  "AK platform + minority 2A = underserved content pillars. Partnership would be mutually beneficial and novel.",
    "source":      "feedspot",
  },
  {
    "channelName": "Schrödinger's Gun",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/SchrodingersGun",
    "subscribers": 39000,
    "tier":        "micro (10K–50K)",
    "focus":       ["gun-reviews","2A-law","2A-advocacy","CCW-EDC","pistols"],
    "bio":         "Analytical 2A content with legal and philosophical angles alongside practical gun reviews.",
    "whyGoodFit":  "Legal/advocacy angle matches DownRange's 2A law coverage. Cerebral audience that reads deeply.",
    "source":      "feedspot",
  },
  {
    "channelName": "Arm & Gun",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/ArmAndGun",
    "subscribers": 85000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","pistols","AR-15","gear-accessories","2A-advocacy"],
    "bio":         "Comprehensive firearms and gear reviews. Wide coverage of handguns, rifles, and tactical accessories.",
    "whyGoodFit":  "Broad coverage aligns with DownRange's all-in scope. Mid tier = genuine partnership budget accessibility.",
    "source":      "feedspot",
  },
  {
    "channelName": "Firepower United",
    "hostName":    "Unknown",
    "youtubeUrl":  "https://www.youtube.com/c/FirepowerUnited",
    "subscribers": 62000,
    "tier":        "mid (50K–150K)",
    "focus":       ["gun-reviews","2A-advocacy","AR-15","pistols","gear-accessories"],
    "bio":         "United community of firearm enthusiasts. Strong 2A advocacy mixed with practical gun content.",
    "whyGoodFit":  "2A community-builder tone matches DownRange mission. Good fit for press kit and intel-sharing partnership.",
    "source":      "feedspot",
  },
]

mutations = []
for inf in INFLUENCERS:
    _id = uid(inf["channelName"])
    subs = inf.get("subscribers", 0)
    doc = {
        "_id":           _id,
        "_type":         "youtubeInfluencer",
        "channelName":   inf["channelName"],
        "hostName":      inf.get("hostName",""),
        "email":         inf.get("email",""),
        "youtubeUrl":    inf.get("youtubeUrl",""),
        "subscribers":   subs,
        "tier":          inf.get("tier","micro (10K–50K)"),
        "focus":         inf.get("focus",[]),
        "bio":           inf.get("bio",""),
        "whyGoodFit":    inf.get("whyGoodFit",""),
        "instagram":     inf.get("instagram",""),
        "twitter":       inf.get("twitter",""),
        "outreachStatus":"identified",
        "active":        True,
        "verified":      bool(inf.get("email","")),
        "source":        inf.get("source","feedspot"),
        "addedAt":       "2026-06-01T00:00:00.000Z",
    }
    mutations.append({"createOrReplace": doc})

print("Seeding " + str(len(mutations)) + " influencers...")
for i in range(0, len(mutations), 10):
    result = mutate(mutations[i:i+10])
    print("  Batch " + str(i//10+1) + " done")
    time.sleep(0.3)

print("DONE: " + str(len(mutations)) + " influencers seeded")

output = "Seeded " + str(len(mutations)) + " YouTube influencers"

req = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())["object"]["sha"]
try:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode(), headers=GH_HDRS, method="POST"), timeout=10)
except:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH"), timeout=10)
file_sha = None
try:
    req3 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(req3) as r: file_sha = json.loads(r.read())["sha"]
except: pass
payload = {"message":"chore: influencer seed result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
