export default function robots() {
  return {
    rules: { userAgent:'*', allow:'/', disallow:['/studio/','/admin/','/api/'] },
    sitemap: 'https://downrangeco.com/sitemap.xml',
  }
}
