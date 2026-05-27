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
    ],
  },
}

module.exports = nextConfig
