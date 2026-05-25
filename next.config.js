/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow all external image domains via remotePatterns
    remotePatterns: [
      // Sanity CDN
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // YouTube thumbnails
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i3.ytimg.com' },
      // NewsAPI / GNews sources — allow all HTTPS image domains
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
  serverExternalPackages: ['@sanity/client'],
}

module.exports = nextConfig
