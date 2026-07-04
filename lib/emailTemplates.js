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

      <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:14px;color:#6B7280;line-height:1.85;">Thank you for subscribing. You just joined a growing community of gun owners, carriers, veterans, and 2A advocates who refuse to be uninformed. Every week, your intelligence brief lands here.</p>

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
  const dateStr  = now.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
  const monthYear= now.toLocaleDateString('en-US', { month:'long', year:'numeric' }).toUpperCase()
  const shortDate= now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  const issueNum = Math.floor((now - new Date('2026-01-01')) / (1000*60*60*24)) + 1

  const safe  = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const trunc = (s='',n=120) => { const c=String(s); return c.length>n ? c.slice(0,n).trim()+'…' : c }

  // Category colors & labels
  const catColor = (c='') => {
    c = (c||'').toLowerCase()
    if (c.includes('break')) return '#EF4444'
    if (c.includes('law')||c.includes('court')||c.includes('legal')) return '#60A5FA'
    if (c.includes('legisl')||c.includes('polit')||c.includes('bill')) return '#F97316'
    if (c.includes('train')) return '#34D399'
    if (c.includes('opinion')) return '#C084FC'
    return '#C8922A'
  }
  const catLabel = (c='') => {
    const map = {legislation:'LEGISLATION',legal:'LEGAL',court:'COURTS',law:'COURTS',
      market:'MARKET',deal:'DEALS',breaking:'BREAKING',industry:'INDUSTRY',
      politics:'POLITICS',bill:'BILL WATCH',training:'TRAINING',review:'REVIEW',opinion:'OPINION'}
    for (const [k,v] of Object.entries(map)) { if ((c||'').toLowerCase().includes(k)) return v }
    return (c||'NEWS').toUpperCase()
  }

  // Intelligence grade
  const maxUrg = Math.max(0, ...news.map(a => a.urgencyScore||0))
  let grade, gradeBg, gradeText
  if (alerts.length>0||maxUrg>=9)      { grade='CRITICAL'; gradeBg='#991B1B'; gradeText='#FCA5A5' }
  else if (maxUrg>=7)                  { grade='HIGH ALERT'; gradeBg='#9A3412'; gradeText='#FED7AA' }
  else if (maxUrg>=5)                  { grade='ELEVATED'; gradeBg='#78350F'; gradeText='#FDE68A' }
  else                                 { grade='ROUTINE'; gradeBg='#14532D'; gradeText='#BBF7D0' }

  // Ammo seed/live data
  const SEED_AMMO = [
    { caliber:'9mm Luger',  pricePerRound:0.22, trendDir:'stable', trendPct:0.5,  inStock:'Available' },
    { caliber:'5.56 NATO',  pricePerRound:0.34, trendDir:'down',   trendPct:-1.8, inStock:'Available' },
    { caliber:'.308 Win',   pricePerRound:0.89, trendDir:'up',     trendPct:2.1,  inStock:'Limited'   },
  ]
  const ammoData = ammo.length>0 ? ammo.slice(0,3) : SEED_AMMO
  const trendArrow = d => d==='up'?'&#9650;':d==='down'?'&#9660;':'&#9654;'
  const trendCol   = d => d==='up'?'#EF4444':d==='down'?'#22C55E':'#9CA3AF'

  // Videos seed/live
  const SEED_VIDEOS = [
    { title:'Carry Ammo Test: What Actually Expands?', channelName:'Garand Thumb', youtubeId:'dQw4w9WgXcQ', category:'Training', duration:'22:14' },
    { title:'Full Review: New Glock 47 MOS', channelName:'Forgotten Weapons', youtubeId:'dQw4w9WgXcQ', category:'Review', duration:'18:40' },
    { title:'Suppressor Laws: What Just Changed', channelName:'Paul Harrell', youtubeId:'dQw4w9WgXcQ', category:'News', duration:'14:07' },
  ]
  const videoData = videos.length>0 ? videos.slice(0,3) : SEED_VIDEOS

  // ── LEAD STORY ─────────────────────────────────────────────────────────────
  const lead = news[0]
  const leadHero = lead ? (() => {
    const url   = `https://www.downrangeco.com/news/${lead.slug?.current||''}`
    const color = catColor(lead.category)
    const cat   = catLabel(lead.category)
    const thumb = lead.imageUrl||lead.thumbnail
    return `
    <!-- LEAD STORY -->
    <tr><td style="padding:0 0 2px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111111;">
        ${thumb ? `<tr><td style="padding:0;"><img src="${thumb}" width="640" alt="${safe(lead.title)}" style="display:block;width:100%;max-height:280px;object-fit:cover;border:0;" /></td></tr>` : `<tr><td style="height:4px;background:${color};"></td></tr>`}
        <tr><td style="padding:32px 40px 36px;">
          <p style="margin:0 0 12px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:${color};">&#9658;&nbsp; ${cat} &nbsp;&bull;&nbsp; LEAD STORY</p>
          <h2 style="margin:0 0 16px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:30px;line-height:1.1;letter-spacing:.01em;text-transform:uppercase;color:#F0EDE6;">${safe(lead.title)}</h2>
          ${lead.summary ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.65;color:#9CA3AF;">${safe(trunc(lead.summary,200))}</p>` : ''}
          <a href="${url}" style="display:inline-block;background:#C8922A;color:#09090B;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:12px 24px;border-bottom:3px solid #7a5010;text-decoration:none;">READ FULL STORY &rarr;</a>
        </td></tr>
      </table>
    </td></tr>`
  })() : ''

  // ── 2-COL GRID #2-3 ────────────────────────────────────────────────────────
  const makeCard = a => {
    if (!a) return '<td width="50%" style="padding:0;"></td>'
    const url   = `https://www.downrangeco.com/news/${a.slug?.current||''}`
    const color = catColor(a.category)
    const thumb = a.imageUrl||a.thumbnail
    return `
      <td width="50%" style="padding:0 1px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111111;">
          ${thumb ? `<tr><td><img src="${thumb}" width="320" alt="${safe(a.title)}" style="display:block;width:100%;height:150px;object-fit:cover;border:0;" /></td></tr>` : `<tr><td style="height:3px;background:${color};"></td></tr>`}
          <tr><td style="padding:20px 22px 24px;">
            <p style="margin:0 0 8px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:.28em;color:${color};">${catLabel(a.category)}</p>
            <a href="${url}" style="display:block;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:17px;line-height:1.2;letter-spacing:.02em;text-transform:uppercase;color:#F0EDE6;text-decoration:none;margin-bottom:10px;">${safe(a.title)}</a>
            ${a.summary ? `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7280;">${safe(trunc(a.summary,90))}</p>` : ''}
            <a href="${url}" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#C8922A;text-decoration:none;font-weight:700;letter-spacing:.1em;">READ &rarr;</a>
          </td></tr>
        </table>
      </td>`
  }
  const gridBlock = news.length>1 ? `
    <tr><td style="padding:0 0 2px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>${makeCard(news[1])}${makeCard(news[2]||null)}</tr>
      </table>
    </td></tr>` : ''

  // ── COMPACT LIST #4-10 ────────────────────────────────────────────────────
  const listRows = news.slice(3,10).map((a,i) => {
    const url   = `https://www.downrangeco.com/news/${a.slug?.current||''}`
    const color = catColor(a.category)
    return `
    <tr><td style="padding:0 0 1px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0f0f0f;">
        <tr>
          <td width="52" style="padding:18px 0 18px 20px;vertical-align:top;text-align:center;">
            <span style="font-family:'Anton',Impact,sans-serif;font-size:22px;color:#1e1e1e;line-height:1;">${i+4}</span>
          </td>
          <td style="padding:18px 20px 18px 16px;vertical-align:top;border-left:1px solid #161616;">
            <p style="margin:0 0 5px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:.22em;color:${color};">${catLabel(a.category)}</p>
            <a href="${url}" style="display:block;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#D1D5DB;text-decoration:none;line-height:1.35;margin-bottom:6px;">${safe(a.title)}</a>
            <a href="${url}" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#C8922A;text-decoration:none;letter-spacing:.1em;">Read &rarr;</a>
          </td>
        </tr>
      </table>
    </td></tr>`
  }).join('')

  // ── DEALS ─────────────────────────────────────────────────────────────────
  const dealBlock = deals.length>0 ? (() => {
    const top4 = deals.slice(0,4)
    const cells = top4.map(d => {
      const pct = (d.originalPrice&&d.dealPrice) ? Math.round((1-d.dealPrice/d.originalPrice)*100) : (d.savings?Math.round(d.savings):0)
      const thumb = d.imageUrl||d.thumbnail
      return `
        <td width="${Math.floor(100/top4.length)}%" style="padding:0 1px 0 0;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111111;">
            <tr><td>${thumb
              ? `<img src="${thumb}" width="160" alt="${safe(d.title||d.name||'')}" style="display:block;width:100%;height:110px;object-fit:cover;border:0;" />`
              : `<div style="height:110px;background:#161616;"></div>`}</td></tr>
            <tr><td style="padding:14px 14px 10px;">
              ${pct>0 ? `<span style="display:inline-block;background:#15803D;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;font-family:'IBM Plex Mono','Courier New',monospace;margin-bottom:6px;letter-spacing:.1em;">-${pct}%</span>` : ''}
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#E5E7EB;line-height:1.3;font-family:Arial,sans-serif;">${safe(trunc(d.title||d.name||'',46))}</p>
              <p style="margin:0 0 8px;font-size:10px;color:#4B5563;font-family:Arial,sans-serif;">${safe(d.store||d.retailer||'')}</p>
              <p style="margin:0;font-family:'Anton',Impact,sans-serif;font-size:20px;color:#C8922A;letter-spacing:.03em;">${d.dealPrice?'$'+Number(d.dealPrice).toFixed(2):d.price?'$'+d.price:''}</p>
              ${d.originalPrice ? `<p style="margin:2px 0 0;font-size:10px;color:#374151;text-decoration:line-through;font-family:Arial,sans-serif;">$${Number(d.originalPrice).toFixed(2)}</p>` : ''}
            </td></tr>
            <tr><td style="padding:0 14px 14px;">
              <a href="${d.url||'https://www.downrangeco.com/deals'}" style="display:block;text-align:center;background:#C8922A;color:#09090B;padding:9px 0;font-size:9px;font-weight:700;letter-spacing:.2em;text-decoration:none;font-family:'IBM Plex Mono','Courier New',monospace;border-bottom:2px solid #7a5010;">GET DEAL &rarr;</a>
            </td></tr>
          </table>
        </td>`
    }).join('')
    return `
    <!-- ARMORY DEALS -->
    <tr><td style="padding:48px 40px 8px;background:#0a0a0a;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; ARMORY DEALS</p>
      <h2 style="margin:0 0 6px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:.03em;text-transform:uppercase;color:#F0EDE6;">Best Prices This Week</h2>
      <p style="margin:0 0 24px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#374151;letter-spacing:.1em;">
        <a href="https://www.downrangeco.com/deals" style="color:#C8922A;text-decoration:none;letter-spacing:.1em;">VIEW ALL DEALS &rarr;</a>
      </p>
    </td></tr>
    <tr><td style="padding:0 0 2px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${cells}</tr></table>
    </td></tr>`
  })() : ''

  // ── AMMO PRICE INDEX ────────────────────────────────────────────────────────
  const ammoBlock = `
    <!-- AMMO PRICE INDEX -->
    <tr><td style="padding:48px 40px 8px;background:#0a0a0a;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; AMMO PRICE INDEX</p>
      <h2 style="margin:0 0 6px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:.03em;text-transform:uppercase;color:#F0EDE6;">Spot Prices This Week</h2>
      <p style="margin:0 0 24px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#374151;letter-spacing:.1em;">
        <a href="https://www.downrangeco.com/market" style="color:#C8922A;text-decoration:none;letter-spacing:.1em;">FULL MARKET DATA &rarr;</a>
      </p>
    </td></tr>
    <tr><td style="padding:0 0 2px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>${ammoData.map(a => {
          const arrow = trendArrow(a.trendDir)
          const col   = trendCol(a.trendDir)
          const pct   = a.trendPct ? (a.trendPct>0?'+':'')+Number(a.trendPct).toFixed(1)+'%' : ''
          const stockCol = a.inStock==='Out of Stock'?'#EF4444':a.inStock==='Limited'?'#CA8A04':'#15803D'
          return `
          <td width="33%" style="padding:0 1px 0 0;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111111;">
              <tr><td style="height:3px;background:${col};"></td></tr>
              <tr><td style="padding:20px 18px 22px;">
                <p style="margin:0 0 8px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:.22em;color:#4B5563;">${safe(a.caliber)}</p>
                <p style="margin:0 0 4px;font-family:'Anton',Impact,sans-serif;font-size:28px;color:#C8922A;line-height:1;">$${Number(a.pricePerRound||0).toFixed(2)}</p>
                <p style="margin:0 0 2px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;color:#374151;">per round</p>
                <p style="margin:8px 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;color:${col};font-weight:700;">${arrow} ${pct}</p>
                <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;color:${stockCol};font-weight:700;letter-spacing:.1em;">${safe(a.inStock||'Available')}</p>
              </td></tr>
            </table>
          </td>`
        }).join('')}</tr>
      </table>
    </td></tr>`

  // ── FROM THE FIELD (videos) ────────────────────────────────────────────────
  const videoBlock = `
    <!-- FROM THE FIELD -->
    <tr><td style="padding:48px 40px 8px;background:#0a0a0a;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; FROM THE FIELD</p>
      <h2 style="margin:0 0 6px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:.03em;text-transform:uppercase;color:#F0EDE6;">Latest Videos</h2>
      <p style="margin:0 0 24px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#374151;letter-spacing:.1em;">
        <a href="https://www.downrangeco.com/video" style="color:#C8922A;text-decoration:none;letter-spacing:.1em;">ALL VIDEOS &rarr;</a>
      </p>
    </td></tr>
    <tr><td style="padding:0 0 2px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>${videoData.map(v => {
          const thumb = v.thumbnail||v.thumbnailUrl||`https://i.ytimg.com/vi/${v.youtubeId||'dQw4w9WgXcQ'}/hqdefault.jpg`
          const ytUrl = `https://www.youtube.com/watch?v=${v.youtubeId||v.videoId||''}`
          const col   = catColor(v.category||'')
          return `
          <td width="33%" style="padding:0 1px 0 0;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111111;">
              <tr><td style="padding:0;position:relative;">
                <a href="${ytUrl}" style="display:block;">
                  <img src="${thumb}" width="213" alt="${safe(v.title)}" style="display:block;width:100%;height:120px;object-fit:cover;border:0;" />
                </a>
              </td></tr>
              <tr><td style="padding:14px 14px 18px;">
                <p style="margin:0 0 5px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:.22em;color:${col};">${safe((v.category||'VIDEO').toUpperCase())}</p>
                <a href="${ytUrl}" style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#E5E7EB;text-decoration:none;line-height:1.35;margin-bottom:6px;">${safe(trunc(v.title,65))}</a>
                <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;color:#374151;">
                  ${safe(v.channelName||'')}${v.duration?' &nbsp;&middot;&nbsp; '+safe(v.duration):''}
                </p>
              </td></tr>
              <tr><td style="padding:0 14px 14px;">
                <a href="${ytUrl}" style="display:block;text-align:center;border:1px solid rgba(200,146,42,0.35);color:#C8922A;padding:9px 0;font-size:9px;font-weight:700;letter-spacing:.18em;text-decoration:none;font-family:'IBM Plex Mono','Courier New',monospace;">&#9654; WATCH NOW</a>
              </td></tr>
            </table>
          </td>`
        }).join('')}</tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 0;background:#0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center">
          <a href="https://www.downrangeco.com/video" style="display:inline-block;border:1px solid rgba(200,146,42,0.35);color:#C8922A;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;padding:13px 30px;text-decoration:none;">&#9654;&nbsp; ALL VIDEOS ON DOWNRANGE</a>
        </td></tr>
      </table>
    </td></tr>`

  // ── NFA WAIT PULSE ─────────────────────────────────────────────────────────
  const nfaBlock = (nfa&&nfa.forms&&nfa.forms.length>0) ? (() => {
    const form4 = nfa.forms.find(f=>f.formType&&f.formType.includes('Form 4'))||nfa.forms[0]
    const months = form4.avgDays ? (form4.avgDays/30).toFixed(1) : '?'
    const tCol   = form4.trend==='up'?'#EF4444':form4.trend==='down'?'#22C55E':'#9CA3AF'
    const tTx    = form4.trend==='up'?'&#9650; RISING':form4.trend==='down'?'&#9660; FALLING':'&#9654; STABLE'
    return `
    <!-- NFA WAIT PULSE -->
    <tr><td style="padding:0 40px;background:#0a0a0a;">
      <div style="height:1px;background:rgba(200,146,42,0.2);"></div>
    </td></tr>
    <tr><td style="background:#111111;border-left:4px solid #C8922A;padding:32px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td>
          <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;color:#C8922A;">NFA WAIT PULSE &nbsp;&bull;&nbsp; ${safe(nfa.reportMonth||'')}</p>
          <p style="margin:0 0 4px;font-family:'Anton',Impact,sans-serif;font-size:42px;color:#F0EDE6;line-height:1;">${months} <span style="font-size:18px;color:#4B5563;">months</span></p>
          <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:${tCol};font-weight:700;">${tTx}</p>
          <p style="margin:4px 0 0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;color:#374151;">Form 4 eFiling — Current Average</p>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <a href="https://www.downrangeco.com/nfa-tracker" style="display:inline-block;border:1px solid rgba(200,146,42,0.35);color:#C8922A;padding:12px 20px;text-decoration:none;font-weight:700;letter-spacing:.18em;font-size:10px;font-family:'IBM Plex Mono','Courier New',monospace;">FULL DATA &rarr;</a>
        </td>
      </tr></table>
    </td></tr>`
  })() : ''

  // ── ALERTS ────────────────────────────────────────────────────────────────
  const alertsBlock = alerts.length>0 ? `
    <!-- BREAKING ALERTS -->
    <tr><td style="background:#450a0a;border-left:4px solid #EF4444;padding:24px 36px;">
      <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.28em;color:#EF4444;">&#9632; BREAKING ALERTS</p>
      ${alerts.map(a=>`<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:#FECACA;line-height:1.5;">${safe(a.text||a.title||'')}</p>`).join('')}
    </td></tr>` : ''

  // ── DJ'S PERSONAL NOTE (surprise!) ────────────────────────────────────────
  const leadTitle = lead ? lead.title : 'the Second Amendment'
  const djNote = `
    <!-- FROM DJ'S DESK -->
    <tr><td style="padding:0 40px;background:#0a0a0a;">
      <div style="height:1px;background:rgba(200,146,42,0.2);"></div>
    </td></tr>
    <tr><td style="background:#0f0f0f;padding:48px 40px;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; FROM DJ&rsquo;S DESK</p>
      <h2 style="margin:0 0 24px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:.03em;text-transform:uppercase;color:#F0EDE6;">Notes from Washington</h2>
      <p style="margin:0 0 18px;font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.65;color:#9CA3AF;max-width:520px;">This week, ${safe(trunc(leadTitle,80))}. That&rsquo;s the kind of story I built DownRange to surface.</p>
      <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#6B7280;">I&rsquo;m a gun owner in Washington State &mdash; one of the hardest states to carry in America. I built this platform because I got tired of finding out about my rights for the first time from people trying to take them away. Every story in this brief matters. Every law change affects someone.</p>
      <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#6B7280;">Keep your powder dry. Keep your eyes open. And keep reading.</p>
      <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:17px;color:#C8922A;">&mdash; DJ Cavalcanti<br><span style="font-size:13px;color:#4B5563;font-style:normal;font-family:'IBM Plex Mono','Courier New',monospace;letter-spacing:.1em;">DownRange Founder &nbsp;&bull;&nbsp; Washington State</span></p>
    </td></tr>`

  // ── STORY SPOTLIGHT (surprise! — left-border editorial) ───────────────────
  const spotlightStory = news[1] || lead
  const storySpotlight = spotlightStory ? (() => {
    const url   = `https://www.downrangeco.com/news/${spotlightStory.slug?.current||''}`
    const color = catColor(spotlightStory.category)
    return `
    <!-- STORY SPOTLIGHT -->
    <tr><td style="padding:0 40px;background:#0a0a0a;">
      <div style="height:1px;background:rgba(200,146,42,0.2);"></div>
    </td></tr>
    <tr><td style="background:#141414;border-left:4px solid #C8922A;padding:36px 36px 36px 36px;">
      <p style="margin:0 0 8px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;color:#C8922A;">STORY SPOTLIGHT</p>
      <h2 style="margin:0 0 4px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:30px;text-transform:uppercase;color:#F0EDE6;letter-spacing:.02em;">${safe(trunc(spotlightStory.title,80))}</h2>
      <p style="margin:0 0 4px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.14em;color:#374151;">${catLabel(spotlightStory.category)} &nbsp;&bull;&nbsp; DownRange</p>
      <div style="height:1px;background:rgba(200,146,42,0.2);margin:18px 0;"></div>
      ${spotlightStory.summary ? `<p style="margin:0 0 16px;font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.65;color:#9CA3AF;">${safe(trunc(spotlightStory.summary,220))}</p>` : ''}
      <a href="${url}" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#C8922A;text-decoration:none;font-weight:700;letter-spacing:.12em;">READ THE FULL STORY &rarr;</a>
    </td></tr>`
  })() : ''

  // ── INTEL TOOLS ──────────────────────────────────────────────────────────
  const TOOLS = [
    ['BALLISTICS CALC', '/ballistics'], ['RANGE FINDER', '/ranges'],
    ['GUN VALUE EST.',  '/value-estimator'], ['NFA TRACKER', '/nfa-tracker'],
    ['STATE LAWS',      '/laws'],
  ]

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>DownRange Intel Report &mdash; ${monthYear}</title>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');
    @media only screen and (max-width:640px) {
      .mob-full { width:100% !important; display:block !important; }
      .mob-hide { display:none !important; }
      .mob-pad  { padding:20px 20px !important; }
    }
  </style>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0a0a0a;-webkit-font-smoothing:antialiased;-ms-text-size-adjust:100%;">

