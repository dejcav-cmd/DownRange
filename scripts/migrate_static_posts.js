const fs = require('fs');
const https = require('https');

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg';
const SANITY_DATASET = 'production';
let SANITY_TOKEN = (process.env.SANITY_API_TOKEN || '').trim();
if (SANITY_TOKEN.startsWith('ST=')) SANITY_TOKEN = SANITY_TOKEN.slice(3);

const ASSET_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${SANITY_DATASET}`;
const MUTATE_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`;

function httpGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGetBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const contentType = res.headers['content-type'] || 'image/jpeg';
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function httpPostBuffer(url, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'Authorization': `Bearer ${SANITY_TOKEN}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Bad JSON from asset upload: ' + Buffer.concat(chunks).toString().slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function httpPostJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(payload));
    const u = new URL(url);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SANITY_TOKEN}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Bad JSON from mutate: ' + Buffer.concat(chunks).toString().slice(0, 500))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function uploadImage(url, filename) {
  const { buffer, contentType } = await httpGetBuffer(url);
  if (buffer.length < 5000) throw new Error(`Downloaded image too small (${buffer.length} bytes) from ${url}`);
  const result = await httpPostBuffer(`${ASSET_URL}?filename=${encodeURIComponent(filename)}`, buffer, contentType);
  const doc = result.document || {};
  return { cdnUrl: doc.url, assetId: doc._id, size: doc.size };
}

// ── Extract the 3 static posts from app/blog/page.js ─────────────────────────
const src = fs.readFileSync('../app/blog/page.js', 'utf8');

function extractObjectAt(text, slugMarker) {
  const markerIdx = text.indexOf(slugMarker);
  if (markerIdx === -1) return null;
  let start = text.lastIndexOf('\n  {\n', markerIdx);
  if (start === -1) return null;
  start = start + 1;
  let depth = 0;
  let i = start;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return text.slice(start, i);
}

const IMAGE_SOURCES = {
  'suppressor-revolution-2026': {
    url: 'https://images.unsplash.com/photo-1754603995050-211123ec24af?w=1600&q=80',
    filename: 'suppressor-revolution-hero.jpg',
  },
  'red-dot-carry-guide-2026': {
    url: 'https://images.unsplash.com/photo-1581955957646-b5a446b6100a?w=1600&q=80',
    filename: 'red-dot-carry-guide-hero.jpg',
  },
  'bruen-standard-state-battles-2026': {
    url: 'https://images.unsplash.com/photo-1658958327132-a80f8a9409fb?w=1600&q=80',
    filename: 'bruen-scotus-hero.jpg',
  },
};

function isoFromLooseDate(dateStr) {
  const d = new Date(dateStr + ' UTC');
  if (isNaN(d)) return new Date().toISOString();
  return d.toISOString();
}

async function main() {
  const results = [];
  const mutations = [];

  for (const slug of Object.keys(IMAGE_SOURCES)) {
    const marker = `slug:        '${slug}'`;
    const objText = extractObjectAt(src, marker);
    if (!objText) { results.push({ slug, status: 'extract_failed' }); continue; }

    let post;
    try {
      post = eval('(' + objText + ')');
    } catch (e) {
      results.push({ slug, status: 'eval_failed', error: e.message });
      continue;
    }

    let uploaded;
    try {
      uploaded = await uploadImage(IMAGE_SOURCES[slug].url, IMAGE_SOURCES[slug].filename);
    } catch (e) {
      results.push({ slug, status: 'image_upload_failed', error: e.message });
      continue;
    }

    const plainWords = (post.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const readTimeNum = Math.max(1, Math.ceil(plainWords / 200));

    const doc = {
      _id: `blog-static-${slug}`,
      _type: 'blogPost',
      title: post.title,
      slug: { _type: 'slug', current: slug },
      author: post.author || 'DJ Cavalcanti',
      authorRole: post.authorRole || 'Founder, DownRange',
      category: (post.category || 'OPINION').toUpperCase(),
      excerpt: post.subtitle || post.excerpt || '',
      body: post.body,
      imageUrl: uploaded.cdnUrl,
      readTime: readTimeNum,
      status: 'published',
      published: true,
      // Force featured:false regardless of the static array's original value —
      // this migration is about fixing images, not changing which post is
      // hero-featured. The static array had this one marked featured:true,
      // which (being newly created today) would otherwise outrank the actual
      // intended featured post (Fierce Wingman SBR) by _createdAt tiebreak.
      featured: false,
      publishedAt: isoFromLooseDate(post.date),
      tags: post.tags || [],
      editorLocked: true,
      qualityReviewed: true,
    };

    mutations.push({ createOrReplace: doc });
    results.push({ slug, status: 'ready', cdnUrl: uploaded.cdnUrl, title: post.title, readTime: readTimeNum });
  }

  let mutateResult = null;
  if (mutations.length > 0) {
    mutateResult = await httpPostJson(MUTATE_URL, { mutations });
  }

  const out = { results, mutateResult };
  fs.writeFileSync('migrate_static_posts_result.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  fs.writeFileSync('migrate_static_posts_result.json', JSON.stringify({ error: e.message, stack: e.stack }, null, 2));
  console.error(e);
  process.exit(1);
});
