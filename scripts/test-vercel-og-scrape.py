"""Test if Vercel can actually scrape gun.deals OG images"""
import urllib.request, json, os, time

ADMIN_KEY = os.environ.get('ADMIN_KEY', '')
BASE = 'https://downrangeco.com'

test_url = 'https://gun.deals/product/hk45c-v1-45-acp-394-8rd-pistol-night-sights-69999'
api_url  = f'{BASE}/api/admin/test-og-scrape?url={test_url}'

req = urllib.request.Request(api_url, headers={'x-admin-key': ADMIN_KEY})
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read())

result = f"""=== VERCEL OG SCRAPE TEST ===
Target URL:    {data['url']}
HTTP Status:   {data['status']}
Body Length:   {data['bodyLength']}
CF Challenge:  {data['cfChallenge']}
OG Image:      {data['ogImage']}
Error:         {data['error']}

HEAD SNIPPET:
{data['snippet'][:500]}
"""

print(result)
with open('scripts/vercel-og-test-result.txt', 'w') as f:
    f.write(result)
