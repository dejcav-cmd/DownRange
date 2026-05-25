/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**.ammoland.com' },
      { protocol: 'https', hostname: '**.thefirearmblog.com' },
      { protocol: 'https', hostname: '**.thetruthaboutguns.com' },
      { protocol: 'https', hostname: '**.guns.com' },
      { protocol: 'https', hostname: '**.sigsauer.com' },
      { protocol: 'https', hostname: '**.glock.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@sanity/client'],
  },
}

module.exports = nextConfig
