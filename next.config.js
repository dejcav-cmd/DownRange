/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL:       '/admin-login',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL:       '/admin-login',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/admin',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/admin',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@sanity/client', '@sanity/ui', '@sanity/vision', 'sanity',
      'styled-components', 'rss-parser', 'axios',
    ],
  },
  outputFileTracingIncludes: {
    '/api/agent': ['./agent/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
        ],
      },
      {
        source: '/admin(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Legacy laws tabs → new routes
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'federal' }],   destination: '/laws/federal', permanent: true },
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'state' }],     destination: '/laws/states',  permanent: true },
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'atf' }],       destination: '/laws/federal', permanent: true },
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'scotus' }],    destination: '/laws/federal#scotus', permanent: true },
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'reciprocity' }], destination: '/laws/my-state', permanent: true },
      { source: '/laws', has: [{ type: 'query', key: 'tab', value: 'assistant' }], destination: '/laws/federal', permanent: true },
      // Old pages → new routes
      { source: '/ccw',                        destination: '/laws/my-state',           permanent: true },
      { source: '/state-hub',                  destination: '/laws/states',             permanent: true },
      { source: '/state-hub/:state',           destination: '/laws/:state',             permanent: true },
      { source: '/state-intel',                destination: '/laws/my-state',           permanent: true },
    ]
  },
}

module.exports = nextConfig
