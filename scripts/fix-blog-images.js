#!/usr/bin/env node

const { execSync } = require('child_process');

const sanityToken = process.env.SANITY_API_TOKEN;
if (!sanityToken) {
  console.error('❌ SANITY_API_TOKEN not set');
  process.exit(1);
}

const articles = [
  {
    slug: 'gun-prices-tariffs-2026',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=900&fit=crop'
  },
  {
    slug: 'bruen-standard-state-battles-2026',
    imageUrl: 'https://images.unsplash.com/photo-1554115176-72a380f824c7?w=1400&h=900&fit=crop'
  },
  {
    slug: 'micro-compact-pistol-market-2026',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=900&fit=crop'
  }
];

console.log('🔍 Fetching blog posts from Sanity...\n');

const query = `*[_type == "blogPost" && slug.current in [${articles.map(a => `"${a.slug}"`).join(',')}]] { _id, slug, imageUrl }`;

try {
  const curlQuery = `curl -s "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production" \\
    -H "Authorization: Bearer ${sanityToken}" \\
    -H "Content-Type: application/json" \\
    -d '{"query": "${query.replace(/"/g, '\\"')}'}'`;
  
  const result = execSync(curlQuery, { encoding: 'utf-8' });
  const data = JSON.parse(result);
  const docs = data.result || [];

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
    process.exit(0);
  }

  console.log(`📝 Applying ${mutations.length} mutations...\n`);

  const mutPayload = JSON.stringify({ mutations }).replace(/"/g, '\\"');
  const curlMutate = `curl -s "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production" \\
    -X POST \\
    -H "Authorization: Bearer ${sanityToken}" \\
    -H "Content-Type: application/json" \\
    -d '${mutPayload}'`;
  
  const mutResult = execSync(curlMutate, { encoding: 'utf-8' });
  const mutData = JSON.parse(mutResult);

  if (mutData.error) {
    throw new Error(`Mutation failed: ${mutData.error.message}`);
  }

  console.log('✅ Successfully updated blog post images!\n');
  
  docs.forEach(doc => {
    const article = articles.find(a => a.slug === doc.slug.current);
    console.log(`  ✓ ${doc.slug.current}`);
    console.log(`    New: ${article.imageUrl.substring(0, 60)}...\n`);
  });

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
