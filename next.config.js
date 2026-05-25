/** @type {import('next').NextConfig} */
const nextConfig = {
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
