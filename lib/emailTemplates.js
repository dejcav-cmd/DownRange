// lib/emailTemplates.js
// Shared email template generators

export function generateWelcomeEmailHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DownRange</title>
</head>
<body style="margin:0;padding:0;background:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <!-- WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;padding:40px 20px;">
  <tr><td align="center">
  <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

    <!-- LOGO HEADER -->
    <tr>
      <td style="background:#111111;padding:48px 40px 40px;text-align:center;border-bottom:3px solid #c8922a;">
        <img src="https://downrangeco.com/img/logo.png" width="380" alt="DownRange" style="display:block;margin:0 auto;max-width:100%;height:auto;border:0;" />
        <p style="margin:20px 0 0;font-size:11px;letter-spacing:3px;color:#666;text-transform:uppercase;font-family:'Courier New',monospace;">PRESS KIT &middot; MEDIA RESOURCES &middot; 2026</p>
      </td>
    </tr>

    <!-- HERO HEADLINE -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px 40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">YOU&rsquo;RE IN</p>
        <h1 style="margin:0 0 28px;font-size:48px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;letter-spacing:-1px;">WELCOME TO<br><span style="color:#c8922a;">DOWNRANGE CO.</span></h1>
        <p style="margin:0;font-size:16px;color:#cccccc;line-height:1.8;">DownRange Co. is an independent firearms and Second Amendment intelligence platform headquartered in Washington State. You&rsquo;re now receiving curated intelligence direct to your inbox!</p>
      </td>
    </tr>

    <!-- STATS BAR -->
    <tr>
      <td style="background:#111111;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">50</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">STATES COVERED</p>
              <p style="margin:0;font-size:11px;color:#666;">Full legal + carry law database</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">30+</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">MFG TRACKED</p>
              <p style="margin:0;font-size:11px;color:#666;">Real-time release monitoring</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">24/7</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">NEWS INTEL</p>
              <p style="margin:0;font-size:11px;color:#666;">AI-powered, 15-min refresh</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">2026</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">FOUNDED</p>
              <p style="margin:0;font-size:11px;color:#666;">Washington State, USA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- OUR MISSION -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">OUR MISSION</p>
        <h2 style="margin:0 0 24px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;">GROW THE SECOND AMENDMENT<br>COMMUNITY ACROSS AMERICA</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#cccccc;line-height:1.8;">DownRange exists because gun owners, dealers, instructors, and Second Amendment advocates deserve a dedicated intelligence platform&mdash;one that covers what matters without apology, without a corporate agenda.</p>
        <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;">We built DownRange to be the first place you check when a law changes in your state, when a new firearm drops, or when a court hands down a Second Amendment decision.</p>
      </td>
    </tr>

    <!-- WHAT YOU GET -->
    <tr>
      <td style="background:#111111;padding:48px;">
        <p style="margin:0 0 32px;font-size:11px;letter-spacing:3px;color:#c8922a;text-transform:uppercase;font-weight:700;">WHAT YOU GET</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding:0 20px 28px 0;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Breaking Alerts</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Immediate notification on major news and developments</p>
            </td>
            <td width="50%" style="padding:0 0 28px 0;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Daily Briefing</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Curated news, legislation, and analysis frequently.</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:0 20px 28px 0;vertical-align:top;border-top:1px solid #2a2a2a;padding-top:20px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">State Laws</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Comprehensive CCW, NFA, and regulatory tracking by state</p>
            </td>
            <td width="50%" style="padding:0 0 28px 0;vertical-align:top;border-top:1px solid #2a2a2a;padding-top:20px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Market Intel</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Ammunition pricing, deals, and industry trends</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:20px 20px 0 0;vertical-align:top;border-top:1px solid #2a2a2a;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Legal Updates</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Supreme Court decisions, litigation tracking, and case analysis</p>
            </td>
            <td width="50%" style="padding:20px 0 0 0;vertical-align:top;border-top:1px solid #2a2a2a;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Threat Assessment</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Real-time monitoring of threats to your rights</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px;text-align:center;">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://downrangeco.com" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="0%" strokecolor="#8a6018" fillcolor="#c8922a"><w:anchorlock/><center style="color:#000000;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:3px;">VISIT DOWNRANGE &rarr;</center></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a href="https://downrangeco.com" style="display:inline-block;background:#c8922a;color:#000000;padding:18px 56px;text-decoration:none;font-weight:900;letter-spacing:3px;text-transform:uppercase;font-size:13px;font-family:'Arial Black',Arial,sans-serif;border:2px solid #c8922a;border-bottom:4px solid #7a5010;mso-hide:all;">VISIT DOWNRANGE &nbsp;&rarr;</a>
        <!--<![endif]-->
        <p style="margin:32px 0 0;font-size:13px;color:#555;font-family:'Courier New',monospace;letter-spacing:1px;">Stay armed. Stay informed. <strong style="color:#888;">Stay DownRange.</strong></p>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#111111;padding:32px 48px;border-top:1px solid #2a2a2a;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#555;">Questions? <a href="mailto:dj@downrangeco.com" style="color:#c8922a;text-decoration:none;">Contact us</a> &mdash; <a href="https://downrangeco.com/unsubscribe" style="color:#c8922a;text-decoration:none;">Unsubscribe</a></p>
        <p style="margin:0;font-size:10px;color:#444;font-family:'Courier New',monospace;">DownRange Co. | Second Amendment Intelligence Platform<br>Your source for unfiltered news and analysis.</p>
      </td>
    </tr>

  </table>
  </td></tr>
  </table>

