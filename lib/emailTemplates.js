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
  const issueNum = Math.floor((now - new Date('2026-01-01')) / (1000 * 60 * 60 * 24)) + 1

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  const safeText = (s = '') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const categoryColor = (cat = '') => {
    const c = cat.toLowerCase()
    if (c.includes('legal') || c.includes('court')) return '#ef4444'
    if (c.includes('legislat') || c.includes('law')) return '#f97316'
    if (c.includes('market') || c.includes('deal')) return '#22c55e'
    if (c.includes('breaking')) return '#ef4444'
    return '#c8922a'
  }

  // ─── NEWS ROWS ──────────────────────────────────────────────────────────────
  const newsRows = news.slice(0, 6).map((a, i) => {
    const cat = (a.category || 'NEWS').toUpperCase()
    const color = categoryColor(a.category)
    const isLead = i === 0
    const url = `https://downrangeco.com/news/${a.slug?.current || ''}`
    if (isLead) {
      return `
    <!-- LEAD STORY -->
    <tr>
      <td style="padding:0 0 2px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 40px;background:#111111;border-left:4px solid ${color};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:10px;">
                    <span style="display:inline-block;background:${color};color:#000;padding:4px 10px;font-size:10px;font-weight:900;letter-spacing:2px;font-family:Arial,sans-serif;margin-right:10px;">${safeText(cat)}</span>
                    <span style="font-size:10px;color:#666;letter-spacing:1px;font-family:'Courier New',monospace;">LEAD STORY</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <a href="${url}" style="font-size:26px;font-weight:900;color:#ffffff;text-decoration:none;line-height:1.2;font-family:'Arial Black',Arial,sans-serif;display:block;">${safeText(a.title)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.7;">${safeText(a.summary || '')}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${url}" style="display:inline-block;background:#c8922a;color:#000000;padding:10px 24px;text-decoration:none;font-weight:900;letter-spacing:2px;font-size:11px;font-family:'Arial Black',Arial,sans-serif;">READ FULL STORY &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;background:#1a1a1a;"></td></tr>`
    }
    return `
    <!-- STORY ${i + 1} -->
    <tr>
      <td style="padding:0 0 2px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:20px 40px;background:#111111;border-left:4px solid ${color};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" style="vertical-align:top;padding-right:16px;padding-top:2px;">
                    <div style="width:28px;height:28px;background:#1a1a1a;border:1px solid #333;text-align:center;line-height:28px;font-size:12px;font-weight:900;color:#c8922a;font-family:'Courier New',monospace;">${i + 1}</div>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;color:${color};letter-spacing:2px;font-weight:700;font-family:Arial,sans-serif;">${safeText(cat)}</p>
                    <a href="${url}" style="font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;line-height:1.35;font-family:Arial,sans-serif;display:block;margin-bottom:6px;">${safeText(a.title)}</a>
                    <a href="${url}" style="font-size:11px;color:#c8922a;text-decoration:none;font-weight:700;letter-spacing:1px;font-family:'Courier New',monospace;">READ MORE &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;background:#1a1a1a;"></td></tr>`
  }).join('')

  // ─── BLOG ROWS ──────────────────────────────────────────────────────────────
  const blogRows = blogs.slice(0, 3).map((b, i) => {
    const url = `https://downrangeco.com/blog/${b.slug?.current || ''}`
    return `
    <tr>
      <td style="padding:0 0 2px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:22px 40px;background:#111111;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48" style="vertical-align:top;padding-right:20px;padding-top:2px;">
                    <div style="width:40px;height:40px;background:#c8922a;text-align:center;line-height:40px;font-size:18px;">✍️</div>
                  </td>
                  <td style="vertical-align:top;">
                    <a href="${url}" style="font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;line-height:1.35;font-family:Arial,sans-serif;display:block;margin-bottom:6px;">${safeText(b.title)}</a>
                    <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;">${safeText(b.summary || 'Deep dive analysis from the DownRange intelligence team.')}</p>
                    <a href="${url}" style="font-size:11px;color:#c8922a;text-decoration:none;font-weight:700;letter-spacing:1px;font-family:'Courier New',monospace;">READ ARTICLE &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;background:#1a1a1a;"></td></tr>`
  }).join('')

  // ─── DEAL ROWS ──────────────────────────────────────────────────────────────
  const dealRows = deals.slice(0, 4).map(d => {
    const pct = d.savings ? Math.round(d.savings) : (d.originalPrice && d.dealPrice ? Math.round((1 - d.dealPrice / d.originalPrice) * 100) : 0)
    const saved = (d.originalPrice && d.dealPrice) ? (d.originalPrice - d.dealPrice).toFixed(2) : null
    return `
    <tr>
      <td style="padding:0 0 2px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:18px 40px;background:#111111;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="${d.url || 'https://downrangeco.com/deals'}" style="text-decoration:none;">
                      <p style="margin:0 0 3px;font-size:14px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;">${safeText(d.title)}</p>
                      <p style="margin:0;font-size:12px;color:#666666;font-family:Arial,sans-serif;">${safeText(d.retailer || '')}</p>
                    </a>
                  </td>
                  <td width="160" style="vertical-align:middle;text-align:right;">
                    <span style="font-size:22px;font-weight:900;color:#c8922a;font-family:'Arial Black',Arial,sans-serif;">$${Number(d.dealPrice||0).toFixed(2)}</span>
                    ${d.originalPrice ? `<br><span style="font-size:12px;color:#555555;text-decoration:line-through;font-family:Arial,sans-serif;">$${Number(d.originalPrice).toFixed(2)}</span>` : ''}
                    ${pct > 0 ? `<span style="display:inline-block;background:#22c55e;color:#000;font-size:10px;font-weight:900;padding:2px 6px;margin-left:4px;font-family:Arial,sans-serif;">-${pct}%</span>` : ''}
                    ${saved ? `<br><span style="font-size:11px;color:#22c55e;font-family:Arial,sans-serif;">SAVE $${saved}</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;background:#1a1a1a;"></td></tr>`
  }).join('')

  // ─── SECTION HEADER ─────────────────────────────────────────────────────────
  const sectionHeader = (label, sub = '') => `
    <tr>
      <td style="padding:0 0 2px 0;background:#c8922a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 40px;">
              <span style="font-size:13px;font-weight:900;color:#000000;letter-spacing:3px;text-transform:uppercase;font-family:'Arial Black',Arial,sans-serif;">${label}</span>
              ${sub ? `<span style="font-size:11px;color:rgba(0,0,0,0.6);margin-left:12px;font-family:'Courier New',monospace;">${sub}</span>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;background:#1a1a1a;"></td></tr>`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DownRange Daily — ${dateStr}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0d0d0d;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

  ${isTest ? `
  <!-- TEST BADGE -->
  <tr>
    <td style="background:#ef4444;padding:10px 40px;text-align:center;">
      <span style="font-size:11px;font-weight:900;color:#ffffff;letter-spacing:3px;font-family:'Courier New',monospace;">⚠ TEST EMAIL — NOT SENT TO SUBSCRIBERS ⚠</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#1a1a1a;"></td></tr>` : ''}

  <!-- MASTHEAD -->
  <tr>
    <td style="background:#111111;padding:40px 40px 32px;border-bottom:3px solid #c8922a;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="https://downrangeco.com/img/logo.png" width="220" alt="DownRange Co." style="display:block;height:auto;border:0;" />
          </td>
          <td style="vertical-align:middle;text-align:right;">
            <p style="margin:0 0 2px;font-size:10px;color:#666;letter-spacing:2px;font-family:'Courier New',monospace;text-transform:uppercase;">INTELLIGENCE BRIEF</p>
            <p style="margin:0 0 2px;font-size:13px;font-weight:900;color:#c8922a;font-family:'Courier New',monospace;">${dateStr}</p>
            <p style="margin:0;font-size:10px;color:#444;font-family:'Courier New',monospace;">ISSUE #${issueNum}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#1a1a1a;"></td></tr>

  <!-- SITUATION REPORT -->
  <tr>
    <td style="background:#1a1a1a;padding:28px 40px;border-left:4px solid #c8922a;">
      <p style="margin:0 0 6px;font-size:10px;color:#c8922a;letter-spacing:3px;font-weight:700;font-family:'Courier New',monospace;">SITUATION REPORT</p>
      <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.8;font-family:Arial,sans-serif;">Your daily intelligence briefing on Second Amendment news, legislation, market data, and threats to your rights. ${news.length} stories curated from ${news.length > 0 ? 'across the country' : 'the wire'} — filtered, ranked, and ready.</p>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0d0d0d;"></td></tr>

  ${news.length > 0 ? `
  ${sectionHeader('BREAKING INTEL', `${news.length} STORIES`)}
  ${newsRows}
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>` : ''}

  ${blogs.length > 0 ? `
  ${sectionHeader('FIELD NOTES', 'ANALYSIS & EDITORIAL')}
  ${blogRows}
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>` : ''}

  ${deals.length > 0 ? `
  ${sectionHeader('ARMORY DEALS', 'BEST PRICES TODAY')}
  ${dealRows}

  <!-- VIEW ALL DEALS -->
  <tr>
    <td style="background:#111111;padding:20px 40px;">
      <a href="https://downrangeco.com/deals" style="display:inline-block;background:transparent;color:#c8922a;padding:10px 24px;text-decoration:none;font-weight:900;letter-spacing:2px;font-size:11px;font-family:'Arial Black',Arial,sans-serif;border:1px solid #c8922a;">VIEW ALL DEALS &rarr;</a>
    </td>
  </tr>
  <tr><td style="height:16px;background:#0d0d0d;"></td></tr>` : ''}

  <!-- PORTAL CTA -->
  <tr>
    <td style="background:#111111;padding:48px 40px;text-align:center;border-top:1px solid #1e1e1e;">
      <p style="margin:0 0 6px;font-size:10px;color:#c8922a;letter-spacing:3px;font-weight:700;font-family:'Courier New',monospace;">STAY LOCKED IN</p>
      <h2 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#ffffff;font-family:'Arial Black',Arial,sans-serif;text-transform:uppercase;letter-spacing:-0.5px;">Real-time 2A Intelligence</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#888888;font-family:Arial,sans-serif;line-height:1.7;max-width:400px;margin-left:auto;margin-right:auto;">State laws, court rulings, market data, and breaking news — all in one place. Free. Unfiltered. Yours.</p>
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://downrangeco.com" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="0%" strokecolor="#8a6018" fillcolor="#c8922a"><w:anchorlock/><center style="color:#000000;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:3px;">VISIT DOWNRANGE</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="https://downrangeco.com" style="display:inline-block;background:#c8922a;color:#000000;padding:16px 48px;text-decoration:none;font-weight:900;letter-spacing:3px;text-transform:uppercase;font-size:13px;font-family:'Arial Black',Arial,sans-serif;border-bottom:4px solid #7a5010;mso-hide:all;">VISIT DOWNRANGE &rarr;</a>
      <!--<![endif]-->
    </td>
  </tr>
  <tr><td style="height:2px;background:#c8922a;"></td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0d0d0d;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;color:#444444;font-family:'Courier New',monospace;letter-spacing:1px;">DOWNRANGE CO. &middot; SECOND AMENDMENT INTELLIGENCE PLATFORM</p>
      <p style="margin:0 0 16px;font-size:10px;color:#333333;font-family:'Courier New',monospace;">You're receiving this because you subscribed at downrangeco.com</p>
      <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;">
        <a href="https://downrangeco.com" style="color:#555555;text-decoration:none;margin:0 8px;">Portal</a>
        <span style="color:#333;">&middot;</span>
        <a href="https://downrangeco.com/unsubscribe" style="color:#555555;text-decoration:none;margin:0 8px;">Unsubscribe</a>
        <span style="color:#333;">&middot;</span>
        <a href="mailto:dj@downrangeco.com" style="color:#555555;text-decoration:none;margin:0 8px;">Contact</a>
      </p>
      <p style="margin:16px 0 0;font-size:10px;color:#2a2a2a;font-family:'Courier New',monospace;letter-spacing:2px;">STAY ARMED. STAY INFORMED. STAY DOWNRANGE.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
