import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const sanity = createClient({
  projectId: 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2023-08-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const DEAL_RE     = /\$\d+|\d+%\s*off|save\s+\$|ships for|only\s+\$|drops to\s+\$|priced at\s+\$|starting at\s+\$|\bdiscount\b|\bcoupon\b|sale price|free shipping|rebate/i;
const NOT_DEAL_RE = /ninth circuit|supreme court|lawsuit|ruling|ban|law\b|bill\b|legislation|subpoena|\batf\b|\bnra\b|court\b|judge\b|verdict|conviction|election|rights|amendment|congress|senate|police|sheriff|arrest|charged|indicted|killed|crime|history|review of|how the|changed the|market forever|under development/i;

function bestCat(title) {
  if (/court|circuit|supreme|ruling|\blaw\b|\bbill\b|legislation|\batf\b|ban|rights|amendment|congress|senate|subpoena|lawsuit/i.test(title)) return 'law';
  if (/review|history|\bhow\b|market|industry|manufacturer|glock|sig\b|smith|ruger|barrett|colt|polymer|pistol|rifle|shotgun/i.test(title)) return 'industry';
  return 'news';
}

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const movedFromDeals = [], movedToDeals = [];
  let errors = 0;

  // 1. Articles in deals that shouldn't be — batch fetch, batch mutate
  const wrongDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category=="deals"] | order(publishedAt desc) [0..500] {_id, title}`
  );

  const toFix = wrongDeals.filter(a => {
    const t = a.title || '';
    return !DEAL_RE.test(t) || NOT_DEAL_RE.test(t);
  });

  if (toFix.length) {
    const mutations = toFix.map(a => ({
      patch: { id: a._id, set: { category: bestCat(a.title || '') } }
    }));
    // Sanity allows up to 256 mutations per transaction
    for (let i = 0; i < mutations.length; i += 200) {
      try {
        await sanity.mutate(mutations.slice(i, i + 200));
        mutations.slice(i, i + 200).forEach((m, idx) => {
          const a = toFix[i + idx];
          movedFromDeals.push({ id: a._id, title: (a.title||'').slice(0,70), to: m.patch.set.category });
        });
      } catch (e) { errors++; console.error('batch patch error:', e.message); }
    }
  }

  // 2. Non-deal articles that have price signals — should be deals
  const nonDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category!="deals"] | order(publishedAt desc) [0..1000] {_id, title, category}`
  );

  const toPromote = nonDeals.filter(a => {
    const t = a.title || '';
    return DEAL_RE.test(t) && !NOT_DEAL_RE.test(t);
  });

  if (toPromote.length) {
    const mutations = toPromote.map(a => ({
      patch: { id: a._id, set: { category: 'deals' } }
    }));
    for (let i = 0; i < mutations.length; i += 200) {
      try {
        await sanity.mutate(mutations.slice(i, i + 200));
        mutations.slice(i, i + 200).forEach((m, idx) => {
          const a = toPromote[i + idx];
          movedToDeals.push({ id: a._id, title: (a.title||'').slice(0,70), from: a.category });
        });
      } catch (e) { errors++; console.error('promote batch error:', e.message); }
    }
  }

  return NextResponse.json({
    ok: errors === 0,
    scanned: { wrongDeals: wrongDeals.length, nonDeals: nonDeals.length },
    movedFromDeals: { count: movedFromDeals.length, items: movedFromDeals },
    movedToDeals:   { count: movedToDeals.length,   items: movedToDeals   },
    errors,
  });
}
