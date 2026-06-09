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

// These sources publish news/law/opinion — never deals unless title has a price signal
const NEWS_ONLY_SOURCES = [
  'AmmoLand','The Firearm Blog','TTAG','Guns.com News','Guns & Ammo',
  'Shooting Wire','Firearms News','Concealed Nation','Outdoor Life Guns',
  'Field & Stream Guns','Tactical Life','Personal Defense World','Combat Handguns',
  'Handguns Magazine','Rifle Shooter','American Rifleman','American Hunter',
  'Shooting Illustrated','GunsAmerica Digest','NRA-ILA','SAF','FPC','FPC Law',
  'CleanUpATF','Duke Firearms Law','Bearing Arms','Guns & Patriots','ATF News',
  'Congress.gov 2A','GOA','GOA Press','Gun News Daily','Gun Digest','Recoil Magazine',
  'Daily Caller Guns','Washington Free Beacon Guns','National Review Guns',
  'Townhall Guns','Breitbart 2A','NSSF Blog','USCCA Blog','Pew Pew Tactical',
];

const PRICE_RE = /\$\d+|\d+%\s*off|save\s+\$|ships for|only\s+\$|drops to\s+\$|priced at\s+\$|starting at\s+\$|\bdiscount\b|\bcoupon\b|sale price|free shipping|rebate/i;

function bestCat(title) {
  if (/court|circuit|supreme|ruling|\blaw\b|\bbill\b|legislation|\batf\b|ban|rights|amendment|congress|senate|subpoena|lawsuit|verdict|conviction/i.test(title)) return 'law';
  if (/review|history|\bhow\b|market|industry|manufacturer|glock|sig\b|smith|ruger|barrett|colt|polymer|pistol|rifle|shotgun|handgun|carbine|suppressor/i.test(title)) return 'industry';
  return 'news';
}

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const movedFromDeals = [];
  const movedToDeals = [];
  let errors = 0;

  // 1. Articles marked deals from news-only sources that have no price signal
  const wrongDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category=="deals"] | order(publishedAt desc) [0..1000] {_id, title, source}`
  );

  const toFix = wrongDeals.filter(a => {
    if (!a.title) return true; // no title = mislabeled
    const fromNewsSource = NEWS_ONLY_SOURCES.includes(a.source);
    const hasPrice = PRICE_RE.test(a.title);
    // Remove from deals if: news-only source with no price, OR clearly no price signal at all
    return (fromNewsSource && !hasPrice) || (!hasPrice);
  });

  if (toFix.length) {
    const mutations = toFix.map(a => ({
      patch: { id: a._id, set: { category: bestCat(a.title || '') } }
    }));
    for (let i = 0; i < mutations.length; i += 200) {
      try {
        await sanity.mutate(mutations.slice(i, i + 200));
        mutations.slice(i, i + 200).forEach((m, j) => {
          const a = toFix[i + j];
          movedFromDeals.push({ title: (a.title||'').slice(0,70), source: a.source, to: m.patch.set.category });
        });
      } catch (e) { errors++; }
    }
  }

  // 2. Articles NOT in deals that have a real price signal in title
  const nonDeals = await sanity.fetch(
    `*[_type=="newsArticle" && category!="deals"] | order(publishedAt desc) [0..1000] {_id, title, source, category}`
  );

  const toPromote = nonDeals.filter(a => {
    if (!a.title) return false;
    return PRICE_RE.test(a.title);
  });

  if (toPromote.length) {
    const mutations = toPromote.map(a => ({ patch: { id: a._id, set: { category: 'deals' } } }));
    for (let i = 0; i < mutations.length; i += 200) {
      try {
        await sanity.mutate(mutations.slice(i, i + 200));
        mutations.slice(i, i + 200).forEach((m, j) => {
          const a = toPromote[i + j];
          movedToDeals.push({ title: (a.title||'').slice(0,70), source: a.source, from: a.category });
        });
      } catch (e) { errors++; }
    }
  }

  return NextResponse.json({
    ok: errors === 0,
    movedFromDeals: { count: movedFromDeals.length, items: movedFromDeals },
    movedToDeals:   { count: movedToDeals.length,   items: movedToDeals },
    errors,
  });
}
