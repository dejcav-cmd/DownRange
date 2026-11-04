#!/usr/bin/env python3
"""Content for the 2026 midterms Second Amendment blog post (data + HTML builders).
Facts are as reported on the morning of Nov 4, 2026. Anything not confirmed is labeled in the text."""
import html

AS_OF = "9:00 AM ET, Wednesday, November 4, 2026"

# (code, name, outlook label, result summary, 2A outlook)
# labels: Favorable | Tighter | Contested | Restrictive hold
STATES = [
 ("AL","Alabama","Favorable","Tommy Tuberville (R) won the open governor's seat, 52.0% to 48.0% over Doug Jones (D), AP projection. Republican legislature; no control change reported.","Republican trifecta continues. No new restrictions expected; Alabama stays on the permitless-carry side of the map."),
 ("AK","Alaska","Contested","Governor NOT CALLED. Jonathan Kreiss-Tomkins (D) leads the open seat in early counts; ranked-choice tabulation starts Nov. 18. Legislature control not called.","A Democratic win would be the first Democratic governor since Tony Knowles in 1998. An Alaska official has asked lawmakers to clarify state suppressor and short-barrel rules tied to the federal registry (SAF Grassroots Report)."),
 ("AZ","Arizona","Tighter","Katie Hobbs (D) re-elected (NBC News). Democrats say they won both legislative chambers (Arizona Mirror); that is a party claim, not an AP call.","If the Democratic claim holds, Hobbs gets a trifecta and gun-control bills that used to die in committee become live in 2027. Watch the final count."),
 ("AR","Arkansas","Favorable","Gov. Sarah Huckabee Sanders (R) re-elected. Issue 2, the arms-rights amendment, was approved with roughly 70% (AP call not confirmed in our sources).","Issue 2 (\"natural, fundamental, and individual\" right, covers ammunition and accessories) takes effect Jan. 1, 2027 and gives gun owners a stronger footing in court."),
 ("CA","California","Restrictive hold","Xavier Becerra (D) won the open governor's seat over Steve Hilton (R). Democratic supermajorities in the Legislature were not reported to change.","Policy continuity with Newsom-era law. Courts, not the ballot box, are where California gun rules change."),
 ("CO","Colorado","Restrictive hold","Phil Weiser (D) won the open seat; AP called it minutes after polls closed. Democratic legislature.","Democratic trifecta continues. FPC listed Colorado among states it urged to stop enforcing laws tied to the federal NFA registry."),
 ("CT","Connecticut","Restrictive hold","Ned Lamont (D) won a third term, 57.9% to 42.1% (AP projection). Legislature control unchanged as far as reported.","Democratic trifecta continues. FPC listed Connecticut on its NFA-registry advisory."),
 ("DE","Delaware","Restrictive hold","No governor race in 2026. Democrats keep control of the Legislature; final seat totals not verified.","Democratic trifecta continues."),
 ("DC","District of Columbia","Restrictive hold","Janeese Lewis George (D) was projected as the next mayor by AP on election night.","D.C. gun rules are driven by federal court rulings and congressional oversight more than by the mayor."),
 ("FL","Florida","Favorable","Byron Donalds (R) won the open governor's race (reported by Fox 35, NPR and others; AP call not confirmed in our sources). AG James Uthmeier (R) won.","Republican trifecta continues under a new governor. Permitless carry is already law; further expansion is plausible."),
 ("GA","Georgia","Tighter","Keisha Lance Bottoms (D) won the open governor's seat, a flip from Republican (multiple outlets). Tanya Miller (D) won attorney general. AP results show Democrats ahead 93-86 in the state House, but the House is NOT CALLED. The Senate stayed Republican.","Biggest swing in the Southeast. A Democratic governor can veto gun-rights bills, and a Democratic AG changes the state's litigation posture. FPC listed Georgia on its NFA-registry advisory."),
 ("HI","Hawaii","Restrictive hold","Josh Green (D) re-elected (AP). Democratic supermajorities continue.","The U.S. Supreme Court struck down Hawaii's default ban on carrying onto private property in Wolford v. Lopez this summer. Democratic supermajorities continue."),
 ("ID","Idaho","Favorable","Brad Little (R) won a third term, 56.5% to 32.8% (AP). Republican legislature.","No change expected: permitless carry and preemption stay the baseline."),
 ("IL","Illinois","Restrictive hold","JB Pritzker (D) listed as winner over Darren Bailey (R); our sources did not confirm an AP call. Democratic legislature.","The assault-weapons ban (PICA) and its litigation continue under Democratic control."),
 ("IN","Indiana","Favorable","No governor race in 2026. Legislative results were not verified at press time; Republicans held supermajorities going in.","No change expected; status quo is gun-owner friendly. Unverified until final legislative totals post."),
 ("IA","Iowa","Contested","Rob Sand (D) won the governor's race, flipping a seat Republicans held for more than two decades (AP). AP says he will likely face Republican legislative majorities.","A Democratic governor can veto Republican gun bills; Republicans would need supermajorities to override. Iowa's strict-scrutiny gun amendment (2022) stays in the constitution."),
 ("KS","Kansas","Contested","Governor NOT CALLED: Ty Masterson (R) vs. Cindy Holscher (D) was too close to call (KCUR). Attorney general also uncalled (Chris Mann, D, declared victory; Kris Kobach, R, had not conceded).","The governor's race decides whether Kansas keeps a veto against Republican carry and preemption bills. Hold judgment until it is called."),
 ("KY","Kentucky","Favorable","No governor race in 2026. Legislative results were not verified; Republicans held supermajorities (80-20 House, 32-6 Senate) going in.","No change expected. Unverified until legislative totals post."),
 ("LA","Louisiana","Favorable","No statewide race or regular legislative election in 2026.","Status quo: permitless carry and a Republican trifecta."),
 ("ME","Maine","Restrictive hold","Hannah Pingree (D) won the open governor's seat (AP call per MultiState). Democrat Troy Jackson beat Sen. Susan Collins (R) for the U.S. Senate (Ballotpedia).","A Democratic governor is a check on any gun-rights expansion. Legislative results were not verified."),
 ("MD","Maryland","Restrictive hold","Wes Moore (D) re-elected (AP projection reported by WMAR).","Annapolis agenda unchanged; continued tightening is likely if Democrats want it."),
 ("MA","Massachusetts","Restrictive hold","Maura Healey (D) re-elected. Question 9 passed: voters kept the 2024 gun law, with about 68.6% in favor (AP call per WBUR; margin per Yahoo).","The law stays in full: privately made firearms, licensing, red-flag orders. The repeal drive failed by a wide margin, though Second Amendment lawsuits against the law continue."),
 ("MI","Michigan","Tighter","Jocelyn Benson (D) won the open governor's seat, 54.5% to 43.8% (AP projection per MultiState). A Michigan Advance headline says Democrats reclaimed full control of state government; chamber details not verified.","A Democratic trifecta would put the Whitmer-appointed task force's ideas (assault-weapon and magazine limits, age 21, waiting periods) on the table. Benson was endorsed by Giffords PAC and Everytown, per NSSF."),
 ("MN","Minnesota","Tighter","Amy Klobuchar (DFL) is reported as winner for governor (NBC News headline; AP call not verified). Statepower reports the DFL won both chambers.","The Senate passed an assault-weapons ban after the Annunciation Church shooting but it stalled in a tied House. A DFL trifecta, if confirmed, revives it for 2027."),
 ("MS","Mississippi","Favorable","No governor race in 2026.","AG Lynn Fitch wants a lasting legislative fix so state law stops treating ATF Form 4 paperwork for suppressors as mandatory. Expect a pro-gun 2027 session."),
 ("MO","Missouri","Favorable","No governor race in 2026. Voters rejected Amendment 3 (not a gun measure).","The Second Amendment Preservation Act was struck down by the 8th Circuit; SCOTUS declined review in October 2025, and lawmakers declined to revive it in March 2026."),
 ("MT","Montana","Favorable","No governor race in 2026. Amy Eddy was reported the winner of the Supreme Court seat (Montana Free Press headline).","AG Austin Knudsen and legislators are pursuing removal of state rules tied to the federal NFA approval process."),
 ("NE","Nebraska","Favorable","Jim Pillen (R) re-elected (headlines; margin unverified). The Legislature is nonpartisan.","Status quo for gun owners; legislative filibuster math was the Democratic target and result is unverified."),
 ("NV","Nevada","Tighter","Aaron Ford (D) defeated Gov. Joe Lombardo (R), a flip (AP story). Nicole Cannizzaro (D) won attorney general. Democrats won a two-thirds Assembly; the Senate is one seat short, with races uncalled.","Lombardo vetoed Democratic gun bills in 2023 and 2025 (Everytown), including a ghost-gun ban. With a Democratic governor and a veto-proof Assembly, expect those bills back when the session starts in February."),
 ("NH","New Hampshire","Contested","Kelly Ayotte (R) re-elected, 51.1% to 47.3% (AP projection). Democrats appear to have won the House, Senate and Executive Council (Concord Monitor, preliminary).","Divided government. Ayotte's veto limits new restrictions; HB 1279 (defense of a third party as an affirmative defense) takes effect Jan. 1, 2027."),
 ("NJ","New Jersey","Restrictive hold","No state elections in 2026. The Legislature sits through Dec. 31.","Gov. Mikie Sherrill and a Democratic Legislature continue; the state's assault-weapons litigation will follow the Supreme Court's Dec. 2 AR-15 case."),
 ("NM","New Mexico","Restrictive hold","Deb Haaland (D) won governor (AP). Democrats were poised to expand their House majority; a two-thirds supermajority was too close to call.","Democratic trifecta continues."),
 ("NY","New York","Restrictive hold","Kathy Hochul (D) re-elected (AP). AG Letitia James (D) re-elected.","Hochul signed two more gun bills Oct. 21 (storage and ammunition background-check expansions, per NRA-ILA). Tightening continues."),
 ("NC","North Carolina","Contested","No governor race. Democrats flipped the state House (about 70-49, unofficial) for the first time since 2010. Republicans lost their veto-proof Senate majority; Senate District 24 is within 268 votes.","SB 50 (permitless carry) was vetoed by Gov. Josh Stein and needs one more House vote to override. The lame-duck session (Nov. 16-19 and Nov. 30-Dec. 18) is the window. After that, the math is gone."),
 ("ND","North Dakota","Favorable","No governor race in 2026. AG Drew Wrigley (R) re-elected; Republican control continues.","Gun-owner-friendly status quo."),
 ("OH","Ohio","Contested","Amy Acton (D) was projected the winner for governor by ABC, NBC, Axios and Time; an AP call was not confirmed in our sources. It is a flip. Sherrod Brown (D) beat Sen. Jon Husted (R).","Ohio already has permitless carry. Republicans in the Legislature lose a friendly signature. AG Andy Wilson asked lawmakers to reconcile state suppressor and short-barrel law with the federal change."),
 ("OK","Oklahoma","Favorable","Mike Mazzei (R) won the open governor's seat; Republicans swept statewide offices (NonDoc).","Permitless carry is law; status quo."),
 ("OR","Oregon","Contested","Gov. Tina Kotek (D) led Christine Drazan (R), 51.75% to 45.48% with 75% reporting (OPB). Not called in our sources.","Measure 114 (permit-to-purchase and magazine limits) was argued before the Oregon Supreme Court in Nov. 2025; a ruling and any legislative delay were not verified at press time."),
 ("PA","Pennsylvania","Tighter","Josh Shapiro (D) re-elected. Democrats claim they flipped the state Senate and kept the House (Spotlight PA); AP had not called those chambers.","If the Senate flip holds, bills that stalled before (universal registration HB 1593, red-flag, an assault-weapons ban) can reach the governor. The Pennsylvania Firearms Association, an advocacy group, warns of a Democratic trifecta."),
 ("RI","Rhode Island","Restrictive hold","Helena Foulkes (D) won the open governor's seat (AP called it at 1:08 AM ET).","The assault-weapons sales ban took effect July 1, 2026; existing owners are grandfathered. More tightening is likely."),
 ("SC","South Carolina","Favorable","Alan Wilson (R) elected governor (AP). On the federal side, Democrat Annie Andrews defeated the incumbent Republican senator (Ballotpedia, PBS).","State policy stays gun-owner friendly with a former attorney general as governor."),
 ("SD","South Dakota","Favorable","Larry Rhoden (R) won a full term (AP called it Nov. 3).","Status quo."),
 ("TN","Tennessee","Favorable","Marsha Blackburn (R) won the open seat with 45.5% to 42.9% for Jerri Green (D) (AP projection).","Republican control continues. The 2.6-point margin is far tighter than the state's usual results."),
 ("TX","Texas","Tighter","Gina Hinojosa (D) defeated Gov. Greg Abbott (R), the first Democratic governor since Ann Richards (AP count: about 57% to 41% with two-thirds of precincts in). Nathan Johnson (D) won attorney general. The Texas House is NOT CALLED.","The biggest swing of the night. Permitless carry (2021) is law, but a Democratic governor holds a veto and a Democratic AG replaces Ken Paxton. The House result decides whether Republicans keep a trifecta check."),
 ("UT","Utah","Favorable","No governor race in 2026. Legislative control not verified; Republicans presumed to hold.","Status quo. Unverified until totals post."),
 ("VT","Vermont","Contested","Phil Scott (R) won a sixth term; Democrat Amanda Janoo conceded. Democrats gained in the Legislature, but veto-proof status is unverified.","Scott has signed some gun-control laws before; larger Democratic numbers mean more bills in 2027."),
 ("VA","Virginia","Restrictive hold","No governor race in 2026. Voters approved three constitutional amendments (not gun-related).","Gov. Spanberger signed an assault-firearms and magazine sales ban (HB 217/SB 749) effective July 1, 2026. The NRA and others sued; the status of any injunction was not verified."),
 ("WA","Washington","Restrictive hold","No governor race in 2026. Five state Supreme Court races were not called election night.","Permit-to-purchase (HB 1163) takes effect May 1, 2027: a five-year state permit, training and a fee. Lawsuits under the state constitution are expected."),
 ("WV","West Virginia","Favorable","No governor race in 2026. Republicans keep control; Democrats gained seats (unofficial: about 21 of 100 in the House).","Pro-gun bills keep moving. Democrats gain a procedural blocking position on fast-track rules."),
 ("WI","Wisconsin","Tighter","David Crowley (D) won the open governor's seat. Democrats flipped both chambers (Senate 18-15, Assembly 53-46, WPR citing AP preliminary results). AG Josh Kaul (D) won. The state Supreme Court already has a 5-2 liberal majority.","A first Democratic trifecta in years plus a friendly court makes universal background checks and waiting periods realistic in 2027. FPC listed Wisconsin on its NFA-registry advisory."),
 ("WY","Wyoming","Favorable","Eric Barlow (R) won the open governor's seat with about 69% of a partial count (Cowboy State Daily).","Permitless carry state; status quo."),
]

