const fs = require('fs');

const src = fs.readFileSync('../app/blog/page.js', 'utf8');
const targetSlugs = ['suppressor-revolution-2026', 'bruen-standard-state-battles-2026', 'red-dot-carry-guide-2026'];

function extractObjectAt(text, slugMarker) {
  const markerIdx = text.indexOf(slugMarker);
  if (markerIdx === -1) return null;
  // scan backward to find the opening brace of this object (a line that is just "  {")
  let start = text.lastIndexOf('\n  {\n', markerIdx);
  if (start === -1) return null;
  start = start + 1; // move past the leading \n, point at "  {"
  // now scan forward counting braces from `start` to find matching close
  let depth = 0;
  let i = start;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  const objText = text.slice(start, i); // includes outer { ... }
  return objText;
}

const results = {};
for (const slug of targetSlugs) {
  const marker = `slug:        '${slug}'`;
  const objText = extractObjectAt(src, marker);
  if (!objText) { results[slug] = { error: 'not found' }; continue; }
  try {
    // eslint-disable-next-line no-eval
    const obj = eval('(' + objText + ')');
    results[slug] = obj;
  } catch (e) {
    results[slug] = { error: e.message, objTextSnippet: objText.slice(0, 300) };
  }
}

fs.writeFileSync('extracted_posts.json', JSON.stringify(results, null, 2));
console.log('Extracted', Object.keys(results).length, 'posts');
for (const slug of targetSlugs) {
  const r = results[slug];
  if (r.error) {
    console.log(slug, '-> ERROR:', r.error);
  } else {
    console.log(slug, '-> title:', r.title, '| bodyLen:', (r.body||'').length, '| category:', r.category);
  }
}
