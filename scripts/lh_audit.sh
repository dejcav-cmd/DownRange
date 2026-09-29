#!/usr/bin/env bash
set -u
npm i -g lighthouse@12 >/dev/null 2>&1
mkdir -p /tmp/lh
for p in "/" "/news/law-firm-files-amicus-brief-in-washington-state-s-lifetime-gun-ban-for-dui-case-40e349" "/laws/TX" "/deals" "/ballistics"; do
  n=$(echo "$p" | tr '/' '_' | cut -c1-40)
  lighthouse "https://www.downrangeco.com$p" --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate \
    --only-categories=performance,seo,accessibility,best-practices --output=json --output-path="/tmp/lh/$n.json" \
    --chrome-flags="--headless=new --no-sandbox" --quiet || echo "fail $p"
done
python3 - <<'PY'
import json,glob
out=[]
for f in sorted(glob.glob('/tmp/lh/*.json')):
    d=json.load(open(f)); c=d['categories']; a=d['audits']
    fails=sorted([x for x in a.values() if x.get('score') is not None and x['score']<0.9 and x.get('scoreDisplayMode') not in ('informative','notApplicable','manual')], key=lambda x:x['score'])
    out.append({'url':d['finalDisplayedUrl'].replace('https://www.downrangeco.com',''),
      'scores':{k:round((v['score'] or 0)*100) for k,v in c.items()},
      'lcp':a['largest-contentful-paint'].get('displayValue'),'tbt':a['total-blocking-time'].get('displayValue'),
      'cls':a['cumulative-layout-shift'].get('displayValue'),'fcp':a['first-contentful-paint'].get('displayValue'),
      'lcpEl':(a.get('largest-contentful-paint-element',{}).get('details',{}).get('items') or [{}])[0].get('items',[{}])[0].get('node',{}).get('snippet','')[:140] if a.get('largest-contentful-paint-element') else '',
      'issues':[x['id']+(' ('+x['displayValue']+')' if x.get('displayValue') else '') for x in fails[:12]],
      'bytes':a.get('total-byte-weight',{}).get('displayValue'),
      'unusedJs':a.get('unused-javascript',{}).get('displayValue'),
      'thirdParty':[ (i.get('entity') if isinstance(i.get('entity'),str) else (i.get('entity') or {}).get('text','?'))+' '+str(round(i.get('blockingTime',0)))+'ms' for i in (a.get('third-party-summary',{}).get('details',{}).get('items') or [])[:5]]})
open('/tmp/out.txt','w').write(json.dumps(out,indent=1))
PY