</body>
</html>`
}
export function generateNewsletterHTML(data, isTest = false) {
  const { news = [], blogs = [], deals = [] } = data || {}
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const shortDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const issueNum = Math.floor((now - new Date('2026-01-01')) / (1000 * 60 * 60 * 24)) + 1
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  const safeText = (s = '') => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')

  const truncate = (s = '', n = 120) => {
    const clean = String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    return clean.length > n ? clean.slice(0, n).trim() + '…' : clean
  }

  const categoryLabel = (cat = '') => {
    const map = {
      'legislation': 'LEGISLATION', 'legal': 'LEGAL', 'court': 'COURTS',
      'market': 'MARKET', 'deal': 'DEALS', 'breaking': 'BREAKING',
      'industry': 'INDUSTRY', 'politics': 'POLITICS', 'rights': '2A RIGHTS',
    }
    const c = cat.toLowerCase()
    for (const [k, v] of Object.entries(map)) { if (c.includes(k)) return v }
    return cat.toUpperCase() || 'NEWS'
  }

  const categoryColor = (cat = '') => {
    const c = cat.toLowerCase()
    if (c.includes('legal') || c.includes('court') || c.includes('breaking')) return '#ef4444'
    if (c.includes('legislat') || c.includes('polit') || c.includes('rights')) return '#f97316'
    if (c.includes('market') || c.includes('deal') || c.includes('industr')) return '#c8922a'
    return '#c8922a'
  }

  // ── LEAD STORY (full-width hero with image) ──────────────────────────────
  const lead = news[0]
  const leadBlock = lead ? (() => {
    const url = `https://downrangeco.com/news/${lead.slug?.current || ''}`
    const cat = categoryLabel(lead.category)
    const color = categoryColor(lead.category)
    const img = lead.imageUrl
    return `
  <!-- ═══ LEAD STORY ═══ -->
  <tr><td style="height:3px;background:#c8922a;"></td></tr>
  <tr>
    <td style="background:#111111;">
      ${img ? `<img src="${img}" width="640" alt="${safeText(lead.title)}" style="display:block;width:100%;max-width:640px;height:220px;object-fit:cover;border:0;" />` : `<div style="width:100%;height:180px;background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);display:block;"></div>`}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:32px 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:14px;">
                  <span style="display:inline-block;background:${color};color:#000000;padding:5px 12px;font-size:10px;font-weight:900;letter-spacing:2px;font-family:Arial,sans-serif;margin-right:10px;">${cat}</span>
                  <span style="font-size:10px;color:#555555;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">LEAD STORY</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;">
                  <a href="${url}" style="font-size:28px;font-weight:900;color:#ffffff;text-decoration:none;line-height:1.15;font-family:'Arial Black',Arial,sans-serif;display:block;letter-spacing:-0.5px;">${safeText(lead.title)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:24px;border-bottom:1px solid #222222;">
                  <p style="margin:0;font-size:15px;color:#999999;line-height:1.75;font-family:Arial,sans-serif;">${safeText(truncate(lead.summary || '', 200))}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px;">
                  <a href="${url}" style="display:inline-block;background:#c8922a;color:#000000;padding:13px 32px;text-decoration:none;font-weight:900;letter-spacing:2px;font-size:12px;font-family:'Arial Black',Arial,sans-serif;border-bottom:4px solid #7a5010;">READ FULL STORY &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:8px;background:#0d0d0d;"></td></tr>`
  })() : ''

  // ── STORY STACK (2-col grid for stories 2-3, then list for 4-6) ──────────
  const storyPair = (a, b, idx) => {
    const makeCard = (art, n) => {
      if (!art) return `<td width="50%" style="padding:0;"></td>`
      const url = `https://downrangeco.com/news/${art.slug?.current || ''}`
      const img = art.imageUrl
      const color = categoryColor(art.category)
      const cat = categoryLabel(art.category)
      return `
      <td width="50%" style="padding:0 1px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;height:100%;">
          <tr>
            <td style="padding:0;">
              ${img
                ? `<img src="${img}" width="320" alt="${safeText(art.title)}" style="display:block;width:100%;height:140px;object-fit:cover;border:0;" />`
                : `<div style="height:6px;background:${color};width:100%;display:block;"></div>`}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 22px 24px;">
              <p style="margin:0 0 8px;font-size:10px;color:${color};letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">${cat}</p>
              <a href="${url}" style="font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:10px;">${safeText(art.title)}</a>
              <p style="margin:0 0 14px;font-size:12px;color:#777777;line-height:1.6;font-family:Arial,sans-serif;">${safeText(truncate(art.summary || '', 90))}</p>
              <a href="${url}" style="font-size:12px;color:#c8922a;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;border-bottom:1px solid rgba(200,146,42,0.4);padding-bottom:1px;">Continue reading &rarr;</a>
            </td>
          </tr>
        </table>
      </td>`
    }
    return `
  <tr>
    <td style="padding:0;background:#0d0d0d;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${makeCard(a, idx)}
          ${makeCard(b, idx + 1)}
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>`
  }

  // Stories 2-3 as 2-col
  const gridStories = news.length > 1 ? storyPair(news[1], news[2], 2) : ''

  // Stories 4-6 as slim list rows
  const listStories = news.slice(3, 6).map((a, i) => {
    const url = `https://downrangeco.com/news/${a.slug?.current || ''}`
    const img = a.imageUrl
    const color = categoryColor(a.category)
    const cat = categoryLabel(a.category)
    const num = i + 4
    return `
  <tr>
    <td style="padding:0 0 2px 0;background:#0d0d0d;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;">
        <tr>
          ${img ? `<td width="100" style="padding:0;vertical-align:top;"><img src="${img}" width="100" alt="" style="display:block;width:100px;height:80px;object-fit:cover;border:0;" /></td>` : ''}
          <td style="padding:16px 20px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:10px;color:${color};letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">${cat}</p>
                  <a href="${url}" style="font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:8px;">${safeText(a.title)}</a>
                  <a href="${url}" style="font-size:12px;color:#c8922a;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;border-bottom:1px solid rgba(200,146,42,0.4);padding-bottom:1px;">Continue reading &rarr;</a>
                </td>
                <td width="32" style="vertical-align:top;text-align:right;padding-top:2px;">
                  <span style="font-size:28px;font-weight:900;color:#1e1e1e;font-family:'Arial Black',Arial,sans-serif;line-height:1;">${num}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
  }).join('\n  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>')

  // ── BLOG CARDS ────────────────────────────────────────────────────────────
  const blogBlock = blogs.length > 0 ? `
  <!-- ═══ FIELD NOTES ═══ -->
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>
  <tr>
    <td style="background:#c8922a;padding:14px 40px;">
      <span style="font-size:13px;font-weight:900;color:#000000;letter-spacing:3px;text-transform:uppercase;font-family:'Arial Black',Arial,sans-serif;">FIELD NOTES</span>
      <span style="font-size:10px;color:rgba(0,0,0,0.5);margin-left:12px;font-family:'Courier New',monospace;">ANALYSIS &amp; EDITORIAL</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>
  ${blogs.map((b, i) => {
    const url = `https://downrangeco.com/blog/${b.slug?.current || ''}`
    const img = b.heroImage?.asset?.url || b.imageUrl
    const isFirst = i === 0
    return `
  <tr>
    <td style="background:#111111;padding:0 0 2px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${img && isFirst ? `<td style="padding:0;vertical-align:top;" width="200"><img src="${img}" width="200" alt="${safeText(b.title)}" style="display:block;width:200px;height:140px;object-fit:cover;border:0;" /></td>` : ''}
          <td style="padding:24px 28px;vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:10px;color:#c8922a;letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">EDITORIAL</p>
            <a href="${url}" style="font-size:${isFirst ? '18px' : '15px'};font-weight:800;color:#ffffff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:8px;">${safeText(b.title)}</a>
            <p style="margin:0 0 12px;font-size:13px;color:#777777;line-height:1.6;font-family:Arial,sans-serif;">${safeText(truncate(b.summary || '', 110))}</p>
            <a href="${url}" style="font-size:12px;color:#c8922a;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;border-bottom:1px solid rgba(200,146,42,0.4);padding-bottom:1px;">Read the full article &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>`
  }).join('')}` : ''

  // ── DEALS STRIP ───────────────────────────────────────────────────────────
  const dealBlock = deals.length > 0 ? (() => {
    const top4 = deals.slice(0, 4)
    const dealCells = top4.map(d => {
      const pct = d.savings ? Math.round(d.savings)
        : (d.originalPrice && d.dealPrice ? Math.round((1 - d.dealPrice / d.originalPrice) * 100) : 0)
      const saved = (d.originalPrice && d.dealPrice) ? (d.originalPrice - d.dealPrice).toFixed(2) : null
      const img = d.imageUrl
      return `
        <td width="${Math.floor(100 / top4.length)}%" style="padding:0 1px 0 0;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;">
            <tr>
              <td style="padding:0;">
                ${img
                  ? `<img src="${img}" width="160" alt="${safeText(d.title)}" style="display:block;width:100%;height:100px;object-fit:cover;border:0;" />`
                  : `<div style="height:100px;background:#1a1a1a;display:block;"></div>`}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 14px 18px;">
                ${pct > 0 ? `<span style="display:inline-block;background:#22c55e;color:#000;font-size:10px;font-weight:900;padding:3px 8px;font-family:Arial,sans-serif;margin-bottom:8px;">-${pct}%</span>` : ''}
                <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#ffffff;line-height:1.3;font-family:Arial,sans-serif;">${safeText(truncate(d.title, 50))}</p>
                <p style="margin:0 0 8px;font-size:10px;color:#666;font-family:Arial,sans-serif;">${safeText(d.retailer || '')}</p>
                <p style="margin:0;font-size:18px;font-weight:900;color:#c8922a;font-family:'Arial Black',Arial,sans-serif;line-height:1;">$${Number(d.dealPrice||0).toFixed(2)}</p>
                ${d.originalPrice ? `<p style="margin:2px 0 0;font-size:10px;color:#444;text-decoration:line-through;font-family:Arial,sans-serif;">$${Number(d.originalPrice).toFixed(2)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:0 14px 14px;">
                <a href="${d.url || 'https://downrangeco.com/deals'}" style="display:block;text-align:center;background:#c8922a;color:#000;padding:9px 0;font-size:10px;font-weight:900;letter-spacing:2px;text-decoration:none;font-family:'Arial Black',Arial,sans-serif;border-bottom:2px solid #7a5010;">GET DEAL &rarr;</a>
              </td>
            </tr>
          </table>
        </td>`
    }).join('')
    return `
  <!-- ═══ ARMORY DEALS ═══ -->
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>
  <tr>
    <td style="background:#c8922a;padding:14px 40px;">
      <span style="font-size:13px;font-weight:900;color:#000000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">ARMORY DEALS</span>
      <span style="font-size:10px;color:rgba(0,0,0,0.5);margin-left:12px;font-family:'Courier New',monospace;">BEST PRICES TODAY</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>
  <tr>
    <td style="background:#0d0d0d;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${dealCells}</tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>
  <tr>
    <td style="background:#111111;padding:16px 40px;">
      <a href="https://downrangeco.com/deals" style="display:inline-block;border:1px solid #c8922a;color:#c8922a;padding:10px 24px;text-decoration:none;font-weight:900;letter-spacing:2px;font-size:11px;font-family:'Courier New',monospace;">VIEW ALL DEALS &rarr;</a>
    </td>
  </tr>`
  })() : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>DownRange Daily &mdash; ${shortDate}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:640px) {
      .mobile-full { width:100% !important; display:block !important; }
      .mobile-hide { display:none !important; }
      .mobile-pad { padding:20px 20px !important; }
      .mobile-text-lg { font-size:22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;word-break:break-word;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;color:#0d0d0d;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">DownRange Daily &mdash; ${shortDate} &mdash; Your 2A Intelligence Brief &mdash; ${news.length} stories inside</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;">
<tr><td align="center" style="padding:24px 12px 40px;">

<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

  ${isTest ? `
  <tr>
    <td style="background:#b91c1c;padding:12px 40px;text-align:center;">
      <span style="font-size:11px;font-weight:900;color:#ffffff;letter-spacing:3px;font-family:'Courier New',monospace;">&#9888; TEST EMAIL &mdash; NOT SENT TO SUBSCRIBERS &#9888;</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>` : ''}

  <!-- ═══ MASTHEAD ═══ -->
  <tr>
    <td style="background:#111111;padding:0;">
      <!-- Top gold rule -->
      <div style="height:4px;background:#c8922a;"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="https://downrangeco.com/img/logo.png" width="280" alt="DownRange Co." style="display:block;max-width:280px;height:auto;border:0;" />
                </td>
                <td style="vertical-align:middle;text-align:right;">
                  <p style="margin:0;font-size:10px;color:#444444;letter-spacing:2px;font-family:'Courier New',monospace;text-transform:uppercase;">Intelligence Brief</p>
                  <p style="margin:4px 0 2px;font-size:15px;font-weight:900;color:#c8922a;font-family:'Courier New',monospace;white-space:nowrap;">${dateStr}</p>
                  <p style="margin:0;font-size:10px;color:#333333;font-family:'Courier New',monospace;">Issue #${issueNum} &nbsp;&middot;&nbsp; ${dayOfWeek}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Headline bar -->
        <tr>
          <td style="background:#0d0d0d;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a1a;padding:12px 40px;border-top:1px solid #222;border-bottom:1px solid #222;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:10px;color:#555;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">
                        <span style="color:#c8922a;">&#9679;</span> FIREARMS &nbsp;&middot;&nbsp; LEGISLATION &nbsp;&middot;&nbsp; COURTS &nbsp;&middot;&nbsp; MARKETS &nbsp;&middot;&nbsp; INDUSTRY
                      </td>
                      <td style="text-align:right;font-size:10px;color:#444;font-family:'Courier New',monospace;white-space:nowrap;">
                        ${news.length} STORIES
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>

  <!-- ═══ SITUATION REPORT ═══ -->
  <tr>
    <td style="background:#111111;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#c8922a;padding:3px 40px;"></td>
        </tr>
        <tr>
          <td style="padding:28px 40px 28px 44px;border-left:4px solid #c8922a;">
            <p style="margin:0 0 6px;font-size:10px;color:#c8922a;letter-spacing:3px;font-weight:700;font-family:'Courier New',monospace;">&#9632; SITUATION REPORT &mdash; ${dayOfWeek}</p>
            <p style="margin:0;font-size:15px;color:#bbbbbb;line-height:1.85;font-family:Arial,sans-serif;"><strong style="color:#ffffff;">Locked and loaded.</strong> This is your ${dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()} intelligence package &mdash; <strong style="color:#c8922a;">${news.length} breaking stories</strong> ranked by urgency, the latest editorial from the DownRange team, and today&rsquo;s hottest gear deals. Everything you need to stay ahead of the 2A landscape.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:8px;background:#0d0d0d;"></td></tr>

  ${news.length > 0 ? `
  <!-- ═══ BREAKING INTEL HEADER ═══ -->
  <tr>
    <td style="background:#c8922a;padding:14px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:14px;font-weight:900;color:#000000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">BREAKING INTEL</span></td>
        <td style="text-align:right;"><span style="font-size:10px;color:rgba(0,0,0,0.5);font-family:'Courier New',monospace;">${news.length} STORIES &middot; ${shortDate}</span></td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>

  ${leadBlock}
  ${gridStories}
  ${listStories}` : ''}

  ${blogBlock}
  ${dealBlock}

  <!-- ═══ PORTAL CTA ═══ -->
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>
  <tr>
    <td style="background:#111111;padding:48px 40px;text-align:center;border-top:3px solid #c8922a;">
      <p style="margin:0 0 4px;font-size:10px;color:#c8922a;letter-spacing:3px;font-weight:700;font-family:'Courier New',monospace;">STAY LOCKED IN</p>
      <h2 style="margin:8px 0 16px;font-size:30px;font-weight:900;color:#ffffff;font-family:'Arial Black',Arial,sans-serif;text-transform:uppercase;letter-spacing:-0.5px;">Real-time 2A Intelligence</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#666666;font-family:Arial,sans-serif;line-height:1.7;">State laws &middot; Court rulings &middot; Market data &middot; Breaking news<br>All in one place. Free. Unfiltered. Yours.</p>
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://downrangeco.com" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="0%" strokecolor="#7a5010" fillcolor="#c8922a"><w:anchorlock/><center style="color:#000000;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:3px;">VISIT DOWNRANGE</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="https://downrangeco.com" style="display:inline-block;background:#c8922a;color:#000000;padding:16px 52px;text-decoration:none;font-weight:900;letter-spacing:3px;text-transform:uppercase;font-size:13px;font-family:'Arial Black',Arial,sans-serif;border-bottom:4px solid #7a5010;mso-hide:all;">VISIT DOWNRANGE &rarr;</a>
      <!--<![endif]-->
    </td>
  </tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="height:2px;background:#c8922a;"></td></tr>
  <tr>
    <td style="background:#0a0a0a;padding:32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:16px;border-bottom:1px solid #1a1a1a;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><img src="https://downrangeco.com/img/logo.png" width="120" alt="DownRange" style="display:block;height:auto;border:0;opacity:0.5;" /></td>
              <td style="text-align:right;vertical-align:middle;">
                <span style="font-size:10px;color:#333;font-family:'Courier New',monospace;letter-spacing:1px;">ISSUE #${issueNum} &middot; ${shortDate}</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;font-family:Arial,sans-serif;">
              <a href="https://downrangeco.com" style="color:#444444;text-decoration:none;margin:0 10px;">Portal</a>
              <span style="color:#222;">&middot;</span>
              <a href="https://downrangeco.com/deals" style="color:#444444;text-decoration:none;margin:0 10px;">Deals</a>
              <span style="color:#222;">&middot;</span>
              <a href="https://downrangeco.com/laws" style="color:#444444;text-decoration:none;margin:0 10px;">State Laws</a>
              <span style="color:#222;">&middot;</span>
              <a href="https://downrangeco.com/unsubscribe" style="color:#444444;text-decoration:none;margin:0 10px;">Unsubscribe</a>
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#2a2a2a;font-family:'Courier New',monospace;letter-spacing:2px;">STAY ARMED. STAY INFORMED. STAY DOWNRANGE.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
