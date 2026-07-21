import urllib.request, urllib.parse, json, os, sys

TOKEN = os.environ['SANITY_TOKEN']
ADMIN = os.environ.get('ADMIN_KEY','')

def sq(q, params=None):
    url = f"https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req) as r: return json.load(r).get('result', [])

def mutate(mutations):
    url = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    req = urllib.request.Request(url,
        data=json.dumps({'mutations': mutations}).encode(),
        method='POST',
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r: return json.load(r)

# Find junk: $0 value + no endDate + title doesn't contain real giveaway words
junk_q = """*[_type=="giveaway" && (prizeValue == 0 || !defined(prizeValue)) && !defined(endDate)]{_id, title, entryUrl, source}"""
all_no_value_no_date = sq(junk_q)
print(f"Candidates ($0/no date): {len(all_no_value_no_date)}")

import re
giveaway_words = re.compile(r"win a|win an|give ?away|enter to win|sweepstake|contest|free (gun|rifle|pistol|ammo|firearm)|prize pack|enter now|enter here", re.IGNORECASE)

junk = []
for doc in all_no_value_no_date:
    title = doc.get('title', '')
    if not giveaway_words.search(title):
        junk.append(doc)

print(f"Junk to delete: {len(junk)}")
for d in junk[:5]:
    print(f"  DELETE: {d.get('title','?')[:60]}")

# Delete them in batches
if junk:
    batch_size = 50
    deleted = 0
    for i in range(0, len(junk), batch_size):
        batch = junk[i:i+batch_size]
        mutations = [{'delete': {'id': d['_id']}} for d in batch]
        try:
            result = mutate(mutations)
            deleted += len(batch)
            print(f"Deleted batch {i//batch_size + 1}: {len(batch)} docs")
        except Exception as e:
            print(f"Batch {i//batch_size + 1} error: {e}")

    print(f"Total deleted: {deleted}")

# Final count
after = sq('count(*[_type=="giveaway" && active==true])')
print(f"Active giveaways after cleanup: {after}")
