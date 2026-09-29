import urllib.request, json, os
r = urllib.request.urlopen(urllib.request.Request('https://www.downrangeco.com/api/admin/cron-status',
      headers={'x-admin-key': os.environ.get('ADMIN_KEY',''), 'User-Agent':'Mozilla/5.0'}), timeout=60)
d = json.loads(r.read())
jobs = d.get('jobs') or d.get('data') or d
out = []
for j in jobs:
    lr = j.get('lastRun') or {}
    out.append({'id': j.get('id'), 'status': j.get('status'), 'age_min': j.get('lastRunAge'),
                'schedule': j.get('schedule'), 'rate': j.get('successRate') or j.get('successes'),
                'details': str(lr.get('details') or lr.get('error') or '')[:110]})
print(json.dumps(out, indent=0))
