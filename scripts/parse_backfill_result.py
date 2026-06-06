import sys, json

try:
    d = json.load(sys.stdin)
    print('ok:', d.get('ok'))
    print('fixed:', d.get('fixed'), '/', d.get('total'))
    for r in d.get('results', []):
        print(f'  [{r["status"]}] {r["title"]}')
        if r.get('url'):
            print(f'    -> {r["url"]}')
except Exception as e:
    print('Error parsing response:', e)
    sys.exit(1)
