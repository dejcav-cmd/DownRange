// lib/emailTemplates.js
// Shared email template generators

export function generateWelcomeEmailHTML() {
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
    .logo-container { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .logo { font-family: 'Courier New', monospace; font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #c8922a; text-shadow: 0 2px 8px rgba(200,146,42,0.3); }
    .divider-gold { width: 60px; height: 2px; background: #c8922a; }
    .tagline { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 3px; color: #999; text-transform: uppercase; margin-top: 16px; }
    
    /* CONTENT */
    .content { padding: 40px; }
    .welcome-section { margin-bottom: 40px; }
    .welcome-title { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 16px; line-height: 1.3; }
    .welcome-title .gold { color: #c8922a; }
    .welcome-text { font-size: 15px; color: #b0b0b0; line-height: 1.7; margin-bottom: 24px; }
    
    /* STATS SECTION */
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
    .stat-card { background: rgba(200,146,42,0.08); border: 1px solid #c8922a; border-radius: 6px; padding: 20px; text-align: center; }
    .stat-number { font-size: 28px; font-weight: 800; color: #c8922a; margin-bottom: 6px; }
    .stat-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    
    /* FEATURES SECTION */
    .features-section { margin-bottom: 40px; }
    .section-title { font-size: 13px; font-weight: 800; color: #fff; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 12px; border-bottom: 2px solid #c8922a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .section-icon { font-size: 18px; }
    
    .feature-list { display: flex; flex-direction: column; gap: 14px; }
    .feature-item { display: flex; gap: 12px; padding: 12px; background: rgba(200,146,42,0.05); border-left: 3px solid #c8922a; border-radius: 4px; }
    .feature-icon { font-size: 20px; flex-shrink: 0; }
    .feature-content { flex: 1; }
    .feature-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .feature-desc { font-size: 13px; color: #999; line-height: 1.5; }
    
    /* CTA SECTION */
    .cta-section { margin-bottom: 40px; padding: 24px; background: linear-gradient(135deg, rgba(200,146,42,0.15) 0%, rgba(200,146,42,0.05) 100%); border: 1px solid #c8922a; border-radius: 6px; text-align: center; }
    .cta-text { font-size: 14px; color: #b0b0b0; margin-bottom: 16px; line-height: 1.6; }
    .cta-button { display: inline-block; background: #c8922a; color: #000; padding: 14px 40px; text-decoration: none; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; border-radius: 4px; transition: all 0.3s; }
    .cta-button:hover { background: #e0a851; transform: translateY(-2px); }
    
    /* BENEFITS SECTION */
    .benefits-section { margin-bottom: 40px; padding: 20px; background: rgba(200,146,42,0.1); border-radius: 6px; border: 1px solid rgba(200,146,42,0.2); }
    .benefits-title { font-size: 13px; font-weight: 700; color: #c8922a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .benefit-item { font-size: 13px; color: #a0a0a0; margin-bottom: 8px; padding-left: 16px; position: relative; line-height: 1.5; }
    .benefit-item:before { content: '✓'; position: absolute; left: 0; color: #22c55e; font-weight: 700; }
    
    /* FOOTER */
    .footer { background: #0a0a0a; padding: 30px 40px; text-align: center; border-top: 1px solid #2a2a2a; }
    .footer-text { font-size: 12px; color: #666; line-height: 1.8; font-family: 'Courier New', monospace; }
    .footer-divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent); margin: 20px 0; }
    .footer-link { color: #c8922a; text-decoration: none; font-weight: 600; }
    .footer-link:hover { text-decoration: underline; }
    .footer-tagline { color: #555; margin-top: 16px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="logo-container">
          <div class="divider-gold"></div>
          <div class="logo">DR</div>
          <div class="divider-gold"></div>
        </div>
        <div class="tagline">🔫 Firearms & 2A Intelligence</div>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <!-- WELCOME -->
        <div class="welcome-section">
          <div class="welcome-title">Welcome to <span class="gold">DownRange</span>, Operator.</div>
          <div class="welcome-text">
            You've just joined the most comprehensive Second Amendment intelligence platform. We deliver real-time breaking news, legislative tracking, market analysis, and threat assessment—everything you need to stay armed and informed.
          </div>
          <div class="welcome-text">
            Starting tomorrow, your daily briefing arrives at 7am UTC. Stay ahead of the curve with unfiltered 2A news.
          </div>
        </div>

        <!-- STATS -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">50+</div>
            <div class="stat-label">News Sources</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">6</div>
            <div class="stat-label">Intelligence Feeds</div>
          </div>
        </div>

        <!-- WHAT YOU GET -->
        <div class="features-section">
          <div class="section-title">
            <span class="section-icon">📬</span>
            What You Get
          </div>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">🔴</div>
              <div class="feature-content">
                <div class="feature-name">Breaking Alerts</div>
                <div class="feature-desc">Immediate notification on major news and developments</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📰</div>
              <div class="feature-content">
                <div class="feature-name">Daily Briefing</div>
                <div class="feature-desc">Curated news, legislation, and analysis every morning</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📍</div>
              <div class="feature-content">
                <div class="feature-name">State Laws Tracker</div>
                <div class="feature-desc">Comprehensive CCW, NFA, and regulatory tracking</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💰</div>
              <div class="feature-content">
                <div class="feature-name">Market Intelligence</div>
                <div class="feature-desc">Ammunition pricing, deals, and industry trends</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⚖️</div>
              <div class="feature-content">
                <div class="feature-name">Legal Updates</div>
                <div class="feature-desc">Supreme Court decisions, litigation tracking, analysis</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🚨</div>
              <div class="feature-content">
                <div class="feature-name">Threat Assessment</div>
                <div class="feature-desc">Real-time monitoring of threats to your rights</div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-section">
          <div class="cta-text">
            Explore the full intelligence platform. Access state laws, market data, breaking news, and legal analysis all in one place.
          </div>
          <a href="https://downrangeco.com" class="cta-button">Visit DownRange →</a>
        </div>

        <!-- BENEFITS -->
        <div class="benefits-section">
          <div class="benefits-title">⚡ Why DownRange?</div>
          <div class="benefit-item">Unfiltered coverage from across the political spectrum</div>
          <div class="benefit-item">Real-time alerts on legislation and court decisions</div>
          <div class="benefit-item">Market data and deal alerts for shooters and collectors</div>
          <div class="benefit-item">Actionable intelligence for legal professionals and advocates</div>
          <div class="benefit-item">No paywalls. No gatekeeping. Just facts.</div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-text">
          <strong>DownRange</strong> — Your Second Amendment Intelligence Platform
          <div class="footer-divider"></div>
          <div style="margin: 12px 0;">
            <a href="https://downrangeco.com" class="footer-link">Visit Portal</a> • 
            <a href="https://downrangeco.com/unsubscribe" class="footer-link">Unsubscribe</a> • 
            <a href="https://downrangeco.com/contact" class="footer-link">Contact</a>
          </div>
          <div class="footer-tagline">
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
