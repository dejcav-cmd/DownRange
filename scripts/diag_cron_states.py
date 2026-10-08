import os, json, requests, datetime as dt
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()
U="https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
def q(query):
    r=requests.get(U,params={"query":query},headers={"Authorization":f"Bearer {TOKEN}"}); return r.json().get("result")
print("== cronRun latest per job")
runs=q('*[_type=="cronRun"]|order(_createdAt desc)[0...3000]{jobId,job,status,ms,error,_createdAt,startedAt,finishedAt}')
print("sample keys:", list(runs[0].keys()) if runs else None)
by={}
for r in runs:
    k=r.get("jobId") or r.get("job"); by.setdefault(k,[]).append(r)
now=dt.datetime.now(dt.timezone.utc)
for k,v in sorted(by.items(), key=lambda x:str(x[0])):
    last=v[0]; t=dt.datetime.fromisoformat(last["_createdAt"].replace("Z","+00:00"))
    fails=sum(1 for x in v[:10] if x.get("status")!="success")
    print(f"{str(k):34} last={round((now-t).total_seconds()/3600,1):7}h ago status={last.get('status')} fails_in_last10={fails} err={(last.get('error') or '')[:90]}")
print("== stateProfile docs")
sp=q('*[_type=="stateProfile"]{abbr,_updatedAt,"keys":array::compact(string::split(coalesce(string(reciprocityStates),""),","))[0...0],"nrecip":count(reciprocityStates),lastVerified,ccwLastUpdated}|order(abbr asc)')
print("count",len(sp or []))
for x in sp or []: print(x)
print("== sample full WA doc")
print(json.dumps(q('*[_type=="stateProfile"&&abbr=="WA"][0]'),indent=1)[:2500])