WATCH = [
 ("Texas","A Democratic governor and attorney general arrive in January. The House count decides how much a Republican legislature can still do."),
 ("Georgia","From a Republican trifecta to a Democratic governor and a House that leans Democratic but is not called. Expect vetoes, not new laws, in either direction."),
 ("Nevada","A governor who will sign what Lombardo vetoed, plus a veto-proof Assembly. The February session is the first test."),
 ("North Carolina","One House vote short of overriding the permitless-carry veto, with a lame-duck window that closes in December."),
 ("Wisconsin","First Democratic trifecta in years, plus a 5-2 liberal Supreme Court."),
 ("Michigan","A reported Democratic trifecta and a governor-appointed task force with a ready-made list."),
 ("Arizona","Democrats claim both chambers. If AP agrees, Hobbs's vetoes become signatures."),
 ("Pennsylvania","The Senate flip is a party claim; if it holds, long-stalled bills can move."),
 ("Ohio","A Democratic governor ends a 15-year Republican run; state law on suppressors and short barrels still needs a legislative fix."),
 ("Minnesota","A DFL trifecta would revive the assault-weapons ban that stalled in a tied House."),
]

TIMELINE = [
 ("Nov. 13","North Carolina counties canvass; the close Senate District 24 race can head to a recount."),
 ("Nov. 16-19, Nov. 30-Dec. 18","North Carolina lame-duck sessions: the window for a permitless-carry (SB 50) veto override."),
 ("Nov. 18","Alaska begins ranked-choice tabulation for governor and Ballot Measure 2."),
 ("Dec. 2","U.S. Supreme Court hears the AR-15 ban cases, Viramontes v. Cook County and Grant v. Higgins. A decision is expected by mid-2027."),
 ("Dec. 31","Michigan, New Jersey and Ohio legislatures wrap their sessions (SAF Grassroots Report)."),
 ("Jan. 1, 2027","Arkansas Issue 2 and New Hampshire HB 1279 take effect."),
 ("January 2027","New Congress seated; new governors take office in Texas, Georgia, Nevada, Ohio and Iowa, subject to final calls."),
 ("February 2027","Nevada's legislative session starts."),
 ("May 1, 2027","Washington's permit-to-purchase law (HB 1163) takes effect."),
]

