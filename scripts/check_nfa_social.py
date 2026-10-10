import os, json, urllib.request, urllib.parse
T=os.environ["SANITY_API_TOKEN"]
def q(query):
    u="https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query="+urllib.parse.quote(query)
    r=urllib.request.Request(u,headers={"Authorization":"Bearer "+T})
    return json.load(urllib.request.urlopen(r,timeout=30)).get("result")
out={}
out["article"]=q('*[_id=="blog-nfa-transfer-guidance-2026"][0]{socialScheduleAt,socialScheduleDone,socialScheduleStartedAt,socialSchedulePlatforms}')
out["posts"]=q('*[_type=="socialPost" && articleSlug=="nfa-transfer-guidance-suppressors-sbrs-2026"]|order(_createdAt desc){platform,status,postUrl,postedAt,error,hasImage}')
out["cron"]=q('*[_type=="cronRun" && jobId=="social-scheduled"]|order(_createdAt desc)[0..2]')
out["recent"]=q('*[_type=="socialPost"]|order(_createdAt desc)[0..5]{platform,status,articleSlug,postedAt,error}')
json.dump(out,open("nfa_social_check.json","w"),indent=2)
