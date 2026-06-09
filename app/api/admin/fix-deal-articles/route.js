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

// Titles that look like deals: must have a price/discount signal
const DEAL_RE = /\$\d+|\d+%\s*off|save\s+\$|ships for|only\s+\$|drops to\s+\$|priced at\s+\$|starting at\s+\$|\bdiscount\b|\bcoupon\b|sale price|free shipping|rebate/i;

// Titles that are clearly NOT deals regardless of source
const NOT_DEAL_RE = /ninth circuit|supreme court|lawsuit|ruling|ban|law|bill|legislation|subpoena|atf|nra|court|judge|verdict|conviction|election|rights|amendment|congress|senate|police|sheriff|arrest|charged|indicted|killed|shooting|crime|history|review of|how the|changed the|market forever|under development/i;

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const movedToDeals = [], movedFromDeals = [];
  let errors = 0;

  // 1. Fix articles currently in 'deals' that are actually news/law/industry
  const wrongDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category=="deals"] | order(publishedAt desc) [0..300] {_id, title, source}`
  );

  for (const a of wrongDeals) {
    const title = a.title || '';
    // If it has no price signal OR it clearly looks like news/law, reclassify
    if (!DEAL_RE.test(title) || NOT_DEAL_RE.test(title)) {
      // Determine best category from title keywords
      let newCat = 'news';
      if (/court|circuit|supreme|ruling|law|bill|legislation|atf|ban|rights|amendment|congress|senate|subpoena|lawsuit/i.test(title)) newCat = 'law';
      else if (/review|history|how|market|industry|manufacturer|glock|sig|smith|ruger|barrett|colt/i.test(title)) newCat = 'industry';
      try {
        await sanity.patch(a._id).set({ category: newCat }).commit();
        movedFromDeals.push({ id: a._id, title: title.slice(0, 80), to: newCat });
      } catch (e) { errors++; }
    }
  }

  // 2. Fix non-deal articles that actually ARE deals (price pattern in title)
  const nonDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category!="deals"] | order(publishedAt desc) [0..500] {_id, title, source, category}`
  );

  for (const a of nonDeals) {
    const title = a.title || '';
    if (DEAL_RE.test(title) && !NOT_DEAL_RE.test(title)) {
      try {
        await sanity.patch(a._id).set({ category: 'deals' }).commit();
        movedToDeals.push({ id: a._id, title: title.slice(0, 80), from: a.category });
      } catch (e) { errors++; }
    }
  }

  return NextResponse.json({
    ok: errors === 0,
    movedFromDeals: { count: movedFromDeals.length, items: movedFromDeals },
    movedToDeals:   { count: movedToDeals.length,   items: movedToDeals   },
    errors,
  });
}
