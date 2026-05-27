// Shared RSS feed builder
import { createClient } from '@sanity/client'

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export function buildFeed({ title, description, feedUrl, siteUrl = 'https://downrangeco.com', items = [] }) {
  const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const cdata = s => `<![CDATA[${s||''}]]>`

  const itemXml = items.map(item => `
  <item>
    <title>${cdata(item.title)}</title>
    <link>${item.url}</link>
    <guid isPermaLink="true">${item.url}</guid>
    <description>${cdata(item.description || '')}</description>
    <pubDate>${new Date(item.date || Date.now()).toUTCString()}</pubDate>
    ${item.category ? `<category>${esc(item.category)}</category>` : ''}
    ${item.author ? `<author>${esc(item.author)}</author>` : ''}
    ${item.image ? `<enclosure url="${esc(item.image)}" type="image/jpeg" length="0"/>` : ''}
    ${item.image ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${esc(item.image)}"/>` : ''}
  </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${cdata(title)}</title>
    <link>${siteUrl}</link>
    <description>${cdata(description)}</description>
    <language>en-us</language>
    <copyright>DownRange © ${new Date().getFullYear()}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>https://downrangeco.com/icon.png</url>
      <title>${esc(title)}</title>
      <link>${siteUrl}</link>
    </image>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${itemXml}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    }
  })
}
