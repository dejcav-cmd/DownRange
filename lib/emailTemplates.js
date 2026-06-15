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
        <img src="https://downrangeco.com/img/logo.png" width="280" height="82" alt="DownRange" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
        <p style="margin:20px 0 0;font-size:11px;letter-spacing:3px;color:#666;text-transform:uppercase;font-family:'Courier New',monospace;">PRESS KIT &middot; MEDIA RESOURCES &middot; 2026</p>
      </td>
    </tr>

    <!-- HERO HEADLINE -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px 40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">YOU&rsquo;RE IN</p>
        <h1 style="margin:0 0 28px;font-size:48px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;letter-spacing:-1px;">WELCOME TO<br><span style="color:#c8922a;">DOWNRANGE.</span></h1>
        <p style="margin:0;font-size:16px;color:#cccccc;line-height:1.8;">DownRange is an independent firearms and Second Amendment intelligence platform headquartered in Washington State. You&rsquo;re now receiving curated intelligence every morning&mdash;direct to your inbox.</p>
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
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Curated news, legislation, and analysis every morning</p>
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
        <a href="https://downrangeco.com" style="display:inline-block;background:#c8922a;color:#000000;padding:16px 48px;text-decoration:none;font-weight:900;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-family:'Arial Black','Arial',sans-serif;">VISIT DOWNRANGE &rarr;</a>
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
  const { news, blogs, deals } = data
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; background: #0a0a0a; color: #e0e0e0; }
    .wrapper { background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); padding: 40px 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
    
    /* HEADER */
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); padding: 50px 40px; text-align: center; border-bottom: 3px solid #c8922a; }
    ${isTest ? '.test-badge { display: inline-block; background: #ff6b6b; color: #fff; padding: 6px 12px; border-radius: 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }' : ''}
    .logo-container { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .logo { font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 6px; color: #c8922a; text-shadow: 0 2px 8px rgba(200,146,42,0.3); }
    .divider-gold { width: 60px; height: 2px; background: #c8922a; }
    .date-badge { display: inline-block; background: rgba(200,146,42,0.15); color: #c8922a; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 16px; font-family: 'Courier New', monospace; }
    
    /* CONTENT */
    .content { padding: 40px; }
    .intro { font-size: 16px; color: #b0b0b0; line-height: 1.6; margin-bottom: 40px; }
    .intro strong { color: #c8922a; }
    
    /* SECTION */
    .section { margin-bottom: 50px; }
    .section-title { font-size: 18px; font-weight: 800; color: #fff; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 12px; border-bottom: 2px solid #c8922a; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .section-icon { font-size: 24px; }
    
    /* NEWS CARDS */
    .news-grid { display: flex; flex-direction: column; gap: 20px; }
    .news-card { background: rgba(200,146,42,0.08); border-left: 4px solid #c8922a; padding: 20px; border-radius: 4px; transition: all 0.3s; text-decoration: none; color: inherit; display: block; }
    .news-rank { display: inline-block; background: #c8922a; color: #000; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 12px; margin-bottom: 8px; }
    .news-cat { font-size: 11px; color: #c8922a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
    .news-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 10px; line-height: 1.4; }
    .news-summary { font-size: 14px; color: #a0a0a0; line-height: 1.6; margin-bottom: 12px; }
    .news-meta { font-size: 12px; color: #777; display: flex; gap: 16px; }
    .news-meta a { color: #c8922a; text-decoration: none; font-weight: 600; }
    
    /* BLOG CARDS */
    .blog-grid { display: flex; flex-direction: column; gap: 18px; }
    .blog-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; overflow: hidden; transition: all 0.3s; text-decoration: none; color: inherit; display: block; }
    .blog-image { width: 100%; height: 120px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); display: flex; align-items: center; justify-content: center; color: #666; font-size: 48px; }
    .blog-content { padding: 16px; }
    .blog-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.3; }
    .blog-summary { font-size: 13px; color: #a0a0a0; line-height: 1.5; margin-bottom: 10px; }
    .blog-cta { color: #c8922a; font-weight: 600; margin-top: 8px; }
    
    /* DEALS */
    .deals-grid { display: flex; flex-direction: column; gap: 16px; }
    .deal-card { background: #1a1a1a; border: 1px solid #c8922a; border-radius: 4px; padding: 16px; display: flex; gap: 16px; transition: all 0.3s; text-decoration: none; color: inherit; }
    .deal-badge { background: #c8922a; color: #000; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: 700; white-space: nowrap; height: fit-content; }
    .deal-info { flex: 1; }
    .deal-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .deal-retailer { font-size: 12px; color: #999; margin-bottom: 8px; }
    .deal-price { font-size: 18px; font-weight: 800; color: #c8922a; }
    .deal-original { font-size: 12px; color: #777; text-decoration: line-through; margin-left: 8px; }
    .deal-savings { font-size: 12px; color: #4ade80; font-weight: 600; }
    
    /* FOOTER */
    .footer { background: #0a0a0a; padding: 30px 40px; text-align: center; border-top: 1px solid #2a2a2a; }
    .footer-text { font-size: 12px; color: #666; line-height: 1.8; font-family: 'Courier New', monospace; }
    .footer-link { color: #c8922a; text-decoration: none; font-weight: 600; }
    .footer-divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent); margin: 20px 0; }
    .cta-button { display: inline-block; background: #c8922a; color: #000; padding: 12px 30px; text-decoration: none; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; border-radius: 4px; margin: 20px auto; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        ${isTest ? '<div class="test-badge">⚠️ TEST EMAIL</div>' : ''}
        <div class="logo-container">
          <div class="divider-gold"></div>
          <div class="logo">DR</div>
          <div class="divider-gold"></div>
        </div>
        <div style="font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 2px; color: #999; text-transform: uppercase;">Daily Intelligence Brief</div>
        <div class="date-badge">${todayDate}</div>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="intro">
          <strong>Stay Armed. Stay Informed.</strong> Your curated Second Amendment intelligence briefing. The latest 2A news, policy analysis, market data, and industry trends—delivered to your inbox.
        </div>

        <!-- TOP NEWS SECTION -->
        ${news && news.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">🔴</span>
            TOP BREAKING NEWS
          </div>
          <div class="news-grid">
            ${news.map((article, idx) => `
            <a href="https://downrangeco.com/news/${article.slug?.current || '#'}" class="news-card" style="color: #e0e0e0;">
              <div class="news-rank">${idx + 1}</div>
              <div class="news-cat">${article.category || 'NEWS'}</div>
              <div class="news-title">${article.title}</div>
              <div class="news-summary">${article.summary || article.title} Learn what this means for your rights and the 2A community.</div>
              <div class="news-meta">
                <span>${new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <a href="https://downrangeco.com/news/${article.slug?.current || '#'}">READ FULL ANALYSIS →</a>
              </div>
            </a>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- LATEST ARTICLES SECTION -->
        ${blogs && blogs.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">✍️</span>
            LATEST ARTICLES
          </div>
          <div class="blog-grid">
            ${blogs.map(article => `
            <a href="https://downrangeco.com/blog/${article.slug?.current || '#'}" class="blog-card" style="color: #e0e0e0;">
              <div class="blog-image">📰</div>
              <div class="blog-content">
                <div class="blog-title">${article.title}</div>
                <div class="blog-summary">${article.summary || 'Deep dive into the latest in firearms, legislation, and 2A news.'}</div>
                <div class="blog-cta">READ ARTICLE →</div>
              </div>
            </a>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- DEALS SECTION -->
        ${deals && deals.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">🔥</span>
            HOTTEST DEALS
          </div>
          <div class="deals-grid">
            ${deals.slice(0, 4).map(deal => {
              const savings = deal.savings ? Math.round(deal.savings) : Math.round((1 - deal.dealPrice / deal.originalPrice) * 100)
              return `
              <a href="${deal.url || '#'}" class="deal-card" style="color: #e0e0e0;">
                <div class="deal-badge">-${savings}%</div>
                <div class="deal-info">
                  <div class="deal-title">${deal.title}</div>
                  <div class="deal-retailer">${deal.retailer}</div>
                  <div>
                    <span class="deal-price">$${deal.dealPrice?.toFixed(2) || 'N/A'}</span>
                    <span class="deal-original">$${deal.originalPrice?.toFixed(2) || 'N/A'}</span>
                    <span class="deal-savings">SAVE $${(deal.originalPrice - deal.dealPrice).toFixed(2)}</span>
                  </div>
                </div>
              </a>
              `
            }).join('')}
          </div>
          <a href="https://downrangeco.com/deals" class="cta-button" style="color: #000;">BROWSE ALL DEALS</a>
        </div>
        ` : ''}
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-text">
          <strong>DownRange Daily</strong> — Your Second Amendment Intelligence Portal
          <div class="footer-divider"></div>
          <div style="margin: 12px 0;">
            <a href="https://downrangeco.com" class="footer-link">Visit DownRange</a> • 
            <a href="https://downrangeco.com/unsubscribe" class="footer-link">Unsubscribe</a> • 
            <a href="https://downrangeco.com/contact" class="footer-link">Contact</a>
          </div>
          <div style="margin-top: 16px; color: #555;">
            You're receiving this because you subscribed to DownRange Daily.<br>
            Stay armed. Stay informed. Stay DownRange.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}