SOURCES = [
 ("Ballotpedia News: Democrats win U.S. House and Senate majorities","https://news.ballotpedia.org/2026/11/04/democrats-win-u-s-house-and-senate-majorities/"),
 ("PBS NewsHour: Democrats take control of the Senate","https://www.pbs.org/newshour/politics/democrats-take-control-of-the-senate-after-winning-key-midterm-races"),
 ("WBUR: Massachusetts Question 9 result","https://wbur.org/news/2026/11/04/question-9-gun-repeal-election-results"),
 ("Yahoo News: Massachusetts voters back landmark gun law","https://www.yahoo.com/news/politics/articles/mass-voters-back-landmark-gun-054237754.html"),
 ("Ballotpedia: Firearms policy ballot measures","https://ballotpedia.org/Firearms_policy_ballot_measures"),
 ("SAF Grassroots Legislative Report, Nov. 2, 2026","https://www.thegunmag.com/grassroots-legislative-report-november-2-2026/"),
 ("Click2Houston: Gina Hinojosa wins Texas governor","https://www.click2houston.com/decision-2026/2026/11/04/gina-hinojosa-wins-texas-governors-race-first-democrat-in-36-years/"),
 ("Texas Tribune: Texas House outcomes","https://www.texastribune.org/2026/11/03/texas-house-legislature-outcomes-control-republicans-democrats-2026/"),
 ("KSAT: Democrats await Texas House results","https://www.ksat.com/news/texas/2026/11/04/amid-generational-wave-democrats-await-texas-house-results-hoping-for-control/"),
 ("Georgia Recorder: Democrats flip statewide offices","https://georgiarecorder.com/2026/11/04/democrats-flip-statewide-offices-up-and-down-the-ballot-in-georgia-state-house-is-in-play/"),
 ("The Nevada Independent: Democrats lead governor's race, sweep statewide offices","https://thenevadaindependent.com/article/nevada-democrats-lead-governors-race-sweep-other-statewide-offices-in-historic-night"),
 ("Everytown: Governor Lombardo kills gun safety bills again","https://www.everytown.org/press/deja-veto-governor-lombardo-kills-all-gun-safety-bills-again/"),
 ("Wisconsin Public Radio: Assembly and Senate results","https://www.wpr.org/news/wisconsin-assembly-senate-election-results-2026"),
 ("Arizona Mirror: Democrats declare victory in the Legislature","https://azmirror.com/2026/11/03/the-trifecta-democrats-declare-victory-in-fight-for-control-of-arizona-legislature/"),
 ("Spotlight PA: Pennsylvania legislature control","https://www.spotlightpa.org/news/2026/11/pennsylvania-legislature-control-election-results-elections/"),
 ("Concord Monitor: New Hampshire Democrats take State House, Senate","https://www.concordmonitor.com/2026/11/03/n-h-democrats-take-state-house-senate-and-executive-council/"),
 ("NRA-ILA: New Hampshire Gov. Ayotte signs pro-gun reforms","https://www.nraila.org/articles/20260721/new-hampshire-governor-ayotte-signs-pro-gun-reforms-into-law"),
 ("NRA-ILA: New York Gov. Hochul signs more gun control","https://www.nraila.org/articles/20261022/new-york-gov-hochul-signs-more-gun-control-this-week"),
 ("Bearing Arms: North Carolina permitless carry override","https://bearingarms.com/camedwards/2026/08/10/north-carolina-house-speaker-says-permitless-carry-bill-could-still-get-veto-override-vote-n1233459"),
 ("Yahoo News: Democrats win control of the North Carolina House","https://www.yahoo.com/news/politics/articles/democrats-win-control-north-carolina-062155242.html"),
 ("Cardinal News: Virginia assault-weapons ban and lawsuit","https://cardinalnews.org/2026/05/15/spanberger-signs-bill-to-prohibit-assault-weapons-nra-and-virginia-organizations-sue/"),
 ("SportCo: Washington 2027 firearm policy changes","https://sportco.com/2027-wa-state-firearm-policy-changes/"),
 ("OPB: Oregon election results","https://www.opb.org/elections-2026/"),
 ("SCOTUSblog: The Court's big gun cases and what's next","https://www.scotusblog.com/2026/07/the-courts-big-gun-cases-and-whats-next/"),
 ("Everytown: Supreme Court assault-weapons ban case summary","https://www.everytown.org/supreme-court-assault-weapons-ban-case-summary-oral-argument/"),
 ("ConcealedCarry.com: ATF drops NFA registration for suppressors and SBRs","https://www.concealedcarry.com/court-decisions/atf-drops-nfa-registration-for-suppressors-sbrs-and-sbss-what-changed-and-what-didnt/"),
 ("Fastbound: ATF rulemaking reform actions","https://www.fastbound.com/ffl-blog/atf-34-new-era-of-reform-actions/"),
 ("NSSF: Michigan's 2026 elections put gun bans and Second Amendment protections at stake","https://www.nssf.org/articles/michigans-2026-elections-put-gun-bans-and-second-amendment-protections-at-stake/"),
 ("Pennsylvania Firearms Association: Your gun rights in 2027 under a Democrat trifecta","https://www.pennsylvaniafirearmsassociation.org/latest-news/your-gun-rights-in-2027-under-a-democrat-trifecta/"),
 ("MultiState: 2026 election results by state","https://www.multistate.us/elections"),
]

