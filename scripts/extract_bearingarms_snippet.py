#!/usr/bin/env python3
content = open('bearingarms_raw.xml', encoding='utf-8', errors='replace').read()
idx = content.find('Colorado Sheriffs')
if idx == -1:
    idx = content.find('<description>')
snippet = content[max(0, idx - 300):idx + 1500]
with open('bearingarms_snippet.txt', 'w', encoding='utf-8') as f:
    f.write(snippet)
print(snippet)
