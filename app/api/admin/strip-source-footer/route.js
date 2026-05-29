import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

export const dynamic = 'force-dynamic';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const PATTERNS = [
  /<p[^>]*>\s*<em>\s*Source:\s*<a[^>]*>[^<]*<\/a>\s*[—\-–]\s*visit the original article[^<]*<\/em>\s*<\/p>/gi,
  /<p[^>]*>\s*Source:\s*visit the original article[^<]*<\/p>/gi,
  /\n?Source:\s*visit the original article for complete details[^.\n]*\.?/gi,
  /\n?Source:\s*Visit the original article for complete details[^.\n]*\.?/gi,
];

function stripFooter(body) {
  if (!body) return { cleaned: body, changed: false };
  let cleaned = body;
  for (const pattern of PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.trim();
  return { cleaned, changed: cleaned !== body };
}

export async function POST(req) {
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await client.fetch(
      `*[_type == "newsArticle" && defined(body)] { _id, body }`
    );

    let patched = 0;
    let skipped = 0;
    const errors = [];
    const BATCH = 50;

    for (let i = 0; i < articles.length; i += BATCH) {
      const batch = articles.slice(i, i + BATCH);
      const tx = client.transaction();
      let txHasWork = false;

      for (const article of batch) {
        const { cleaned, changed } = stripFooter(article.body);
        if (changed) {
          tx.patch(article._id, { set: { body: cleaned } });
          txHasWork = true;
          patched++;
        } else {
          skipped++;
        }
      }

      if (txHasWork) {
        try {
          await tx.commit();
        } catch (err) {
          errors.push(`Batch ${i}-${i + BATCH}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: articles.length,
      patched,
      skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('strip-source-footer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
