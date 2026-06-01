#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os
TOKEN = os.environ.get('SANITY_TOKEN','')
HEADERS = {'Authorization': f'Bearer {TOKEN}'}
groq = '*[_id == "debug-news-status-latest"][0] { details }'
url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(groq)
req = urllib.request.Request(url, headers=HEADERS)
with urllib.request.urlopen(req) as r:
    d = json.loads(r.read())
    result = d.get('result') or {}
    print(result.get('details','No data'))
