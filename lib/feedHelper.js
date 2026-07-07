// Shared RSS feed builder
import { createClient } from '@sanity/client'

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export function buildFeed({ title, description, feedUrl, siteUrl = 'https://www.downrangeco.com', items = [] }) {
  const esc   = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const cdata = s => `<![CDATA[${s||''}]]>`

  const itemXml = items.map(item => `
  <item>
    <title>${cdata(item.title)}</title>
    <link>${esc(item.url)}</link>
    <guid isPermaLink="true">${esc(item.url)}</guid>
    <description>${cdata(item.description || '')}</description>
    <content:encoded>${cdata(item.description || '')}</content:encoded>
    <pubDate>${new Date(item.date || Date.now()).toUTCString()}</pubDate>
    ${item.category ? `<category>${esc(item.category)}</category>` : ''}
    ${item.author   ? `<dc:creator>${esc(item.author)}</dc:creator>` : ''}
    ${item.image    ? `<enclosure url="${esc(item.image)}" type="image/jpeg" length="0"/>` : ''}
    ${item.image    ? `<media:content url="${esc(item.image)}" medium="image" xmlns:media="http://search.yahoo.com/mrss/"/>` : ''}
    ${item.image    ? `<media:thumbnail url="${esc(item.image)}" xmlns:media="http://search.yahoo.com/mrss/"/>` : ''}
  </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${cdata(title)}</title>
    <link>${siteUrl}</link>
    <description>${cdata(description)}</description>
    <language>en-us</language>
    <copyright>DownRange © ${new Date().getFullYear()}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>
    <image>
      <url>https://www.downrangeco.com/img/logo.png</url>
      <title>${esc(title)}</title>
      <link>${siteUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${itemXml}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type':           'application/rss+xml; charset=utf-8',
      'Cache-Control':          'public, max-age=900, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    }
  })
}
