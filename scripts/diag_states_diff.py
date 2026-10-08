import os, json, requests
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()
U="https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
r=requests.get(U,params={"query":'*[_type=="stateProfile"]|order(abbr asc){abbr,rating,constitutionalCarry,redFlagLaw,magLimit,awbStatus,waitPeriod,suppressors,openCarry,bgcPrivate,ccwPermit,lastUpdated,_updatedAt,"rc":length(richContent),"keys":*[_id==^._id][0]}'},headers={"Authorization":f"Bearer {TOKEN}"})
res=r.json().get("result") or []
print(json.dumps([{k:v for k,v in x.items() if k!='keys'} for x in res]))
print("KEYS WA:", sorted((res[[x['abbr'] for x in res].index('WA')]['keys'] or {}).keys()))
