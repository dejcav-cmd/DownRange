import os, json, urllib.request
T=os.environ["SANITY_API_TOKEN"]
body={"mutations":[{"patch":{"id":"blog-nfa-transfer-guidance-2026","set":{"socialSchedulePlatforms":["instagram"],"socialScheduleDone":False}}}]}
r=urllib.request.Request("https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production",data=json.dumps(body).encode(),method="POST",headers={"Authorization":"Bearer "+T,"Content-Type":"application/json"})
print(urllib.request.urlopen(r,timeout=30).read().decode())
