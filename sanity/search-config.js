// Sanity Search Index Configuration
// This file tells Sanity which fields to include in the full-text search index
// for each document type. Keeping this focused speeds up all GROQ match() queries.
// 
// Reference: https://www.sanity.io/docs/search
// Applied via sanity.config.js defineConfig > plugins

export const searchIndexConfig = {
  types: [
    {
      type: 'newsArticle',
      // Fields indexed for match() operator — title gets highest implicit weight
      fields: [
        { name: 'title',    weight: 10 },
        { name: 'summary',  weight: 5  },
        { name: 'source',   weight: 3  },
        { name: 'tags',     weight: 2  },
        { name: 'category', weight: 1  },
        // body excluded from match() index for performance — too large
      ],
    },
    {
      type: 'legislation',
      fields: [
        { name: 'title',       weight: 10 },
        { name: 'billNumber',  weight: 8  },
        { name: 'state',       weight: 5  },
        { name: 'summary',     weight: 3  },
        { name: 'status',      weight: 1  },
      ],
    },
    {
      type: 'review',
      fields: [
        { name: 'brand',    weight: 10 },
        { name: 'model',    weight: 10 },
        { name: 'caliber',  weight: 5  },
        { name: 'category', weight: 3  },
        { name: 'summary',  weight: 2  },
        { name: 'verdict',  weight: 1  },
      ],
    },
    {
      type: 'firearmRelease',
      fields: [
        { name: 'brand',    weight: 10 },
        { name: 'model',    weight: 10 },
        { name: 'caliber',  weight: 5  },
        { name: 'category', weight: 3  },
        { name: 'summary',  weight: 2  },
      ],
    },
    {
      type: 'blogPost',
      fields: [
        { name: 'title',    weight: 10 },
        { name: 'summary',  weight: 5  },
        { name: 'category', weight: 2  },
        { name: 'tags',     weight: 2  },
      ],
    },
    {
      type: 'stateProfile',
      fields: [
        { name: 'name',    weight: 10 },
        { name: 'abbr',    weight: 8  },
        { name: 'summary', weight: 3  },
        { name: 'rating',  weight: 1  },
      ],
    },
  ],
}

// ── Performance notes ────────────────────────────────────────────────────────
// 
// Sanity's GROQ `match` operator uses a built-in inverted text index.
// Queries like `title match "*glock*"` are O(log n) — fast even at 100k docs.
//
// Additional speed optimizations applied in the codebase:
//
// 1. useCdn: true for all read queries (served from CDN edge, ~10ms globally)
// 2. score() + boost() for relevance ranking without full table scans
// 3. Per-type parallel queries — 6 types searched simultaneously via Promise.all
// 4. Result limit: 8 per type = max 48 docs evaluated, then sorted client-side
// 5. Debounce: 220ms on frontend before API hit
// 6. API response cached at Vercel Edge for 10s (stale-while-revalidate)
//
// For high-volume (10k+ req/day), consider:
// - Algolia index sync via /api/admin/sync-search-index (export GROQ → Algolia)
//   ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY env vars are already defined
// - The existing PageClient.js already supports Algolia when keys are set