LABEL_STYLE = {
 "Favorable": ("#16A34A", "FAVORABLE"),
 "Tighter": ("#EF4444", "TIGHTER"),
 "Contested": ("#E5A83A", "CONTESTED"),
 "Restrictive hold": ("#9CA3AF", "RESTRICTIVE HOLD"),
}

A = 'style="color:var(--gold);text-decoration:underline;"'


def a(href, text, ext=True):
    extra = ' target="_blank" rel="noopener"' if ext else ""
    return f'<a href="{html.escape(href, quote=True)}" {A}{extra}>{text}</a>'


def esc(s):
    return html.escape(s, quote=False)


def state_table():
    rows = []
    for code, name, label, res, out in STATES:
        color, lab = LABEL_STYLE[label]
        if code == "DC":
            link = a("/laws", "Laws", False)
        else:
            link = a(f"/laws/{code}", f"{code} laws", False)
        rows.append(
            f'<tr style="border-bottom:1px solid var(--border);vertical-align:top;">'
            f'<td style="padding:10px 8px;white-space:nowrap;"><strong>{esc(name)}</strong><br/>{link}</td>'
            f'<td style="padding:10px 8px;"><span style="display:inline-block;border:1px solid {color};color:{color};'
            f'font-family:\'IBM Plex Mono\',monospace;font-size:10px;padding:2px 6px;letter-spacing:.05em;">{lab}</span></td>'
            f'<td style="padding:10px 8px;font-size:.92rem;line-height:1.55;">{esc(res)}</td>'
            f'<td style="padding:10px 8px;font-size:.92rem;line-height:1.55;">{esc(out)}</td></tr>'
        )
    head = ('<tr style="border-bottom:2px solid var(--gold);text-align:left;font-family:\'IBM Plex Mono\',monospace;'
            'font-size:11px;letter-spacing:.06em;color:var(--gold);"><th style="padding:8px;">STATE</th>'
            '<th style="padding:8px;">OUTLOOK</th><th style="padding:8px;">WHAT HAPPENED</th>'
            '<th style="padding:8px;">2A OUTLOOK (DOWNRANGE READ)</th></tr>')
    return ('<div style="overflow-x:auto;margin:1rem 0 2rem;"><table style="width:100%;min-width:760px;border-collapse:collapse;'
            'color:#CBD5E1;font-family:\'IBM Plex Sans\',sans-serif;">' + head + "".join(rows) + "</table></div>")


