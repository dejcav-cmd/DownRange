// app/api/newsletter/test/route.js
// Send test welcome email for admin testing

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name } = await req.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    const welcomeHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
    .wrapper { background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); padding: 60px 40px; text-align: center; border-bottom: 2px solid #c8922a; }
    .logo { font-family: 'Courier New', monospace; font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #c8922a; margin-bottom: 20px; text-shadow: 0 2px 8px rgba(200,146,42,0.3); }
    .tagline { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 4px; color: #7a6b5a; text-transform: uppercase; margin-bottom: 30px; }
    .content { padding: 50px 40px; }
    .greeting { font-size: 20px; color: #e0e0e0; margin-bottom: 24px; line-height: 1.6; }
    .greeting strong { color: #c8922a; }
    .mission { background: rgba(200,146,42,0.08); border-left: 4px solid #c8922a; padding: 24px; margin: 30px 0; border-radius: 4px; }
    .mission-title { font-size: 13px; font-family: 'Courier New', monospace; letter-spacing: 2px; color: #c8922a; text-transform: uppercase; margin-bottom: 12px; font-weight: 700; }
    .mission-text { font-size: 14px; color: #b0b0b0; line-height: 1.8; }
    .mission-text strong { color: #e0e0e0; }
    .features { margin: 40px 0; }
    .feature-title { font-size: 13px; font-family: 'Courier New', monospace; letter-spacing: 2px; color: #c8922a; text-transform: uppercase; margin-bottom: 16px; font-weight: 700; }
    .feature-list { display: flex; flex-direction: column; gap: 14px; }
    .feature-item { display: flex; gap: 12px; }
    .feature-icon { color: #c8922a; font-size: 18px; flex-shrink: 0; }
    .feature-text { color: #b0b0b0; font-size: 14px; line-height: 1.6; }
    .cta-section { margin-top: 40px; text-align: center; }
    .cta-button { display: inline-block; background: #c8922a; color: #000; padding: 14px 40px; text-decoration: none; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; border-radius: 4px; transition: all 0.3s; box-shadow: 0 8px 24px rgba(200,146,42,0.25); font-family: 'Barlow Condensed', sans-serif; }
    .cta-button:hover { background: #e0a851; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(200,146,42,0.35); }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent); margin: 30px 0; }
    .footer { background: #0a0a0a; padding: 30px 40px; text-align: center; border-top: 1px solid #2a2a2a; }
    .footer-text { font-size: 12px; color: #666; line-height: 1.8; font-family: 'Courier New', monospace; }
    .footer-link { color: #c8922a; text-decoration: none; }
    .footer-link:hover { text-decoration: underline; }
    .break { height: 3px; background: linear-gradient(90deg, transparent, #c8922a, transparent); margin: 24px 0; }
    .test-badge { display: inline-block; background: #f59e0b; color: #000; padding: 4px 12px; font-size: 11px; font-weight: 700; border-radius: 4px; margin-bottom: 16px; letter-spacing: 1px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div style="margin-bottom:12px;"><span class="test-badge">📧 TEST EMAIL</span></div>
        <div class="logo">◈ DR ◈</div>
        <div class="tagline">FIREARMS & 2A INTELLIGENCE</div>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="greeting">
          Welcome to <strong>DownRange</strong>, ${name || 'Operator'}.
        </div>

        <p style="font-size: 14px; color: #b0b0b0; line-height: 1.8; margin-bottom: 24px;">
          You're now locked in to the most comprehensive Second Amendment intelligence platform. Every morning at 7 AM, we deliver curated breaking news, legislative updates, market analysis, and industry intelligence directly to your inbox.
        </p>

        <!-- MISSION -->
        <div class="mission">
          <div class="mission-title">📍 Our Mission</div>
          <div class="mission-text">
            <strong>DownRange</strong> exists to arm the community with real-time intelligence. We monitor federal and state legislation, track judicial developments, analyze market trends, and report on threats to your Second Amendment rights. In a landscape of censorship and misinformation, we provide <strong>unfiltered, comprehensive coverage</strong> from sources across the political spectrum.
            <br><br>
            Whether you're a firearms enthusiast, legal professional, business owner, or advocate—DownRange keeps you informed and ahead of the curve.
          </div>
        </div>

        <div class="break"></div>

        <!-- FEATURES -->
        <div class="features">
          <div class="feature-title">What You Get</div>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">🔴</div>
              <div class="feature-text"><strong>Breaking Alerts</strong> — Immediate notification on major news and developments</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📰</div>
              <div class="feature-text"><strong>Daily Briefing</strong> — Curated news, legislation, and analysis every morning</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🗺️</div>
              <div class="feature-text"><strong>State Laws</strong> — Comprehensive CCW, NFA, and regulatory tracking by state</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💰</div>
              <div class="feature-text"><strong>Market Intel</strong> — Ammunition pricing, deals, and industry trends</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⚖️</div>
              <div class="feature-text"><strong>Legal Updates</strong> — Supreme Court decisions, litigation tracking, and case analysis</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🎯</div>
              <div class="feature-text"><strong>Threat Assessment</strong> — Real-time monitoring of threats to your rights</div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- CTA -->
        <div class="cta-section">
          <a href="https://downrangeco.com" class="cta-button">VISIT DOWNRANGE</a>
        </div>

        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 24px; font-family: 'Courier New', monospace; letter-spacing: 0.5px;">
          Stay armed. Stay informed. <strong>Stay DownRange.</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-text">
          <div style="margin-bottom: 12px;">
            Questions? <a href="https://downrangeco.com/contact" class="footer-link">Contact us</a> — 
            <a href="https://downrangeco.com/unsubscribe" class="footer-link">Unsubscribe</a>
          </div>
          <div style="opacity: 0.7;">
            DownRange Co. | Second Amendment Intelligence Platform<br>
            Your source for unfiltered news and analysis.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `

    const resend = getResend()
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'DownRange <news@downrangeco.com>',
        to: email,
        subject: '🔫 [TEST] Welcome to DownRange — Your Daily 2A Intelligence Briefing',
        html: welcomeHTML,
      }).catch(err => console.error('Test email error:', err.message))
    }

    return Response.json({ success: true, message: `Test email sent to ${email}` })
  } catch (err) {
    console.error('[newsletter/test] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