<!-- PREHEADER -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0a0a0a;">
  ${news.length} stories. ${deals.length} deals. ${videoData.length} videos. Intelligence grade: ${grade}. Stay armed with information. &#8203;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0a;">
<tr><td align="center" style="padding:20px 12px 40px;">

<!-- OUTER WRAPPER -->
<table width="640" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;">

  ${isTest ? `
  <tr><td style="background:#7F1D1D;padding:10px 32px;text-align:center;">
    <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;color:#FCA5A5;letter-spacing:.3em;">&#9888; TEST SEND &mdash; NOT DELIVERED TO SUBSCRIBERS &#9888;</span>
  </td></tr>
  <tr><td style="height:2px;background:#0a0a0a;"></td></tr>` : ''}

  <!-- ═══ MASTHEAD ════════════════════════════════════════════════ -->
  <tr><td style="background:#111111;border-bottom:2px solid #C8922A;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:14px 36px;" align="left">
          <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#4B5563;">INTEL REPORT &nbsp;&bull;&nbsp; ISSUE ${issueNum} &nbsp;&bull;&nbsp; ${monthYear}</span>
        </td>
        <td style="padding:14px 36px;" align="right">
          <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#C8922A;">DOWNRANGECO.COM</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ═══ HERO ════════════════════════════════════════════════════ -->
  <tr><td style="background:linear-gradient(160deg,#0f0f0f 0%,#111111 50%,#0a0a0a 100%);padding:0;border-bottom:1px solid rgba(200,146,42,0.15);">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td style="padding:52px 40px 48px;">

        <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.36em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; WEEKLY INTELLIGENCE BRIEF</p>

        <!-- Logo -->
        <img src="https://downrangeco.com/img/logo.png" width="300" alt="DownRange" style="display:block;max-width:300px;height:auto;border:0;margin-bottom:28px;" />

        <h1 style="margin:0 0 6px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:52px;line-height:.92;letter-spacing:.02em;text-transform:uppercase;color:#F0EDE6;">THE FIGHT FOR</h1>
        <h1 style="margin:0 0 28px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:52px;line-height:.92;letter-spacing:.02em;text-transform:uppercase;color:#C8922A;">YOUR RIGHTS</h1>

        <p style="margin:0 0 10px;font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.6;color:#9CA3AF;max-width:480px;">Doesn&rsquo;t take weeks off. ${lead ? 'This week: <em style="color:#D1D5DB;">'+safe(trunc(lead.title,75))+'</em>' : 'Stay armed with intelligence.'}</p>

        <!-- Grade badge inline -->
        <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#4B5563;letter-spacing:.18em;">INTELLIGENCE GRADE &nbsp;
          <span style="background:${gradeBg};color:${gradeText};padding:3px 10px;font-weight:700;letter-spacing:.2em;">${grade}</span>
        </p>

        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="padding-right:12px;">
            <a href="https://www.downrangeco.com/news" style="display:inline-block;background:#C8922A;color:#09090B;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:14px 24px;border-bottom:3px solid #7a5010;text-decoration:none;">READ THIS WEEK&rsquo;S INTEL &rarr;</a>
          </td>
          <td>
            <a href="https://www.downrangeco.com/laws" style="display:inline-block;background:transparent;color:#F0EDE6;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:14px 24px;border:1px solid rgba(200,146,42,0.4);text-decoration:none;">YOUR STATE&rsquo;S LAWS</a>
          </td>
        </tr></table>

      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ STAT STRIP ══════════════════════════════════════════════ -->
  <tr><td style="background:#C8922A;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="padding:18px 40px;" align="left">
        <span style="font-family:'Anton',Impact,sans-serif;font-size:30px;color:#09090B;letter-spacing:.03em;">${news.length} STORIES</span>
        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.16em;color:#7a5010;display:inline-block;margin-left:16px;vertical-align:middle;text-transform:uppercase;">&bull;&nbsp; ${deals.length} deals &nbsp;&bull;&nbsp; ${videoData.length} videos &nbsp;&bull;&nbsp; ${ammoData.length} prices</span>
      </td>
      <td style="padding:18px 36px;" align="right" class="mob-hide">
        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.2em;color:#7a5010;text-transform:uppercase;">${dateStr}</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- ═══ BREAKING INTEL ══════════════════════════════════════════ -->
  ${alertsBlock}

  ${news.length>0 ? `
  <tr><td style="padding:48px 40px 8px;background:#0a0a0a;">
    <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#C8922A;">&#9658;&nbsp; BREAKING INTEL</p>
    <h2 style="margin:0 0 6px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:.03em;text-transform:uppercase;color:#F0EDE6;">This Week&rsquo;s Top Stories</h2>
    <p style="margin:0 0 0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;color:#374151;letter-spacing:.1em;">
      <a href="https://www.downrangeco.com/news" style="color:#C8922A;text-decoration:none;letter-spacing:.1em;">ALL NEWS &rarr;</a>
    </p>
  </td></tr>
  <tr><td style="height:16px;background:#0a0a0a;"></td></tr>
  ${leadHero}
  ${gridBlock}
  ${listRows}` : ''}

  ${djNote}
  ${storySpotlight}
  ${ammoBlock}
  ${dealBlock}
  ${videoBlock}
  ${nfaBlock}

  <!-- ═══ INTEL TOOLS ═══════════════════════════════════════════════ -->
  <tr><td style="padding:0 40px;background:#0a0a0a;">
    <div style="height:1px;background:rgba(200,146,42,0.2);"></div>
  </td></tr>
  <tr><td style="background:#0f0f0f;padding:32px 40px;">
    <p style="margin:0 0 16px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#374151;">YOUR INTELLIGENCE TOOLKIT</p>
    <table cellpadding="0" cellspacing="0" role="presentation"><tr>
      ${TOOLS.map(([label,path]) => `
      <td style="padding:0 4px 0 0;">
        <a href="https://www.downrangeco.com${path}" style="display:inline-block;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;color:#C8922A;background:#0a0a0a;border:1px solid rgba(200,146,42,0.25);padding:8px 12px;text-decoration:none;letter-spacing:.1em;font-weight:700;">${label}</a>
      </td>`).join('')}
    </tr></table>
  </td></tr>

  <!-- ═══ FOOTER ══════════════════════════════════════════════════ -->
  <tr><td style="background:#111111;border-top:2px solid #C8922A;padding:36px 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td align="left">
        <p style="margin:0 0 4px;font-family:'Anton',Impact,'Arial Black',sans-serif;font-size:22px;text-transform:uppercase;letter-spacing:.08em;color:#F0EDE6;">DOWNRANGE</p>
        <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#374151;">SECOND AMENDMENT INTELLIGENCE PLATFORM</p>
      </td>
      <td align="right">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="padding-left:16px;"><a href="https://www.downrangeco.com/news" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#C8922A;text-decoration:none;">News</a></td>
          <td style="padding-left:16px;"><a href="https://www.downrangeco.com/laws" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#C8922A;text-decoration:none;">Laws</a></td>
          <td style="padding-left:16px;"><a href="https://www.downrangeco.com/deals" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#C8922A;text-decoration:none;">Deals</a></td>
          <td style="padding-left:16px;"><a href="https://www.downrangeco.com" style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#C8922A;text-decoration:none;">Portal</a></td>
        </tr></table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
      <tr><td><div style="height:1px;background:rgba(200,146,42,0.15);"></div></td></tr>
      <tr><td style="padding-top:20px;text-align:center;">
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#374151;">You&rsquo;re receiving this because you subscribed at downrangeco.com. &nbsp;
          <a href="${unsubUrl}" style="color:#4B5563;text-decoration:underline;">Unsubscribe</a>
          &nbsp;&bull;&nbsp;
          <a href="https://www.downrangeco.com/privacy" style="color:#4B5563;text-decoration:underline;">Privacy</a>
        </p>
        <p style="margin:10px 0 0;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#374151;">&ldquo;Stay armed. Stay informed. Stay DownRange.&rdquo;</p>
      </td></tr>
    </table>
  </td></tr>

</table>
<!-- END OUTER WRAPPER -->

</td></tr>
</table>
</body>
</html>`
}