def scorecard():
    counts = {}
    for _, _, label, _, _ in STATES:
        counts[label] = counts.get(label, 0) + 1
    cells = []
    for label in ["Favorable", "Tighter", "Contested", "Restrictive hold"]:
        color, lab = LABEL_STYLE[label]
        cells.append(
            f'<div style="flex:1 1 150px;border:1px solid {color};padding:14px;text-align:center;">'
            f'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:2.6rem;color:{color};line-height:1;">{counts[label]}</div>'
            f'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:.08em;color:#CBD5E1;">{lab}</div></div>'
        )
    return '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:1rem 0 .5rem;">' + "".join(cells) + "</div>"


def timeline():
    items = "".join(f"<li><strong>{esc(d)}:</strong> {esc(t)}</li>" for d, t in TIMELINE)
    return f"<ul>{items}</ul>"


def watch():
    items = "".join(f"<li><strong>{esc(s)}.</strong> {esc(t)}</li>" for s, t in WATCH)
    return f"<ul>{items}</ul>"


def sources():
    items = "".join(f"<li>{a(u, esc(t))}</li>" for t, u in SOURCES)
    return f"<ul>{items}</ul>"


def build_body(hero_credit_html, img_one, img_two, img_three):
    laws = a("/laws", "DownRange gun laws hub", False)
    news = a("/news", "DownRange news", False)
    blog = a("/blog", "the DownRange blog", False)
    nfa = a("/blog/nfa-transfer-guidance-suppressors-sbrs-2026", "our NFA breakdown", False)
    parts = []
    parts.append(f'<p style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:var(--text-dim);">Results as of {AS_OF}. Counts and calls change as votes are tallied; races marked NOT CALLED had no projected winner in our sources.</p>')
    parts.append(hero_credit_html)
    parts.append("<h2>What Changed</h2>")
    parts.append("<ul>"
        "<li><strong>Congress flipped.</strong> CBS, CNBC and CNN report Democrats won both the House and the Senate. Ballotpedia counted at least 54 Senate seats and 231 House seats for Democrats at 1:30 AM ET, with counting still under way. Seven Republican-held Senate seats flipped: Iowa, Kansas, Maine, North Carolina, Ohio, South Carolina and Texas.</li>"
        "<li><strong>Governors.</strong> Democrats flipped Georgia, Iowa, Nevada, Ohio and Texas, according to multiple outlets. Alaska and Kansas were not called. Stateline's headline says Democrats are set to hold a majority of governorships for the first time in 16 years.</li>"
        "<li><strong>Two gun ballot measures, two landslides.</strong> Massachusetts voters kept their 2024 gun law (about 68.6%). Arkansas voters approved a broader arms-rights amendment (roughly 70%). Ballotpedia lists only those two firearms measures nationwide.</li>"
        "<li><strong>Statehouses.</strong> Democrats reported flipping both chambers in Wisconsin, the North Carolina House, and, by their own claims, chambers in Arizona, Pennsylvania, Georgia, Michigan, Minnesota and New Hampshire. Several of those calls were still pending.</li>"
        "</ul>")
    parts.append(img_one)
    parts.append("<h2>The Scorecard</h2>")
    parts.append("<p>Our read of the 2027 direction for gun owners in each state, based on who won and what is already on the books. It is an analysis, not a forecast of any single bill.</p>")
    parts.append(scorecard())
    parts.append('<p style="font-size:.85rem;color:var(--text-dim);">Favorable: little change or an expansion of gun rights. Tighter: the election made new restrictions more likely. Contested: a new check, divided government or an uncalled race. Restrictive hold: already restrictive, and the results do not change that.</p>')
    parts.append("<h2>Federal Outlook</h2>")
    parts.append("<p><strong>Congress.</strong> A Democratic House and Senate make national concealed-carry reciprocity (H.R. 38) effectively dead after January. It advanced out of House Judiciary in March 2025 but never got a House floor vote, and the Senate filibuster blocked it regardless. The Hearing Protection Act and the SHORT Act face the same arithmetic. In the other direction, a Democratic House can pass assault-weapon, magazine and universal-background-check bills, but those need 60 votes in the Senate and would meet a presidential veto. The real levers are oversight hearings, appropriations riders on ATF, and confirmations. That is DownRange analysis; no Democratic leader has announced a gun package since the results.</p>")
    parts.append(f"<p><strong>NFA and ATF.</strong> The One Big Beautiful Bill Act cut the tax on suppressors, short-barreled rifles and shotguns, and AOWs to $0 on Jan. 1, 2026. After a Texas federal court ruling in August, ATF said on Oct. 9 it would stop enforcing NFA approval, registration and marking for those items, which we covered in {nfa}. It is enforcement policy, not repeal. A future Congress could attach a new tax, a court could dissolve the injunction, or a later administration could rescind the guidance. Machine guns and destructive devices are untouched. ATF's proposed rules to rescind the pistol-brace rule and revise the \"engaged in the business\" definition closed comment on Aug. 4; if they are not final before January, they face congressional oversight.</p>")
    parts.append("<p><strong>Supreme Court.</strong> On Dec. 2 the justices hear Viramontes v. Cook County and Grant v. Higgins, the Court's AR-15-style rifle ban cases; a decision is expected by mid-2027 (Everytown, SCOTUSblog). The Court already decided two big cases this summer: Wolford v. Lopez struck down Hawaii's default ban on carrying onto private property, and United States v. Hemani limited the use of the drug-user gun ban (18 U.S.C. 922(g)(3)) against an occasional marijuana user. Reporting indicates Republicans plan a lame-duck push on judicial confirmations before the Senate changes hands (Law360, Punchbowl).</p>")
    parts.append("<p><strong>What the groups say.</strong> Before the election, the NRA told gun owners that \"everything\" was on the ballot (The Washington Times, Oct. 30), while Giffords backed candidates in Pennsylvania and Everytown pledged millions for statehouse races. We could not find post-election statements from NRA-ILA, GOA, FPC, SAF, NSSF, Giffords, Everytown or Brady at press time, and we are not guessing what they will say. We will add them when they publish.</p>")
    parts.append(img_two)
    parts.append("<h2>The Biggest Surprises</h2>")
    parts.append("<ul>"
        "<li><strong>Texas flipped the governor's office and the attorney general's office.</strong> Democrat Gina Hinojosa led Greg Abbott roughly 57% to 41% in the AP count with two-thirds of precincts reporting, the first Democratic governor since Ann Richards. Nathan Johnson (D) won the AG race Ken Paxton is leaving. Paxton also lost his Senate race to James Talarico.</li>"
        "<li><strong>South Carolina and Kansas Senate seats flipped.</strong> Ballotpedia reports four Republican incumbents lost re-election.</li>"
        "<li><strong>Both gun ballot measures won big, in opposite directions.</strong> Voters in a blue state kept a strict law and voters in a red state wrote a stronger arms right into their constitution. Neither side can claim the electorate moved against it on guns.</li>"
        "<li><strong>Federal relief and state law now point different ways.</strong> ATF stopped policing NFA registration for suppressors and short-barreled guns, but about 15 states still require a Form 4 or similar approval, according to NSSF. Ohio, Mississippi and Montana officials have already asked lawmakers to fix their statutes. Owners in states that have not acted could still face state charges.</li>"
        "<li><strong>North Carolina is a one-vote story.</strong> Republicans lost their veto-proof Senate majority and the House, but a permitless-carry veto override sits one House vote short, with a lame-duck window that closes in December.</li>"
        "<li><strong>Tennessee was close.</strong> Marsha Blackburn won with 45.5% to 42.9% in a state Republicans usually carry comfortably.</li>"
        "</ul>")
    parts.append("<h2>State-by-State: All 50 States and D.C.</h2>")
    parts.append(f"<p>Every state and the District of Columbia, with the result, who called it where we could tell, and a plain-language 2A outlook. Where a race or chamber was uncalled, it says so. Where we could not verify a result, we say that instead of guessing. For the full text of each state's gun laws, use the {laws}; each row links to its state page.</p>")
    parts.append(state_table())
    parts.append("<h2>Ten States to Watch in 2027</h2>")
    parts.append(watch())
    parts.append(img_three)
    parts.append("<h2>Laws and Dates to Circle</h2>")
    parts.append(timeline())
    parts.append("<h2>What Gun Owners Should Do Now</h2>")
    parts.append("<ul>"
        "<li><strong>Check your state, not just ATF.</strong> If you own or plan to buy a suppressor or short-barreled rifle, find out whether your state still requires NFA approval. Federal non-enforcement does not repeal a state law. Start with " + a("/laws", "your state's page") + ".</li>"
        "<li><strong>Do not assume the NFA change is permanent.</strong> It is a policy that a court, Congress or a future administration can reverse. Talk to a firearms attorney in your state about whether to register voluntarily.</li>"
        "<li><strong>Mark your calendar.</strong> Dec. 2 (Supreme Court), Jan. 1 (Arkansas and New Hampshire laws), February (Nevada session), May 1 (Washington permit-to-purchase).</li>"
        "<li><strong>Read the actual bills.</strong> When legislatures open in January, track what is introduced in your state rather than relying on a summary.</li>"
        "<li><strong>Talk to your new legislators and governor's office.</strong> Whatever your position, committee hearings and public comment periods are where gun law is shaped.</li>"
        "<li><strong>Keep your carry paperwork current.</strong> Renewals, reciprocity maps and training requirements change with each session. Our " + a("/laws/reciprocity", "reciprocity page") + " is a starting point.</li>"
        "</ul>")
    parts.append("<h2>What Both Sides Say</h2>")
    parts.append("<p>Gun-rights groups argue that the results put hard-won gains at risk, point to Arkansas as proof of public support for a stronger right, and note that a state's gun-owning voters are not all in one party. Gun-control groups argue that the results show public appetite for stricter laws, point to Massachusetts, and say a Democratic Congress will probe ATF's decisions. Both are claims; the statutes and court rulings above are what actually decide outcomes. Our reporting and the sources below are listed so you can check any of it yourself.</p>")
    parts.append("<h2>Sources</h2>")
    parts.append(sources())
    parts.append(f'<p style="font-size:.9rem;color:var(--text-dim);">More coverage: {news} and {blog}. This article is analysis, not legal advice. We will update it as outstanding races are called.</p>')
    parts.append('<p style="margin-top:2rem;border-top:1px solid var(--border);padding-top:1rem;"><em>&mdash; DJ Cavalcanti</em><br/><strong>DJ Cavalcanti, DownRange Founder</strong></p>')
    return "\n".join(p for p in parts if p)
