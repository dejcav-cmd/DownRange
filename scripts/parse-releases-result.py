import sys, json
raw = sys.stdin.read()
try:
    d = json.loads(raw)
    print(f"Status: OK")
    print(f"Added:   {d.get('added', d.get('done', '?'))}")
    print(f"Skipped: {d.get('skipped','?')}")
    print(f"Failed:  {d.get('failed','?')}")
    saved = d.get('saved', d.get('titles', []))
    if saved:
        print("New releases:")
        for s in (saved if isinstance(saved, list) else [saved]):
            print(f"  - {s}")
    print(f"Full: {str(d)[:500]}")
except:
    print(f"Raw response: {raw[:600]}")
