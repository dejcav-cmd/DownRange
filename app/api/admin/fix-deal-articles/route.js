import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const sanity = createClient({
  projectId: 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2023-08-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const DEAL_RE = /\$\d+|\d+%\s*off|save\s+\$|ships for|only\s+\$|drops to\s+\$|priced at\s+\$|starting at\s+\$|\bdiscount\b|\bcoupon\b|sale price/i;

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Fetch non-deal news articles
  const articles = await sanity.fetch(
    `*[_type=="newsArticle" && category!="deals"] | order(publishedAt desc) [0..500] {_id, title, category}`
  );

  const toFix = articles.filter(a => a.title && DEAL_RE.test(a.title));

  let fixed = 0, errors = 0;
  const results = [];

  for (const a of toFix) {
    try {
      await sanity.patch(a._id).set({ category: 'deals' }).commit();
      fixed++;
      results.push({ id: a._id, title: a.title, from: a.category, status: 'fixed' });
    } catch (err) {
      errors++;
      results.push({ id: a._id, title: a.title, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({
    ok: errors === 0,
    scanned: articles.length,
    found: toFix.length,
    fixed,
    errors,
    results,
  });
}
