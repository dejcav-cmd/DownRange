import json, re, urllib.request, urllib.parse, urllib.error
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36","Accept":"text/html,application/xhtml+xml,*/*"}
def get(u, headers=UA, follow=True, t=20):
    class NoRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*a,**k): return None
    op = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedir)
    try:
        r=op.open(urllib.request.Request(u,headers=headers),timeout=t)
        return r.status, r.geturl(), dict(r.headers), r.read(400000).decode("utf8","replace")
    except urllib.error.HTTPError as e:
        return e.code, u, dict(e.headers), (e.read(20000).decode("utf8","replace") if e.fp else "")
    except Exception as e:
        return 0,u,{},repr(e)
out={}
s,_,h,rss=get("https://gun.deals/rss.xml"); out["rss_status"]=s
items=re.findall(r"<item>(.*?)</item>",rss,re.S)
out["rss_items"]=len(items)
out["rss_sample_fields"]=re.findall(r"<(\w+)[ >]",items[0])[:25] if items else []
out["rss_first_item"]=items[0][:1500] if items else ""
for name in ("robots.txt","terms","terms-of-service","about"):
    s,u,h,b=get("https://gun.deals/"+name); out["page_"+name]={"status":s,"len":len(b),"head":b[:1200] if name=="robots.txt" else re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",b))[:600]}
res=[]
for it in items[:6]:
    link=(re.search(r"<link>(.*?)</link>",it,re.S) or re.search(r"<guid[^>]*>(.*?)</guid>",it,re.S))
    if not link: continue
    link=re.sub(r"<!\[CDATA\[|\]\]>","",link.group(1)).strip()
    s,u,h,b=get(link)
    hrefs=re.findall(r'href=["\']([^"\']+)["\']',b)
    cand=[x for x in hrefs if re.search(r"/(go|click|out|redirect|goto|visit|deal-link)|\?url=|merchant|affiliate|avantlink|impact|shareasale|cj\.com|awin|rakuten|linksynergy|sovrn|skimlinks|tag=",x,re.I)][:8]
    ext=[x for x in hrefs if x.startswith("http") and "gun.deals" not in x][:10]
    info={"deal_page":link,"status":s,"title":(re.search(r"<title>(.*?)</title>",b,re.S) or [0,""])[1].strip()[:120],"candidate_outbound":cand,"external_links":ext}
    # follow first candidate without cookies, manual hops
    first=(cand or ext or [None])[0]
    if first:
        cur=urllib.parse.urljoin(link,first); hops=[]
        for _ in range(6):
            s2,u2,h2,b2=get(cur,follow=False)
            loc=h2.get("Location") or h2.get("location")
            hops.append({"url":cur[:300],"status":s2,"location":(loc or "")[:300]})
            if not loc: 
                m=re.search(r'http-equiv=["\']refresh["\'][^>]*url=([^"\'>]+)',b2,re.I) or re.search(r'window\.location(?:\.href)?\s*=\s*["\']([^"\']+)',b2)
                if m: hops.append({"js_or_meta_redirect":m.group(1)[:300]})
                break
            cur=urllib.parse.urljoin(cur,loc)
        info["hops"]=hops
    res.append(info)
out["deals"]=res
json.dump(out,open("gundeals_diag.json","w"),indent=2)
