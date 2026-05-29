export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// Pre-written article bodies — pushed to Sanity on first call
const ARTICLES = [
  {
    slug: 'atf-pistol-brace-rule-two-years',
    body: "<h2>The ATF Pistol Brace Rule Two Years Later: Where Things Actually Stand</h2>\n\n<p>Two years ago the ATF dropped the pistol brace rule and the firearms community lost its mind \u2014 some people registered, some didn't, and a whole lot of people got confused about what was actually legal. So let's talk about where things stand now and what it means for anyone who owns a braced pistol.</p>\n\n<h2>What the Rule Actually Did</h2>\n\n<p>The January 2023 rule classified pistols equipped with stabilizing braces as short-barreled rifles under the NFA if the overall length or barrel length met SBR thresholds. ATF gave owners four options: register the firearm as an SBR (tax-free during the amnesty window), remove the brace, convert it to a rifle, or turn it in.</p>\n\n<p>The practical effect: millions of AR pistols, MPX pistols, B&T APC9Ks, and similar firearms that had been legal for years were suddenly in a gray zone. Owners who ignored the rule were technically in possession of unregistered SBRs.</p>\n\n<p>Then the courts got involved. Preliminary injunctions in multiple circuits protected members of certain organizations and plaintiffs from enforcement. The rule became one of the most legally contested ATF actions in decades.</p>\n\n<h2>The Court Battles That Followed</h2>\n\n<p>The Fifth Circuit struck down the rule in <strong>Mock v. Garland</strong>, finding the ATF exceeded its statutory authority. The Eleventh Circuit took a different view in a separate challenge. The Supreme Court's <em>Loper Bright</em> decision in 2024 \u2014 which gutted Chevron deference \u2014 changed the landscape further. Courts no longer defer to agency interpretations of ambiguous statutes.</p>\n\n<p>What this means practically: federal enforcement of the brace rule has been functionally paralyzed. Multiple circuit splits, no clear SCOTUS resolution, and a political environment where the current administration has zero appetite for pushing enforcement.</p>\n\n<h2>What This Means for Gun Owners Right Now</h2>\n\n<p>If you own a braced pistol, here is my honest read of the situation:</p>\n\n<ul>\n<li><strong>Registered SBRs from the amnesty period</strong>: You're compliant. No issue.</li>\n<li><strong>Living in a Fifth Circuit state</strong> (TX, LA, MS): You have the strongest legal protection from enforcement.</li>\n<li><strong>Everyone else</strong>: The rule is technically still on the books in some form. Enforcement has been negligible. That doesn't mean zero risk.</li>\n<li><strong>New braced pistol purchases</strong>: The market hasn't died. Manufacturers kept building them. Dealers kept selling them.</li>\n</ul>\n\n<p>The Bruen decision also complicates things. ATF rules that impose NFA-style registration requirements on previously legal items have a harder time surviving text-and-history scrutiny. Several district courts have noted this.</p>\n\n<h2>The Industry Response</h2>\n\n<p>SB Tactical and Gear Head Works never stopped selling braces. Palmetto State Armory kept listing AK pistols and AR pistols with braces. The practical reality is the market largely ignored the rule once the injunctions piled up.</p>\n\n<p>Some manufacturers pivoted \u2014 offering the same guns as <strong>folder-stock pistols</strong> without a brace at all, which sidesteps the issue entirely. Others started selling the receivers and uppers separately so buyers could configure them legally in their home state.</p>\n\n<p>The SBR silencer combo, which was the primary reason most people ran braces in the first place (short, suppressed, controllable), is still absolutely viable. If you're running a suppressed 300 Blackout pistol, nothing about that has fundamentally changed in terms of the suppressor end.</p>\n\n<h2>DownRange Bottom Line</h2>\n\n<p>The ATF pistol brace rule is in legal limbo and has been for two years. Enforcement is minimal, courts keep blocking it, and the regulatory landscape post-Loper Bright makes an agency power grab like this harder to sustain. If you registered, great. If you didn't and you're in a protected circuit, you're in a defensible position. If you're buying new: choose your configuration carefully, understand your state's laws on SBRs and braces, and stay current on the litigation. This isn't over, but the rule is effectively toothless right now.</p>",
  },
  {
    slug: 'home-defense-basics',
    body: "<h2>Home Defense Basics: The Setup That Actually Works</h2>\n\n<p>Most home defense advice on the internet is written by people who've never had to clear a house at 2 AM with their heart rate at 160. The gun is actually the easy part. The plan, the communication, the layout \u2014 that's what determines whether you come out of a home invasion scenario in one piece.</p>\n\n<h2>The Right Gun for Home Defense</h2>\n\n<p>I've had this argument a hundred times and the answer hasn't changed: a <strong>12 gauge pump shotgun or a 9mm carbine</strong> is the right home defense firearm for most people. Not your EDC pistol. Not an AR with a 16-inch barrel that you can't maneuver around corners.</p>\n\n<p>Here's my reasoning:</p>\n\n<ul>\n<li><strong>Mossberg 590 or Remington 870</strong>: Reliable, simple, devastating stopping power with 00 buckshot. The manual of arms under stress is uncomplicated. Mossberg's tang safety is better than Remington's trigger guard safety for stress manipulation.</li>\n<li><strong>Ruger PC Carbine or CZ Scorpion</strong>: 9mm PCC gives you lower recoil, 30+ rounds, and the ability to mount a light easily. Takes Glock mags if you're already in that ecosystem.</li>\n<li><strong>Dedicated home defense pistol</strong>: If you go handgun, use something with a light attached permanently \u2014 a Streamlight TLR-1 or Surefire X300. Your other hand should be free to open doors, call 911, and grab your kid.</li>\n</ul>\n\n<p>What matters more than the specific gun: the weapon light. You cannot shoot what you cannot identify. A light is mandatory, not optional.</p>\n\n<h2>The Plan Comes Before the Gun</h2>\n\n<p>Every person in your house needs to know what to do when something goes bump at night. This isn't optional. Write it out, rehearse it, make sure kids understand it.</p>\n\n<p><strong>Hardening your position</strong>: In most residential scenarios, the right move is to fortify in your bedroom, call 911, and wait for police. You are not obligated to clear your house. Your legal exposure goes up significantly when you leave your safe room and start moving toward a threat.</p>\n\n<p><strong>Safe room requirements</strong>: Solid-core door with a good deadbolt. Phone charged and accessible. Firearm and light staged and accessible. Know where your family is before you start thinking about shooting anything.</p>\n\n<p><strong>Communication signals</strong>: Everyone in the house needs a verbal cue \u2014 something like \"I have the gun, get behind me\" \u2014 so family members don't get shot because they came around a corner unexpectedly.</p>\n\n<h2>Ammunition Selection</h2>\n\n<p>For home defense with a shotgun: <strong>Hornady Critical Defense 00 Buck</strong> or Federal FliteControl 00 Buck. The FliteControl wad keeps the pattern tighter at 15 yards \u2014 relevant for hallway-length shots. For pistol: Federal HST 147gr in 9mm, or Speer Gold Dot. Both have deep penetration data and consistent expansion.</p>\n\n<p>People worry too much about over-penetration with 00 buck. Yes, it penetrates drywall. So does every other load that's effective against a human being. The goal is stopping the threat quickly, which requires adequate penetration.</p>\n\n<p>Avoid birdshot for home defense. I don't care what the YouTube video said. Pattern data shows it doesn't penetrate adequately through heavy clothing at typical indoor distances.</p>\n\n<h2>DownRange Bottom Line</h2>\n\n<p>The best home defense setup is a weapon-light-equipped firearm you can operate under stress, a clear plan your household has actually practiced, and a fortified position you understand. Get a light if you don't have one. Buy HST or Gold Dot in whatever caliber you're running. Practice loading and unloading your home defense gun in the dark until it's automatic. The gun isn't what will save you \u2014 the preparation will.</p>",
  },
  {
    slug: 'owb-to-aiwb-carry-switch',
    body: "<h2>Making the Switch from OWB to AIWB Carry: What Nobody Tells You</h2>\n\n<p>I carried OWB for four years before I switched to AIWB. I thought the transition would be easy \u2014 same gun, different holster. I was wrong. It took about three months before AIWB felt natural and another two before my draw was actually better than it had been OWB. Here's what I wish I'd known before starting.</p>\n\n<h2>Why Most People Switch</h2>\n\n<p>The honest reason most people switch from OWB to AIWB is concealment. OWB at 3-4 o'clock with a full-size gun requires a cover garment that's long enough to cover the entire holster \u2014 and in warm weather, or business casual environments, that's a real constraint. AIWB at the appendix puts the gun in front of your hip, where the body's natural taper makes it easier to conceal under a tucked shirt or a shorter cover garment.</p>\n\n<p>The secondary reason is draw speed. A well-set-up AIWB holster with the right ride height puts the gun in a position where your draw arc is shorter and more efficient. Competition shooters figured this out years ago. Most people running AIWB at matches are doing it because it's faster, not because they're trying to make a fashion statement.</p>\n\n<h2>Gear That Actually Works</h2>\n\n<p>Not all AIWB holsters are equal. I've run a <strong>Tenicor Certum3</strong>, an <strong>Alan Sherrod (JMCK) Ruger Gunfighter</strong>, and a <strong>PHLster Floodlight</strong>. The PHLster Floodlight is where I landed for a light-bearing setup with a Streamlight TLR-7A on a Glock 19. The claw on a good AIWB holster is non-negotiable \u2014 it levers the grip into your body when your belt pulls the bottom of the holster outward.</p>\n\n<ul>\n<li><strong>PHLster Enigma</strong>: If you're carrying without a belt (gym shorts, pajamas, etc.), the Enigma chassis is worth every penny. I've run it under athletic gear with a Shield Plus and it disappears.</li>\n<li><strong>Tenicor Certum3 or Velo4</strong>: Best for Glock 19/17 if you want zero drama. The ride height is adjustable, retention is excellent, re-holster is smooth.</li>\n<li><strong>JM Custom Kydex</strong>: If you're on a budget, JMCK makes competitive-quality holsters at a lower price point.</li>\n</ul>\n\n<p>Gun size matters. I switched from a Glock 17 to a Glock 19 when I moved to AIWB. The shorter grip prints less. A lot of people run Glock 19 or a Shield Plus for AIWB specifically for that reason. If you're trying to AIWB a full-size double-stack with a 17-round magazine, you're making it harder on yourself.</p>\n\n<h2>The Draw Stroke Is Different</h2>\n\n<p>Your OWB draw is a lateral movement \u2014 hand sweeps back to the hip, establishes grip, draws out and forward. AIWB is a different motion. The hand comes down to the front of the hip, you establish grip with the gun muzzle pointing more toward the ground, then you clear the holster with a push-forward motion before rotating up.</p>\n\n<p>The safety concern people raise about AIWB \u2014 pointing the gun at yourself during the draw \u2014 is real but manageable. The standard is: <strong>keep your trigger finger outside the guard until the muzzle is on target</strong>. If you're using a holster with a solid trigger guard (no fabric or soft material), your risk of an unintended discharge drops to near zero. Do dry fire practice until your trigger finger position is automatic.</p>\n\n<h2>Real-World Comfort and Clothing Changes</h2>\n\n<p>It takes time to figure out your body position. Sitting in a car with a G19 AIWB at true 12 o'clock is uncomfortable for most people until they adjust. Most AIWB carriers end up between 12 and 1:30 depending on body type. Wider belts (1.5 inches minimum) distribute the weight better. A Vedder Lighttuck or Crossbreed doesn't work for AIWB \u2014 you want a purpose-built AIWB holster, not a hybrid.</p>\n\n<h2>DownRange Bottom Line</h2>\n\n<p>AIWB is worth it for concealment and draw speed, but give yourself a realistic timeline. Three months to comfortable, five to six months before your draw is actually faster than your OWB was. Get a claw. Get a good belt. Run a gun that fits the position \u2014 a Glock 19 or compact equivalent. Do your dry fire reps before you start carrying live. The switch is worth making, but don't expect overnight results.</p>",
  },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = []
  for (const art of ARTICLES) {
    const post = await sanity.fetch(
      '*[_type=="blogPost" && slug.current==$s][0]{_id,title}',
      { s: art.slug }
    ).catch(()=>null)

    if (!post?._id) {
      results.push({ slug: art.slug, ok: false, error: 'Post not found in Sanity' })
      continue
    }

    const existing = await sanity.fetch(
      '*[_type=="blogPost" && slug.current==$s][0]{bodyLen: length(body)}',
      { s: art.slug }
    ).catch(()=>null)

    if (existing?.bodyLen > 500) {
      results.push({ slug: art.slug, ok: true, skipped: true, reason: 'already has body' })
      continue
    }

    await sanity.patch(post._id).set({ body: art.body, published: true }).commit()
    results.push({ slug: art.slug, ok: true, chars: art.body.length })
  }

  return NextResponse.json({ ok: true, results })
}

// Also expose as GET for easy triggering
export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = []
  for (const art of ARTICLES) {
    const post = await sanity.fetch(
      '*[_type=="blogPost" && slug.current==$s][0]{_id,"bodyLen":length(body)}',
      { s: art.slug }
    ).catch(()=>null)

    if (!post?._id) {
      results.push({ slug: art.slug, ok: false, error: 'Not found' }); continue
    }
    if ((post.bodyLen||0) > 500) {
      results.push({ slug: art.slug, ok: true, skipped: true, note: 'already has body' }); continue
    }

    await sanity.patch(post._id).set({ body: art.body, published: true }).commit()
    results.push({ slug: art.slug, ok: true, chars: art.body.length })
  }
  return NextResponse.json({ ok: true, results })
}
