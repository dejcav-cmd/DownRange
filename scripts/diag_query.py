import json, sys, urllib.request, os

admin_key = os.environ.get('ADMIN_KEY','')
url = "https://www.downrangeco.com/api/admin/amazon-diag"

req = urllib.request.Request(url, headers={"x-admin-key": admin_key})
try:
    with urllib.request.urlopen(req, timeout=65) as resp:
        data = json.loads(resp.read())
except Exception as e:
    print(f"Request failed: {e}")
    sys.exit(1)

print(f"Total time: {data.get('ms','?')}ms")
for key in ['without_filter', 'with_filter']:
    r = data.get(key, {})
    print(f"\n=== {key} ===")
    print(f"  HTTP: {r.get('httpStatus','?')}  length: {r.get('htmlLength',0)}  error: {r.get('error','none')}")
    print(f"  ASINs: {r.get('totalAsins',0)}  list: {r.get('asins',[])[:5]}")
    print(f"  Signals: {r.get('dealSignals',{})}  anySignal: {r.get('anyDealSignal','?')}")
    print(f"  htmlStart: {str(r.get('htmlStart',''))[:120]}")

# Save full JSON
with open('/tmp/diag_result.json','w') as f:
    json.dump(data, f)
print("\nFull result saved to /tmp/diag_result.json")
