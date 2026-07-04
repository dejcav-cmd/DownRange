// lib/emailTemplates.js
// Shared email template generators

export function generateWelcomeEmailHTML(name = '') {
  const operator = name ? name.split(' ')[0] : 'Operator'
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to DownRange</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#09090B;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- OUTER WRAPPER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090B;padding:32px 16px;">
<tr><td align="center">

<!-- CONTAINER -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ══ HEADER ══════════════════════════════════════════════════ -->
  <tr>
    <td style="background:#09090B;padding:48px 40px 36px;text-align:center;border-bottom:3px solid #C8922A;">

      <!-- Crosshair marks -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td width="20" style="border-top:2px solid #C8922A;border-left:2px solid #C8922A;height:16px;"></td>
          <td style="text-align:center;vertical-align:middle;padding:0 12px;">
            <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.3em;color:#4B5563;text-transform:uppercase;">◈ &nbsp; FIREARMS &amp; 2A INTELLIGENCE &nbsp; ◈</span>
          </td>
          <td width="20" style="border-top:2px solid #C8922A;border-right:2px solid #C8922A;height:16px;"></td>
        </tr>
      </table>

      <!-- Logo -->
      <img src="https://downrangeco.com/img/logo.png" alt="DownRange" width="460" style="display:block;margin:0 auto;max-width:460px;height:auto;border:0;" />
      <p style="margin:14px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;color:#4B5563;text-transform:uppercase;">CO. &nbsp;·&nbsp; WASHINGTON STATE &nbsp;·&nbsp; EST. 2026</p>

    </td>
  </tr>

  <!-- ══ CONFIRMATION HERO ════════════════════════════════════════ -->
  <tr>
    <td style="background:#0D0E12;padding:52px 40px 44px;">

      <p style="margin:0 0 14px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#C8922A;text-transform:uppercase;">◉ &nbsp; Intel Confirmed</p>

      <h1 style="margin:0 0 20px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:52px;font-weight:900;color:#F0EDE6;line-height:0.95;letter-spacing:0.02em;text-transform:uppercase;">YOU&rsquo;RE IN,<br><span style="color:#C8922A;">${operator}.</span></h1>

      <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:14px;color:#6B7280;line-height:1.85;">Thank you for subscribing. You just joined a growing community of gun owners, carriers, veterans, and 2A advocates who refuse to be uninformed. Every morning at 7&nbsp;AM, your intelligence briefing lands here.</p>

      <!-- Manifesto block — left gold border -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="3" style="background:#C8922A;">&nbsp;</td>
          <td style="padding:20px 0 20px 20px;">
            <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:15px;color:#F0EDE6;line-height:1.7;font-weight:700;">We believe the Second Amendment is not a privilege.</p>
            <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:14px;color:#9CA3AF;line-height:1.7;">It is not a hobby. It is not a talking point.</p>
            <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:14px;color:#9CA3AF;line-height:1.7;">It is a right &mdash; individual, fundamental, and non-negotiable.</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:14px;color:#C8922A;line-height:1.7;font-style:italic;">And rights require intelligence to defend.</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ══ FOUNDER QUOTE ════════════════════════════════════════════ -->
  <tr>
    <td style="background:#09090B;padding:44px 40px;border-top:1px solid #1F2428;border-bottom:1px solid #1F2428;">
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;color:#4B5563;text-transform:uppercase;">The Origin</p>
      <div style="width:40px;height:3px;background:#C8922A;margin:0 0 24px;"></div>

      <p style="margin:0 0 20px;font-family:'Courier New',monospace;font-size:15px;color:#F0EDE6;line-height:1.9;font-style:italic;">&ldquo;I was living in Washington State, carrying every day, and I couldn&rsquo;t keep up. New laws. New ATF rules. New magazine limits. Hostile press. Scattered data. I wanted one place that treated me like an adult who carries a firearm &mdash; not a threat to be managed.&rdquo;</p>

      <p style="margin:0;font-family:'Courier New',monospace;font-size:12px;color:#C8922A;letter-spacing:0.1em;text-transform:uppercase;">&mdash; DJ Cavalcanti, Founder</p>
    </td>
  </tr>

  <!-- ══ FOUR PILLARS ══════════════════════════════════════════════ -->
  <tr>
    <td style="background:#09090B;padding:44px 40px 44px;">
      <p style="margin:0 0 24px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.08em;text-transform:uppercase;">What We Stand For</p>

      <!-- Pillar 01 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0D0E12;border-left:3px solid #C8922A;margin-bottom:2px;">
        <tr>
          <td width="56" style="padding:24px 0 24px 24px;vertical-align:top;">
            <p style="margin:0;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:42px;font-weight:900;color:#1F2428;line-height:1;">01</p>
          </td>
          <td style="padding:24px 24px 24px 16px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#F0EDE6;letter-spacing:0.05em;text-transform:uppercase;">Relentless Coverage</p>
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:12px;color:#6B7280;line-height:1.75;">The ATF doesn&rsquo;t take weekends off. Neither do we. DownRange monitors 50+ sources and surfaces what matters within the hour it breaks.</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#C8922A;letter-spacing:0.1em;text-transform:uppercase;">Every 15 minutes. All day. Every day.</p>
          </td>
        </tr>
      </table>

      <!-- Pillar 02 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0D0E12;border-left:3px solid #C8922A;margin-bottom:2px;">
        <tr>
          <td width="56" style="padding:24px 0 24px 24px;vertical-align:top;">
            <p style="margin:0;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:42px;font-weight:900;color:#1F2428;line-height:1;">02</p>
          </td>
          <td style="padding:24px 24px 24px 16px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#F0EDE6;letter-spacing:0.05em;text-transform:uppercase;">Your State. Your Laws.</p>
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:12px;color:#6B7280;line-height:1.75;">A mag ban in California is not your problem if you&rsquo;re in Texas. 50-state law profiles, live bill tracking, ATF rule updates, and SCOTUS case analysis.</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#C8922A;letter-spacing:0.1em;text-transform:uppercase;">All 50 states. All the time.</p>
          </td>
        </tr>
      </table>

      <!-- Pillar 03 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0D0E12;border-left:3px solid #C8922A;margin-bottom:2px;">
        <tr>
          <td width="56" style="padding:24px 0 24px 24px;vertical-align:top;">
            <p style="margin:0;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:42px;font-weight:900;color:#1F2428;line-height:1;">03</p>
          </td>
          <td style="padding:24px 24px 24px 16px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#F0EDE6;letter-spacing:0.05em;text-transform:uppercase;">No Agenda. No Advertisers.</p>
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:12px;color:#6B7280;line-height:1.75;">No manufacturer pays for placement here. No PAC buys favorable coverage. No paywall keeps information out of reach. Our only obligation is to you.</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#C8922A;letter-spacing:0.1em;text-transform:uppercase;">Independent. Forever.</p>
          </td>
        </tr>
      </table>

      <!-- Pillar 04 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0D0E12;border-left:3px solid #C8922A;">
        <tr>
          <td width="56" style="padding:24px 0 24px 24px;vertical-align:top;">
            <p style="margin:0;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:42px;font-weight:900;color:#1F2428;line-height:1;">04</p>
          </td>
          <td style="padding:24px 24px 24px 16px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#F0EDE6;letter-spacing:0.05em;text-transform:uppercase;">Built by a Carrier. For Carriers.</p>
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:12px;color:#6B7280;line-height:1.75;">Built in Washington State &mdash; one of the hardest places to be a gun owner in America. The frustration of scattered, hostile information is exactly why DownRange exists.</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#C8922A;letter-spacing:0.1em;text-transform:uppercase;">We know what it costs to stay informed.</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ══ STATS ══════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:#0D0E12;padding:44px 40px;border-top:1px solid #1F2428;">
      <p style="margin:0 0 28px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.08em;text-transform:uppercase;">By the Numbers</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="2" style="background:#1F2428;">&nbsp;</td>
          <td style="padding:0 4px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" style="background:#111318;padding:24px 20px;border-bottom:2px solid #1F2428;">
                  <p style="margin:0 0 6px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:44px;font-weight:900;color:#C8922A;line-height:1;">100M+</p>
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#6B7280;line-height:1.6;">Gun owners in America deserve better than 10 tabs open at once.</p>
                </td>
                <td width="2" style="background:#1F2428;">&nbsp;</td>
                <td width="50%" style="background:#111318;padding:24px 20px;border-bottom:2px solid #1F2428;">
                  <p style="margin:0 0 6px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:44px;font-weight:900;color:#C8922A;line-height:1;">24/7</p>
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#6B7280;line-height:1.6;">The fight for the Second Amendment does not clock out.</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="background:#111318;padding:24px 20px;">
                  <p style="margin:0 0 6px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:44px;font-weight:900;color:#C8922A;line-height:1;">$0</p>
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#6B7280;line-height:1.6;">Taken from manufacturers, PACs, or political organizations.</p>
                </td>
                <td width="2" style="background:#1F2428;">&nbsp;</td>
                <td width="50%" style="background:#111318;padding:24px 20px;">
                  <p style="margin:0 0 6px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:44px;font-weight:900;color:#C8922A;line-height:1;">50</p>
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#6B7280;line-height:1.6;">States covered. Every law. Every carry rule. Updated constantly.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ CTA ══════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:#09090B;padding:52px 40px;text-align:center;border-top:1px solid #1F2428;">

      <!-- Corner marks -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #C8922A26;background:#0D0E12;padding:0;">
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#C8922A;text-transform:uppercase;">◉ &nbsp; The Mission</p>
            <p style="margin:0 0 16px;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:32px;font-weight:900;color:#F0EDE6;line-height:1.05;letter-spacing:0.04em;text-transform:uppercase;">EVERY GUN OWNER DESERVES<br><span style="color:#C8922A;">ACCESS TO THE TRUTH.</span></p>
            <p style="margin:0 0 32px;font-family:'Courier New',monospace;font-size:13px;color:#6B7280;line-height:1.8;">No gatekeeping. No paywalls. No editorial slant for hire.<br>Just clean, fast intelligence — so you always know what&rsquo;s happening to your rights.</p>

            <!-- Primary CTA — command block -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">
              <tr>
                <td style="background:#C8922A;border-top:1px solid #E8B24A;border-bottom:5px solid #7A5010;">
                  <a href="https://downrangeco.com/news" style="display:block;text-decoration:none;padding:26px 36px;">
                    <p style="margin:0 0 5px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.3em;color:rgba(0,0,0,0.38);text-transform:uppercase;">&#9673; &nbsp; Priority Briefing</p>
                    <p style="margin:0;font-family:'Arial Black','Arial',Impact,sans-serif;font-size:21px;font-weight:900;color:#09090B;letter-spacing:0.13em;text-transform:uppercase;">Read Today&rsquo;s Intel &nbsp;&#8594;</p>
                  </a>
                </td>
              </tr>
            </table>

            <!-- Spacer -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 16px;">
              <tr>
                <td style="height:1px;background:#1F2428;"></td>
              </tr>
            </table>

            <!-- Secondary CTA — gold text link -->
            <p style="margin:0;text-align:center;">
              <a href="https://downrangeco.com/laws" style="font-family:'Courier New',monospace;font-size:11px;color:#C8922A;text-decoration:none;letter-spacing:0.2em;text-transform:uppercase;">Your State&rsquo;s Carry Laws &nbsp;&#8594;</a>
            </p>

          </td>
        </tr>
      </table>

      <p style="margin:28px 0 0;font-family:'Courier New',monospace;font-size:12px;color:#4B5563;letter-spacing:0.05em;">Stay armed. Stay informed. <span style="color:#6B7280;font-weight:700;">Stay DownRange.</span></p>
    </td>
  </tr>

  <!-- ══ FOOTER ═══════════════════════════════════════════════════ -->
  <tr>
    <td style="background:#0D0E12;padding:28px 40px;border-top:1px solid #1F2428;text-align:center;">
      <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;color:#4B5563;line-height:1.8;">
        Questions? <a href="mailto:dj@downrangeco.com" style="color:#C8922A;text-decoration:none;">dj@downrangeco.com</a>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <a href="https://downrangeco.com/unsubscribe" style="color:#C8922A;text-decoration:none;">Unsubscribe</a>
      </p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#374151;line-height:1.7;">
        DownRange Co. &nbsp;·&nbsp; Second Amendment Intelligence Platform<br>
        downrangeco.com
      </p>
    </td>
  </tr>

</table>
<!-- END CONTAINER -->

</td></tr>
</table>
<!-- END OUTER WRAPPER -->

</body>
</html>`
}

export function generateNewsletterHTML(data = {}, isTest = false) {
  const {
    news    = [],
    blogs   = [],
    deals   = [],
    alerts  = [],
    videos  = [],
    ammo    = [],
    nfa     = null,
    unsubUrl = 'https://www.downrangeco.com/unsubscribe',
  } = data

  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const shortDate= now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  const issueNum = Math.floor((now - new Date('2026-01-01')) / (1000*60*60*24)) + 1

  // ── Helpers ──────────────────────────────────────────────────────────────
  const safe  = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const trunc = (s='',n=120) => { const c=String(s); return c.length>n ? c.slice(0,n).trim()+'…' : c }

  const CAT_COLOR = {
    breaking:'#EF4444', law:'#60A5FA', legal:'#60A5FA', court:'#60A5FA',
    legislation:'#F97316', politics:'#F97316', bill:'#F97316',
    industry:'#C8922A', market:'#C8922A', deal:'#C8922A', review:'#C8922A',
    training:'#34D399', opinion:'#C084FC', news:'#9CA3AF',
  }
  const catColor = (c='') => {
    c = c.toLowerCase()
    for (const [k,v] of Object.entries(CAT_COLOR)) { if (c.includes(k)) return v }
    return '#C8922A'
  }
  const catLabel = (c='') => {
    const map = { legislation:'LEGISLATION', legal:'LEGAL', court:'COURTS', law:'COURTS',
      market:'MARKET', deal:'DEALS', breaking:'BREAKING', industry:'INDUSTRY',
      politics:'POLITICS', bill:'BILL WATCH', training:'TRAINING', review:'REVIEW', opinion:'OPINION' }
    for (const [k,v] of Object.entries(map)) { if (c.toLowerCase().includes(k)) return v }
    return c.toUpperCase() || 'NEWS'
  }

  // ── Intelligence Grade ────────────────────────────────────────────────────
  const maxUrgency = Math.max(0, ...news.map(a => a.urgencyScore||0))
  let grade, gradeColor, gradeBg, gradeDesc, gradeDot
  if (alerts.length > 0 || maxUrgency >= 9) {
    grade='CRITICAL'; gradeColor='#fff'; gradeBg='#7F1D1D'; gradeDesc='Active breaking alerts — immediate attention required'; gradeDot='&#9632;'
  } else if (maxUrgency >= 7) {
    grade='HIGH ALERT'; gradeColor='#000'; gradeBg='#F97316'; gradeDesc='High-urgency developments — watch closely'; gradeDot='&#9650;'
  } else if (maxUrgency >= 5) {
    grade='ELEVATED'; gradeColor='#000'; gradeBg='#CA8A04'; gradeDesc='Notable legislative and regulatory activity this week'; gradeDot='&#9670;'
  } else {
    grade='ROUTINE'; gradeColor='#000'; gradeBg='#15803D'; gradeDesc='Standard weekly brief — no breaking developments'; gradeDot='&#9679;'
  }

  // ── Ammo Price Rows ───────────────────────────────────────────────────────
  const SEED_AMMO = [
    { caliber:'9mm Luger',   pricePerRound:0.22, trendDir:'stable', trendPct:0.5,  inStock:'Available' },
    { caliber:'5.56 NATO',   pricePerRound:0.34, trendDir:'down',   trendPct:-1.8, inStock:'Available' },
    { caliber:'.308 Win',    pricePerRound:0.89, trendDir:'up',     trendPct:2.1,  inStock:'Limited'   },
  ]
  const ammoData = ammo.length > 0 ? ammo.slice(0,3) : SEED_AMMO
  const trendArrow = (dir) => dir==='up' ? '&#9650;' : dir==='down' ? '&#9660;' : '&#9654;'
  const trendCol   = (dir) => dir==='up' ? '#EF4444' : dir==='down' ? '#22C55E' : '#9CA3AF'
  const ammoCols = ammoData.map(a => {
    const arrow = trendArrow(a.trendDir)
    const color = trendCol(a.trendDir)
    const pct   = a.trendPct ? (a.trendPct > 0 ? '+' : '') + Number(a.trendPct).toFixed(1) + '%' : ''
    const stock = a.inStock === 'Out of Stock' ? '#EF4444' : a.inStock === 'Limited' ? '#EAB308' : '#22C55E'
    return `
        <td width="33%" style="padding:0 1px 0 0;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;">
            <tr><td style="height:3px;background:${color};"></td></tr>
            <tr>
              <td style="padding:18px 16px 20px;">
                <p style="margin:0 0 6px;font-size:9px;color:#555;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">CALIBER</p>
                <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#fff;font-family:Arial,sans-serif;line-height:1.2;">${safe(a.caliber)}</p>
                <p style="margin:0 0 4px;font-size:24px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;line-height:1;">${'$'+Number(a.pricePerRound||0).toFixed(2)}<span style="font-size:11px;color:#555;font-weight:400;"> /rd</span></p>
                <p style="margin:0 0 10px;font-size:11px;color:${color};font-family:'Courier New',monospace;font-weight:700;">${arrow} ${pct}</p>
                <p style="margin:0;font-size:9px;color:${stock};letter-spacing:1px;font-family:'Courier New',monospace;font-weight:700;">${safe(a.inStock||'Available')}</p>
              </td>
            </tr>
          </table>
        </td>`
  }).join('')

  // ── Video Cards ──────────────────────────────────────────────────────────
  const SEED_VIDEOS = [
    { title:'Best Carry Ammo 2026 Test Results', channelName:'Garand Thumb', youtubeId:'dQw4w9WgXcQ', category:'Training', duration:'22:14' },
    { title:'New Glock 47 Full Review', channelName:'Forgotten Weapons', youtubeId:'dQw4w9WgXcQ', category:'Review', duration:'18:40' },
    { title:'Suppressor Laws: What Changed', channelName:'Paul Harrell', youtubeId:'dQw4w9WgXcQ', category:'News', duration:'14:07' },
  ]
  const videoData = videos.length > 0 ? videos.slice(0,3) : SEED_VIDEOS
  const videoCards = videoData.map(v => {
    const thumb  = v.thumbnail || v.thumbnailUrl || `https://i.ytimg.com/vi/${v.youtubeId||'dQw4w9WgXcQ'}/hqdefault.jpg`
    const ytUrl  = `https://www.youtube.com/watch?v=${v.youtubeId||v.videoId||''}`
    const catCol = catColor(v.category||'')
    return `
        <td width="33%" style="padding:0 1px 0 0;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;">
            <tr>
              <td style="padding:0;position:relative;">
                <a href="${ytUrl}" style="display:block;text-decoration:none;">
                  <img src="${thumb}" width="213" alt="${safe(v.title)}" style="display:block;width:100%;height:120px;object-fit:cover;border:0;" />
                  <div style="background:rgba(0,0,0,0.7);text-align:center;padding:6px 0;border-top:2px solid ${catCol};">
                    <span style="font-size:9px;color:#fff;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">&#9654; WATCH NOW</span>
                  </div>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 14px 18px;">
                <p style="margin:0 0 4px;font-size:9px;color:${catCol};letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">${safe((v.category||'VIDEO').toUpperCase())}</p>
                <a href="${ytUrl}" style="font-size:12px;font-weight:800;color:#fff;text-decoration:none;line-height:1.35;font-family:Arial,sans-serif;display:block;margin-bottom:6px;">${safe(trunc(v.title,65))}</a>
                <p style="margin:0;font-size:10px;color:#444;font-family:'Courier New',monospace;">${safe(v.channelName||'')}${v.duration ? ' &nbsp;&middot;&nbsp; '+safe(v.duration) : ''}</p>
              </td>
            </tr>
          </table>
        </td>`
  }).join('')

  // ── NFA Wait Pulse ───────────────────────────────────────────────────────
  let nfaBlock = ''
  if (nfa && nfa.forms && nfa.forms.length > 0) {
    const form4 = nfa.forms.find(f => f.formType && f.formType.includes('Form 4')) || nfa.forms[0]
    const months = form4.avgDays ? (form4.avgDays/30).toFixed(1) : '?'
    const trendCo = form4.trend==='up' ? '#EF4444' : form4.trend==='down' ? '#22C55E' : '#9CA3AF'
    const trendTx = form4.trend==='up' ? '&#9650; RISING' : form4.trend==='down' ? '&#9660; FALLING' : '&#9654; STABLE'
    nfaBlock = `
  <!-- NFA WAIT PULSE -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#111111;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#C8922A;padding:12px 32px;">
            <span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">NFA WAIT PULSE</span>
            <span style="font-size:10px;color:rgba(0,0,0,0.5);margin-left:12px;font-family:'Courier New',monospace;">${safe(nfa.reportMonth||'')}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 4px;font-size:9px;color:#555;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">FORM 4 eFILING — CURRENT AVERAGE</p>
                  <p style="margin:0;font-size:44px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;line-height:1;">${months}<span style="font-size:18px;color:#555;"> mo.</span></p>
                  <p style="margin:4px 0 0;font-size:11px;color:${trendCo};font-family:'Courier New',monospace;font-weight:700;">${trendTx}</p>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <a href="https://www.downrangeco.com/nfa-tracker" style="display:inline-block;border:1px solid #C8922A;color:#C8922A;padding:12px 20px;text-decoration:none;font-weight:900;letter-spacing:2px;font-size:10px;font-family:'Courier New',monospace;">FULL DATA &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
  }

  // ── Lead Story ───────────────────────────────────────────────────────────
  const lead   = news[0]
  const leadBlock = lead ? (() => {
    const url   = `https://www.downrangeco.com/news/${lead.slug?.current||''}`
    const color = catColor(lead.category)
    const cat   = catLabel(lead.category)
    const thumb = lead.imageUrl || lead.thumbnail
    return `
  <!-- LEAD STORY -->
  <tr>
    <td style="background:#111111;">
      ${thumb ? `<img src="${thumb}" width="640" alt="${safe(lead.title)}" style="display:block;width:100%;height:200px;object-fit:cover;border:0;" />` : `<div style="height:8px;background:${color};width:100%;"></div>`}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 32px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;">
                  <span style="display:inline-block;background:${color};color:#000;padding:4px 12px;font-size:10px;font-weight:900;letter-spacing:2px;font-family:'Courier New',monospace;margin-right:10px;">${cat}</span>
                  <span style="font-size:10px;color:#444;letter-spacing:2px;font-family:'Courier New',monospace;">LEAD STORY</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;border-bottom:1px solid #1e1e1e;">
                  <a href="${url}" style="font-size:26px;font-weight:900;color:#fff;text-decoration:none;line-height:1.15;font-family:'Arial Black',Arial,sans-serif;display:block;letter-spacing:-0.3px;">${safe(lead.title)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0 0;">
                  ${lead.summary ? `<p style="margin:0 0 16px;font-size:14px;color:#888;line-height:1.75;font-family:Arial,sans-serif;">${safe(trunc(lead.summary,220))}</p>` : ''}
                  <a href="${url}" style="font-size:12px;color:#C8922A;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;border-bottom:1px solid rgba(200,146,42,0.4);padding-bottom:2px;">Continue reading &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>`
  })() : ''

  // ── Stories 2-3 (2-col grid) ─────────────────────────────────────────────
  const makeCard2 = (a) => {
    if (!a) return `<td width="50%" style="padding:0;"></td>`
    const url   = `https://www.downrangeco.com/news/${a.slug?.current||''}`
    const color = catColor(a.category)
    const cat   = catLabel(a.category)
    const thumb = a.imageUrl || a.thumbnail
    return `
      <td width="50%" style="padding:0 1px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;height:100%;">
          <tr><td style="padding:0;">${thumb
            ? `<img src="${thumb}" width="320" alt="${safe(a.title)}" style="display:block;width:100%;height:140px;object-fit:cover;border:0;" />`
            : `<div style="height:4px;background:${color};width:100%;"></div>`}</td></tr>
          <tr>
            <td style="padding:18px 20px 24px;">
              <p style="margin:0 0 8px;font-size:9px;color:${color};letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">${cat}</p>
              <a href="${url}" style="font-size:15px;font-weight:800;color:#fff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:10px;">${safe(a.title)}</a>
              ${a.summary ? `<p style="margin:0 0 12px;font-size:12px;color:#666;line-height:1.6;font-family:Arial,sans-serif;">${safe(trunc(a.summary,90))}</p>` : ''}
              <a href="${url}" style="font-size:11px;color:#C8922A;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;">Continue &rarr;</a>
            </td>
          </tr>
        </table>
      </td>`
  }

  const gridBlock = news.length > 1 ? `
  <tr>
    <td style="padding:0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${makeCard2(news[1])}${makeCard2(news[2] || null)}</tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>` : ''

  // ── Stories 4-10 (compact numbered list) ─────────────────────────────────
  const listRows = news.slice(3, 10).map((a, i) => {
    const url   = `https://www.downrangeco.com/news/${a.slug?.current||''}`
    const color = catColor(a.category)
    const cat   = catLabel(a.category)
    const num   = i + 4
    return `
  <tr>
    <td style="padding:0 0 2px;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;">
        <tr>
          <td width="44" style="padding:20px 0 20px 20px;vertical-align:top;text-align:center;">
            <span style="font-size:26px;font-weight:900;color:#1e1e1e;font-family:'Arial Black',Arial,sans-serif;line-height:1;display:block;">${num}</span>
            <div style="width:20px;height:2px;background:${color};margin:4px auto 0;"></div>
          </td>
          <td style="padding:20px 20px 20px 16px;vertical-align:top;border-left:1px solid #1a1a1a;">
            <p style="margin:0 0 5px;font-size:9px;color:${color};letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">${cat}</p>
            <a href="${url}" style="font-size:14px;font-weight:800;color:#fff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:6px;">${safe(a.title)}</a>
            ${a.summary ? `<p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6;font-family:Arial,sans-serif;">${safe(trunc(a.summary,100))}</p>` : ''}
            <a href="${url}" style="font-size:11px;color:#C8922A;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;">Read &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
  }).join('')

  // ── Deals ────────────────────────────────────────────────────────────────
  const dealBlock = deals.length > 0 ? (() => {
    const top4 = deals.slice(0,4)
    const dealCells = top4.map(d => {
      const savings = (d.originalPrice && d.dealPrice) ? Math.round((1 - d.dealPrice/d.originalPrice)*100) : (d.savings ? Math.round(d.savings) : 0)
      const thumb = d.imageUrl || d.thumbnail
      return `
        <td width="${Math.floor(100/top4.length)}%" style="padding:0 1px 0 0;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;height:100%;">
            <tr><td>${thumb
              ? `<img src="${thumb}" width="160" alt="${safe(d.title||d.name||'')}" style="display:block;width:100%;height:100px;object-fit:cover;border:0;" />`
              : `<div style="height:100px;background:#1a1a1a;"></div>`}</td></tr>
            <tr>
              <td style="padding:12px 14px 10px;">
                ${savings > 0 ? `<span style="display:inline-block;background:#22C55E;color:#000;font-size:9px;font-weight:900;padding:2px 8px;font-family:'Courier New',monospace;margin-bottom:6px;">-${savings}%</span>` : ''}
                <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#fff;line-height:1.3;font-family:Arial,sans-serif;">${safe(trunc(d.title||d.name||'',48))}</p>
                <p style="margin:0 0 8px;font-size:10px;color:#444;font-family:Arial,sans-serif;">${safe(d.store||d.retailer||'')}</p>
                <p style="margin:0;font-size:18px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;">${d.dealPrice ? '$'+Number(d.dealPrice).toFixed(2) : d.price ? '$'+d.price : ''}</p>
                ${d.originalPrice ? `<p style="margin:2px 0 0;font-size:10px;color:#333;text-decoration:line-through;font-family:Arial,sans-serif;">$${Number(d.originalPrice).toFixed(2)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:0 14px 14px;">
                <a href="${d.url||'https://www.downrangeco.com/deals'}" style="display:block;text-align:center;background:#C8922A;color:#000;padding:8px 0;font-size:10px;font-weight:900;letter-spacing:2px;text-decoration:none;font-family:'Courier New',monospace;border-bottom:2px solid #7a5010;">GET DEAL &rarr;</a>
              </td>
            </tr>
          </table>
        </td>`
    }).join('')
    return `
  <!-- ARMORY DEALS -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#C8922A;padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">ARMORY DEALS</span>
            <span style="font-size:10px;color:rgba(0,0,0,0.45);margin-left:10px;font-family:'Courier New',monospace;">BEST PRICES TODAY</span></td>
        <td style="text-align:right;"><a href="https://www.downrangeco.com/deals" style="font-size:10px;color:rgba(0,0,0,0.5);font-family:'Courier New',monospace;text-decoration:none;letter-spacing:1px;">VIEW ALL &rarr;</a></td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="padding:0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>${dealCells}</tr></table>
    </td>
  </tr>`
  })() : ''

  // ── Blog / Field Notes ───────────────────────────────────────────────────
  const blogBlock = blogs.length > 0 ? `
  <!-- FIELD NOTES -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#C8922A;padding:12px 32px;">
      <span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">FIELD NOTES</span>
      <span style="font-size:10px;color:rgba(0,0,0,0.45);margin-left:10px;font-family:'Courier New',monospace;">EDITORIAL &amp; ANALYSIS</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  ${blogs.slice(0,2).map(b => {
    const url   = `https://www.downrangeco.com/learn/${b.slug?.current||b._id||''}`
    const thumb = b.imageUrl || b.heroImage?.asset?.url
    return `
  <tr>
    <td style="background:#111111;padding:0 0 2px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${thumb ? `<td width="160" style="padding:0;vertical-align:top;"><img src="${thumb}" width="160" alt="${safe(b.title)}" style="display:block;width:160px;height:110px;object-fit:cover;border:0;" /></td>` : ''}
          <td style="padding:20px 24px;vertical-align:middle;">
            <p style="margin:0 0 6px;font-size:9px;color:#C8922A;letter-spacing:2px;font-weight:700;font-family:'Courier New',monospace;">EDITORIAL</p>
            <a href="${url}" style="font-size:16px;font-weight:800;color:#fff;text-decoration:none;line-height:1.3;font-family:Arial,sans-serif;display:block;margin-bottom:8px;">${safe(b.title)}</a>
            ${b.summary ? `<p style="margin:0 0 12px;font-size:13px;color:#666;line-height:1.6;font-family:Arial,sans-serif;">${safe(trunc(b.summary,100))}</p>` : ''}
            <a href="${url}" style="font-size:11px;color:#C8922A;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;">Read &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`}).join('')}` : ''

  // ── Alerts Block ─────────────────────────────────────────────────────────
  const alertsBlock = alerts.length > 0 ? `
  <!-- BREAKING ALERTS -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#450a0a;border-left:4px solid #EF4444;padding:20px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:10px;">
            <span style="font-size:11px;font-weight:900;color:#EF4444;letter-spacing:3px;font-family:'Courier New',monospace;">&#9632; BREAKING ALERTS</span>
          </td>
        </tr>
        ${alerts.map(a => `
        <tr>
          <td style="padding:6px 0;border-top:1px solid rgba(239,68,68,0.15);">
            <p style="margin:0;font-size:14px;color:#FECACA;font-family:Arial,sans-serif;line-height:1.5;">${safe(a.text||a.title||'')}</p>
          </td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>` : ''

  // ── Assemble ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>DownRange Intelligence Brief &mdash; ${shortDate}</title>
  <style>
    @media only screen and (max-width:640px) {
      .mob-full { width:100% !important; display:block !important; }
      .mob-pad  { padding:16px 16px !important; }
      .mob-hide { display:none !important; }
      .mob-lg   { font-size:22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">DownRange Brief &mdash; ${shortDate} &mdash; ${news.length} stories, ${deals.length} deals &mdash; Stay informed. Stay DownRange.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:20px 12px 40px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

  ${isTest ? `
  <!-- TEST BANNER -->
  <tr>
    <td style="background:#7F1D1D;padding:10px 32px;text-align:center;">
      <span style="font-size:10px;font-weight:900;color:#FECACA;letter-spacing:3px;font-family:'Courier New',monospace;">&#9888; TEST SEND &mdash; NOT DELIVERED TO SUBSCRIBERS &#9888;</span>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>` : ''}

  <!-- ══ MASTHEAD ══════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:#111111;padding:0;">
      <!-- Gold top rule -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;background:#C8922A;"></td></tr>
        <!-- Corner marks row -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="16" style="border-top:1px solid #C8922A26;border-left:1px solid #C8922A26;height:12px;vertical-align:top;"></td>
                <td style="text-align:center;padding:0 16px;">
                  <span style="font-size:9px;color:#2e2e2e;letter-spacing:3px;font-family:'Courier New',monospace;font-weight:700;">&#11046; &nbsp; FIREARMS &amp; SECOND AMENDMENT INTELLIGENCE &nbsp; &#11046;</span>
                </td>
                <td width="16" style="border-top:1px solid #C8922A26;border-right:1px solid #C8922A26;height:12px;vertical-align:top;"></td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Logo + Date row -->
        <tr>
          <td style="padding:16px 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-size:38px;font-weight:900;color:#C8922A;font-family:'Arial Black','Arial',Impact,sans-serif;letter-spacing:6px;line-height:1;">DOWNRANGE</p>
                  <p style="margin:3px 0 0;font-size:9px;color:#333;letter-spacing:3px;font-family:'Courier New',monospace;font-weight:700;text-transform:uppercase;">America&rsquo;s Firearms Intelligence Hub</p>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <p style="margin:0 0 2px;font-size:9px;color:#444;letter-spacing:2px;font-family:'Courier New',monospace;">INTEL BRIEF</p>
                  <p style="margin:0 0 2px;font-size:13px;font-weight:900;color:#C8922A;font-family:'Courier New',monospace;">${shortDate}</p>
                  <p style="margin:0;font-size:9px;color:#333;font-family:'Courier New',monospace;">ISSUE #${issueNum}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Category ticker -->
        <tr>
          <td style="background:#0d0d0d;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:9px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:9px;color:#3a3a3a;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">
                  <span style="color:#C8922A;">&#9679;</span> &nbsp;FIREARMS &nbsp;&middot;&nbsp; LEGISLATION &nbsp;&middot;&nbsp; COURTS &nbsp;&middot;&nbsp; MARKET &nbsp;&middot;&nbsp; TRAINING &nbsp;&middot;&nbsp; INDUSTRY
                </td>
                <td style="text-align:right;font-size:9px;color:#2e2e2e;font-family:'Courier New',monospace;">${news.length} STORIES &nbsp;&#8231;&nbsp; ${deals.length} DEALS</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- IN THIS ISSUE -->
        <tr>
          <td style="background:#0f0f0f;padding:10px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:20px;font-size:9px;color:#333;font-family:'Courier New',monospace;letter-spacing:1px;">IN THIS ISSUE</td>
                ${news.length > 0 ? `<td style="padding-right:16px;"><span style="font-size:13px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;">${news.length}</span> <span style="font-size:9px;color:#444;font-family:'Courier New',monospace;">STORIES</span></td>` : ''}
                ${deals.length > 0 ? `<td style="padding-right:16px;"><span style="font-size:13px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;">${deals.length}</span> <span style="font-size:9px;color:#444;font-family:'Courier New',monospace;">DEALS</span></td>` : ''}
                ${videos.length > 0 || true ? `<td style="padding-right:16px;"><span style="font-size:13px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;">${videoData.length}</span> <span style="font-size:9px;color:#444;font-family:'Courier New',monospace;">VIDEOS</span></td>` : ''}
                ${ammoData.length > 0 ? `<td><span style="font-size:13px;font-weight:900;color:#C8922A;font-family:'Arial Black',Arial,sans-serif;">${ammoData.length}</span> <span style="font-size:9px;color:#444;font-family:'Courier New',monospace;">PRICES</span></td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>

  <!-- ══ INTELLIGENCE GRADE ═══════════════════════════════════════════ -->
  <tr>
    <td style="background:${gradeBg};padding:14px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:9px;color:rgba(${gradeBg==='#7F1D1D'?'255,255,255':'0,0,0'},0.55);letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">INTELLIGENCE GRADE</span>
            <p style="margin:3px 0 0;font-size:18px;font-weight:900;color:${gradeColor};font-family:'Arial Black',Arial,sans-serif;letter-spacing:3px;">${gradeDot} &nbsp;${grade}</p>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <p style="margin:0;font-size:11px;color:rgba(${gradeBg==='#7F1D1D'?'255,255,255':'0,0,0'},0.55);font-family:'Courier New',monospace;line-height:1.5;max-width:200px;text-align:right;">${gradeDesc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>

  ${alertsBlock}

  <!-- ══ BREAKING INTEL ═══════════════════════════════════════════════ -->
  ${news.length > 0 ? `
  <tr>
    <td style="background:#C8922A;padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">BREAKING INTEL</span>
            <span style="font-size:9px;color:rgba(0,0,0,0.45);margin-left:10px;font-family:'Courier New',monospace;">${news.length} STORIES &middot; ${shortDate}</span></td>
        <td style="text-align:right;"><a href="https://www.downrangeco.com/news" style="font-size:9px;color:rgba(0,0,0,0.5);font-family:'Courier New',monospace;text-decoration:none;letter-spacing:1px;">ALL NEWS &rarr;</a></td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>

  ${leadBlock}
  ${gridBlock}
  ${listRows}` : ''}

  <!-- ══ AMMO PRICE INDEX ══════════════════════════════════════════════ -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#C8922A;padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">AMMO PRICE INDEX</span>
            <span style="font-size:9px;color:rgba(0,0,0,0.45);margin-left:10px;font-family:'Courier New',monospace;">SPOT PRICES &middot; THIS WEEK</span></td>
        <td style="text-align:right;"><a href="https://www.downrangeco.com/market" style="font-size:9px;color:rgba(0,0,0,0.5);font-family:'Courier New',monospace;text-decoration:none;letter-spacing:1px;">MARKET WATCH &rarr;</a></td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="padding:0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${ammoCols}</tr>
      </table>
    </td>
  </tr>

  ${dealBlock}

  <!-- ══ FROM THE FIELD ═══════════════════════════════════════════════ -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#C8922A;padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:12px;font-weight:900;color:#000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">FROM THE FIELD</span>
            <span style="font-size:9px;color:rgba(0,0,0,0.45);margin-left:10px;font-family:'Courier New',monospace;">LATEST VIDEOS</span></td>
        <td style="text-align:right;"><a href="https://www.downrangeco.com/video" style="font-size:9px;color:rgba(0,0,0,0.5);font-family:'Courier New',monospace;text-decoration:none;letter-spacing:1px;">ALL VIDEOS &rarr;</a></td>
      </tr></table>
    </td>
  </tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="padding:0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${videoCards}</tr>
      </table>
    </td>
  </tr>

  ${nfaBlock}

  ${blogBlock}

  <!-- ══ INTEL TOOLS ══════════════════════════════════════════════════ -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#111111;padding:24px 32px;">
      <p style="margin:0 0 14px;font-size:9px;color:#333;letter-spacing:2px;font-family:'Courier New',monospace;font-weight:700;">INTEL TOOLS</p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          ${[
            ['BALLISTICS CALC', '/ballistics'],
            ['RANGE FINDER', '/ranges'],
            ['GUN VALUE EST.', '/value-estimator'],
            ['NFA TRACKER', '/nfa-tracker'],
            ['STATE LAWS', '/laws'],
          ].map(([label, path]) => `
          <td style="padding:0 4px 0 0;">
            <a href="https://www.downrangeco.com${path}" style="display:inline-block;font-family:'Courier New',monospace;font-size:9px;color:#C8922A;background:#0d0d0d;border:1px solid #1e1e1e;padding:7px 11px;text-decoration:none;letter-spacing:1px;font-weight:700;">${label}</a>
          </td>`).join('')}
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ PORTAL CTA ═══════════════════════════════════════════════════ -->
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>
  <tr>
    <td style="background:#111111;border-top:3px solid #C8922A;padding:44px 32px;text-align:center;">
      <!-- Corner marks -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e1e1e;">
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:9px;color:#C8922A;letter-spacing:3px;font-family:'Courier New',monospace;">&#9673; &nbsp; THE MISSION</p>
            <h2 style="margin:6px 0 14px;font-size:28px;font-weight:900;color:#fff;font-family:'Arial Black',Arial,sans-serif;text-transform:uppercase;line-height:1.1;letter-spacing:0.04em;">Every Gun Owner Deserves<br><span style="color:#C8922A;">Access to the Truth.</span></h2>
            <p style="margin:0 0 28px;font-size:13px;color:#555;font-family:Arial,sans-serif;line-height:1.75;">State laws &middot; Court rulings &middot; Ammo prices &middot; New releases &middot; Breaking news.<br>Free. Unfiltered. Yours.</p>
            <a href="https://www.downrangeco.com" style="display:inline-block;background:#C8922A;color:#000;padding:16px 48px;text-decoration:none;font-weight:900;letter-spacing:3px;text-transform:uppercase;font-size:12px;font-family:'Arial Black',Arial,sans-serif;border-bottom:4px solid #7a5010;">VISIT DOWNRANGE &rarr;</a>
            <p style="margin:24px 0 0;font-size:11px;color:#2e2e2e;font-family:'Courier New',monospace;letter-spacing:2px;">Stay Armed. Stay Informed. Stay DownRange.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ FOOTER ════════════════════════════════════════════════════════ -->
  <tr><td style="height:2px;background:#C8922A;"></td></tr>
  <tr>
    <td style="background:#0a0a0a;padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:14px;border-bottom:1px solid #111111;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:18px;font-weight:900;color:#222;font-family:'Arial Black',Arial,sans-serif;letter-spacing:4px;">DOWNRANGE</span>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <span style="font-size:9px;color:#222;font-family:'Courier New',monospace;letter-spacing:1px;">ISSUE #${issueNum} &middot; ${shortDate}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top:14px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;font-family:Arial,sans-serif;">
              <a href="https://www.downrangeco.com" style="color:#333;text-decoration:none;margin:0 8px;">Portal</a>
              <span style="color:#1a1a1a;">&middot;</span>
              <a href="https://www.downrangeco.com/deals" style="color:#333;text-decoration:none;margin:0 8px;">Deals</a>
              <span style="color:#1a1a1a;">&middot;</span>
              <a href="https://www.downrangeco.com/laws" style="color:#333;text-decoration:none;margin:0 8px;">State Laws</a>
              <span style="color:#1a1a1a;">&middot;</span>
              <a href="https://www.downrangeco.com/learn" style="color:#333;text-decoration:none;margin:0 8px;">Learn</a>
              <span style="color:#1a1a1a;">&middot;</span>
              <a href="${unsubUrl}" style="color:#333;text-decoration:none;margin:0 8px;">Unsubscribe</a>
            </p>
            <p style="margin:8px 0 0;font-size:9px;color:#1e1e1e;font-family:'Courier New',monospace;letter-spacing:2px;">
              DOWNRANGE CO. &nbsp;&middot;&nbsp; SECOND AMENDMENT INTELLIGENCE PLATFORM &nbsp;&middot;&nbsp; DOWNRANGECO.COM
            </p>
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

