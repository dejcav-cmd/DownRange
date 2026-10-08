import os, json, requests
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()
U="https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
def q(query):
    return requests.get(U,params={"query":query},headers={"Authorization":f"Bearer {TOKEN}"}).json().get("result")
for j in ["blog-twitter-promo","blog-writer","quality-rewrite","site_health","market-brief","prn_releases","sitemap-health","nra-law-sync","blog"]:
    rs=q('*[_type=="cronRun"&&(jobId=="%s"||job=="%s")&&status!="success"]|order(_createdAt desc)[0...2]{_createdAt,status,error,details}'%(j,j))
    print("=====",j)
    for r in rs or []: print(json.dumps(r)[:1500])
