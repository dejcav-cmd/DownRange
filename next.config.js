/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Clerk where the sign-in page lives — prevents 404 redirects to /sign-in
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/admin-login',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/admin-login',
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
      '@sanity/client',
      '@sanity/ui',
      '@sanity/vision',
      'sanity',
      'styled-components',
      'rss-parser',
      'axios',
    ],
  },
  // Ensure agent/ files are included in Vercel deployment bundle
  outputFileTracingIncludes: {
    '/api/agent': ['./agent/**/*'],
  },
}


  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control',   value: 'on' },
        ],
      },
      {
        // Admin routes — extra cache-busting
        source: '/admin(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ]
  },

module.exports = nextConfig
