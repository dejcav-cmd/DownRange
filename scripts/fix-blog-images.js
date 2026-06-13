#!/usr/bin/env node

/**
 * Fix placeholder images on three blog posts with real Unsplash images
 * Run: SANITY_API_TOKEN=... node scripts/fix-blog-images.js
 */

const sanityToken = process.env.SANITY_API_TOKEN;
if (!sanityToken) {
  console.error('❌ SANITY_API_TOKEN not set');
  process.exit(1);
}

const articles = [
  {
    slug: 'gun-prices-tariffs-2026',
    title: 'The Tariff Tax on Your Next Gun Purchase',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=900&fit=crop'
  },
  {
    slug: 'bruen-standard-state-battles-2026',
    title: 'The Bruen Battles of 2026',
    imageUrl: 'https://images.unsplash.com/photo-1554115176-72a380f824c7?w=1400&h=900&fit=crop'
  },
  {
    slug: 'micro-compact-pistol-market-2026',
    title: 'Why the Micro-Compact 9mm Is the Most Important',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=900&fit=crop'
  }
];

async function main() {
  console.log('🔍 Fetching blog posts from Sanity...\n');

  const query = `*[_type == "blogPost" && slug.current in [${articles.map(a => `"${a.slug}"`).join(',')}]] { _id, slug, title, imageUrl }`;

  try {
    const queryRes = await fetch('https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sanityToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!queryRes.ok) {
      throw new Error(`Query failed: ${queryRes.status}`);
    }

    const queryData = await queryRes.json();
    const docs = queryData.result || [];

    console.log(`✓ Found ${docs.length} blog posts\n`);

    const mutations = docs.map(doc => ({
      patch: {
        id: doc._id,
        set: {
          imageUrl: articles.find(a => a.slug === doc.slug.current)?.imageUrl
        }
      }
    })).filter(m => m.patch.set.imageUrl);

    if (mutations.length === 0) {
      console.log('⚠️  No mutations to apply');
      return;
    }

    console.log(`📝 Applying ${mutations.length} mutations...\n`);

    const mutateRes = await fetch('https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sanityToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mutations })
    });

    if (!mutateRes.ok) {
      throw new Error(`Mutation failed: ${mutateRes.status}`);
    }

    const result = await mutateRes.json();
    console.log('✅ Successfully updated blog post images!\n');
    
    docs.forEach((doc, i) => {
      const article = articles.find(a => a.slug === doc.slug.current);
      console.log(`  ✓ ${doc.slug.current}`);
      console.log(`    Old: ${doc.imageUrl.substring(0, 50)}...`);
      console.log(`    New: ${article.imageUrl.substring(0, 50)}...\n`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
