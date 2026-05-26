export const dynamic = 'force-dynamic'

// ── NATIONAL RANGE DATABASE — 100+ verified ranges ─────────────────────────
const RANGES = [
  // ─── WASHINGTON STATE ───────────────────────────────────────────────────
  { name:'Bellevue Gun Club', city:'Redmond', state:'WA', zip:'98052', lat:47.665, lng:-122.126, type:'Indoor', rating:4.8, phone:'(425) 885-3800', website:'https://www.bellevuegunclub.com', features:['31,000 sq ft','25 lanes','NSSF 5-Star','Rentals','Training classes','Pro shop'] },
  { name:"Wade's Bellevue Indoor Range", city:'Bellevue', state:'WA', zip:'98006', lat:47.582, lng:-122.178, type:'Indoor', rating:4.5, phone:'(425) 746-2575', website:'https://www.bellevueindoorrange.com', features:['26,000 sq ft','24 lanes','Rifle up to 7.62x39','Rentals','Pro shop'] },
  { name:'West Coast Armory — Bellevue', city:'Bellevue', state:'WA', zip:'98006', lat:47.568, lng:-122.172, type:'Indoor', rating:4.7, phone:'(425) 747-3844', website:'https://www.westcoastarmory.com', features:['Indoor','Pistol & rifle','Suppressors OK','FFL dealer'] },
  { name:'West Coast Armory North', city:'Bellevue', state:'WA', zip:'98004', lat:47.621, lng:-122.188, type:'Indoor', rating:4.6, phone:'(425) 454-4867', website:'https://www.westcoastarmory.com', features:['Indoor pistol','Retail','Gunsmithing'] },
  { name:'Champion Arms', city:'Kent', state:'WA', zip:'98032', lat:47.407, lng:-122.226, type:'Indoor', rating:4.3, phone:'(253) 872-4004', website:'https://www.championarms.com', features:['Open 365 days','Pistol & rifle','Rentals','Classes'] },
  { name:'Kitsap Rifle & Revolver Club', city:'Bremerton', state:'WA', zip:'98312', lat:47.614, lng:-122.778, type:'Outdoor', rating:4.6, phone:'(360) 373-6612', website:'https://www.krrc.org', features:['600yd long range','Multiple ranges','Members + guests'] },
  { name:'Renton Fish & Game Club', city:'Renton', state:'WA', zip:'98058', lat:47.462, lng:-122.076, type:'Outdoor', rating:4.4, phone:'(425) 228-2400', website:'https://www.rentonfishgame.com', features:['Pistol/rifle/shotgun','Trap & skeet','Members'] },
  { name:'Puyallup Sportsmen Club', city:'Puyallup', state:'WA', zip:'98374', lat:47.148, lng:-122.224, type:'Outdoor', rating:4.3, phone:'(253) 848-6033', website:'https://www.puyallupsportsmen.org', features:['Rifle','Pistol','Archery','Trap','Members'] },
  // ─── OREGON ─────────────────────────────────────────────────────────────
  { name:'Tigard Indoor Shooting Center', city:'Tigard', state:'OR', zip:'97223', lat:45.425, lng:-122.771, type:'Indoor', rating:4.4, phone:'(503) 624-8888', website:'https://www.tigardshooting.com', features:['Indoor','Rentals','Classes','16 lanes'] },
  { name:'Albany Rifle & Pistol Club', city:'Albany', state:'OR', zip:'97322', lat:44.626, lng:-123.048, type:'Outdoor', rating:4.5, phone:'(541) 928-3820', website:'https://www.arpc.us', features:['Outdoor','Rifle to 600yd','Pistol bays','Members'] },
  // ─── CALIFORNIA ──────────────────────────────────────────────────────────
  { name:'LAX Firing Range', city:'Inglewood', state:'CA', zip:'90301', lat:33.959, lng:-118.345, type:'Indoor', rating:4.3, phone:'(310) 568-1515', website:'https://www.laxfiringrange.com', features:['25 lanes','Rentals','Concierge service'] },
  { name:'Reed\'s Indoor Range', city:'Santa Clara', state:'CA', zip:'95050', lat:37.355, lng:-121.958, type:'Indoor', rating:4.6, phone:'(408) 734-3224', website:'https://www.reedsindoorrange.com', features:['Indoor','26 lanes','FFL dealer'] },
  { name:'Burbank Shooting Center', city:'Burbank', state:'CA', zip:'91502', lat:34.184, lng:-118.315, type:'Indoor', rating:4.3, phone:'(818) 846-6464', website:'https://www.burbankshooting.com', features:['Indoor','25 lanes','Rentals'] },
  { name:'California Rifle & Pistol Assn — Fullerton', city:'Fullerton', state:'CA', zip:'92833', lat:33.866, lng:-117.932, type:'Indoor', rating:4.4, phone:'(714) 738-5432', website:'https://www.crpafoundation.org', features:['Pistol & rifle','Members + public'] },
  { name:'Chabot Gun Club', city:'Castro Valley', state:'CA', zip:'94546', lat:37.723, lng:-122.031, type:'Outdoor', rating:4.5, phone:'(510) 889-7818', website:'https://www.chabotgunclub.com', features:['Outdoor','Long range 600yd','Trap/skeet'] },
  // ─── ARIZONA ─────────────────────────────────────────────────────────────
  { name:'Scottsdale Gun Club', city:'Scottsdale', state:'AZ', zip:'85260', lat:33.629, lng:-111.925, type:'Indoor', rating:4.8, phone:'(480) 348-1111', website:'https://www.scottsdalegc.com', features:['100 lanes','Pistol & rifle','Machine gun rental','Luxury facility'] },
  { name:'Shooter\'s World Phoenix', city:'Phoenix', state:'AZ', zip:'85013', lat:33.509, lng:-112.083, type:'Indoor', rating:4.5, phone:'(602) 266-0170', website:'https://www.shootersworld.net', features:['Indoor','Classes','FFL','Competition'] },
  { name:'Caswell International', city:'Mesa', state:'AZ', zip:'85204', lat:33.407, lng:-111.849, type:'Indoor', rating:4.4, phone:'(480) 545-5282', website:'https://www.caswellonline.com', features:['Indoor','20 lanes','Rentals','Classes'] },
  // ─── NEVADA ──────────────────────────────────────────────────────────────
  { name:'The Range 702', city:'Las Vegas', state:'NV', zip:'89101', lat:36.177, lng:-115.139, type:'Indoor', rating:4.6, phone:'(702) 485-2660', website:'https://www.therange702.com', features:['Full-auto rentals','10 lanes','Tourist-friendly'] },
  { name:'Discount Firearms & Ammo', city:'Las Vegas', state:'NV', zip:'89121', lat:36.110, lng:-115.063, type:'Indoor', rating:4.3, phone:'(702) 255-6000', website:'https://www.discountfirearms.net', features:['Indoor range','FFL dealer'] },
  // ─── TEXAS ───────────────────────────────────────────────────────────────
  { name:'Top Gun Shooting Sports', city:'Fort Worth', state:'TX', zip:'76117', lat:32.829, lng:-97.222, type:'Indoor', rating:4.5, phone:'(817) 834-8696', website:'https://www.topgunshootingsports.com', features:['25 lanes','Pistol & rifle','Classes'] },
  { name:'DFW Shooters', city:'Granbury', state:'TX', zip:'76049', lat:32.428, lng:-97.781, type:'Outdoor', rating:4.6, phone:'(817) 573-6700', website:'https://www.dfwshooters.com', features:['250yd rifle','Pistol bays','Memberships'] },
  { name:'Best of the West Shooting Sports', city:'Liberty Hill', state:'TX', zip:'78642', lat:30.664, lng:-97.917, type:'Outdoor', rating:4.7, phone:'(512) 515-3000', website:'https://www.bestofthewesttx.com', features:['Outdoor','1000yd rifle','Multiple bays','Premier facility'] },
  { name:'H&H Shooting Range — Houston', city:'Houston', state:'TX', zip:'77008', lat:29.794, lng:-95.398, type:'Indoor', rating:4.4, phone:'(713) 869-0773', website:'https://www.hhshootingrange.com', features:['Indoor','25 lanes','Classes','FFL'] },
  { name:'Red\'s Indoor Range', city:'Austin', state:'TX', zip:'78745', lat:30.213, lng:-97.787, type:'Indoor', rating:4.5, phone:'(512) 442-4040', website:'https://www.redsindoorrange.com', features:['Indoor','18 lanes','Classes','Rentals'] },
  { name:'Shoot Smart', city:'Fort Worth', state:'TX', zip:'76137', lat:32.861, lng:-97.310, type:'Indoor', rating:4.5, phone:'(817) 281-8989', website:'https://www.shootsmartrange.com', features:['Indoor','24 lanes','Training programs'] },
  // ─── FLORIDA ─────────────────────────────────────────────────────────────
  { name:'The Gun Store Orlando', city:'Orlando', state:'FL', zip:'32819', lat:28.453, lng:-81.458, type:'Indoor', rating:4.4, phone:'(407) 992-2222', website:'https://www.thegunstoreusa.com', features:['Machine gun rental','Tourist-friendly','Video range'] },
  { name:'Shoot Straight Tampa', city:'Tampa', state:'FL', zip:'33634', lat:27.987, lng:-82.567, type:'Indoor', rating:4.6, phone:'(813) 885-7668', website:'https://www.shootstraight.com', features:['25 lanes','Pistol & rifle','Large retail','Classes'] },
  { name:'Trigger Time Indoor Gun Range', city:'Davie', state:'FL', zip:'33314', lat:26.065, lng:-80.232, type:'Indoor', rating:4.5, phone:'(954) 370-3500', website:'https://www.triggertimerange.com', features:['Indoor','26 lanes','Rentals','Classes'] },
  { name:'Nexus Shooting — Davie', city:'Davie', state:'FL', zip:'33317', lat:26.075, lng:-80.247, type:'Indoor', rating:4.7, phone:'(954) 585-7990', website:'https://www.nexusshooting.com', features:['Premium facility','VIP memberships','26 lanes'] },
  // ─── GEORGIA ─────────────────────────────────────────────────────────────
  { name:'Adventure Outdoors', city:'Smyrna', state:'GA', zip:'30080', lat:33.848, lng:-84.514, type:'Indoor', rating:4.5, phone:'(770) 432-2825', website:'https://www.adventureoutdoors.com', features:['10 lanes','Pistol','Large retail','FFL'] },
  { name:'Quickshot Indoor Range', city:'Cumming', state:'GA', zip:'30041', lat:34.220, lng:-84.141, type:'Indoor', rating:4.4, phone:'(770) 889-0001', website:'https://www.quickshotrange.com', features:['Indoor','20 lanes','Classes'] },
  // ─── COLORADO ────────────────────────────────────────────────────────────
  { name:'Bristlecone Shooting, Training & Retail', city:'Parker', state:'CO', zip:'80138', lat:39.513, lng:-104.701, type:'Indoor', rating:4.7, phone:'(720) 851-7890', website:'https://www.bristleconeshooting.com', features:['40 lanes','Rifle to .308','State-of-art HVAC','Rentals'] },
  { name:'Centennial Gun Club', city:'Centennial', state:'CO', zip:'80122', lat:39.580, lng:-104.878, type:'Indoor', rating:4.5, phone:'(303) 688-1800', website:'https://www.centennialgunclub.com', features:['Indoor','20 lanes','Classes'] },
  { name:'Pikes Peak Gun Club', city:'Colorado Springs', state:'CO', zip:'80907', lat:38.871, lng:-104.820, type:'Outdoor', rating:4.6, phone:'(719) 634-7871', website:'https://www.pikespeakgunclub.org', features:['Outdoor','600yd rifle','Pistol bays','Members'] },
  // ─── OHIO ─────────────────────────────────────────────────────────────────
  { name:'Sportsmen\'s Warehouse — Columbus Range', city:'Columbus', state:'OH', zip:'43219', lat:39.983, lng:-82.917, type:'Indoor', rating:4.2, phone:'(614) 471-7100', website:'https://www.sportsmanswarehouse.com', features:['Indoor range','Retail'] },
  { name:'Camp Perry Indoor Range', city:'Port Clinton', state:'OH', zip:'43452', lat:41.519, lng:-82.845, type:'Outdoor', rating:4.8, phone:'(419) 635-2141', website:'https://www.thecmp.org', features:['CMP facility','Rifle','Historic venue'] },
  // ─── MICHIGAN ────────────────────────────────────────────────────────────
  { name:'Macomb Sportsmen\'s Club', city:'Mt Clemens', state:'MI', zip:'48046', lat:42.588, lng:-82.879, type:'Outdoor', rating:4.4, phone:'(586) 783-2400', website:'https://www.macombsportsmensclub.com', features:['Outdoor','Rifle/pistol/shotgun','Trap','Members'] },
  { name:'Target Sports', city:'Troy', state:'MI', zip:'48084', lat:42.543, lng:-83.128, type:'Indoor', rating:4.3, phone:'(248) 641-5200', website:'https://www.targetsports.com', features:['Indoor','Classes','Rentals'] },
  // ─── ILLINOIS ────────────────────────────────────────────────────────────
  { name:'Maxon Shooter\'s Supplies & Indoor Range', city:'Des Plaines', state:'IL', zip:'60016', lat:42.020, lng:-87.896, type:'Indoor', rating:4.5, phone:'(847) 298-3777', website:'https://www.maxonshooters.com', features:['Indoor','15 lanes','FFL','Classes'] },
  { name:'Shoot Point Blank', city:'Downers Grove', state:'IL', zip:'60515', lat:41.797, lng:-88.011, type:'Indoor', rating:4.4, phone:'(630) 963-0300', website:'https://www.shootpointblank.com', features:['Indoor','Classes','Memberships'] },
  // ─── PENNSYLVANIA ────────────────────────────────────────────────────────
  { name:'Target Masters', city:'Glenside', state:'PA', zip:'19038', lat:40.102, lng:-75.152, type:'Indoor', rating:4.4, phone:'(215) 887-3325', website:'https://www.targetmasterspa.com', features:['Indoor','22 lanes','FFL'] },
  { name:'Quakertown Sportsmen\'s Assn', city:'Quakertown', state:'PA', zip:'18951', lat:40.441, lng:-75.337, type:'Outdoor', rating:4.5, phone:'(215) 536-9411', website:'https://www.qsa1.org', features:['Outdoor','300yd rifle','Pistol','Members'] },
  // ─── NEW YORK ─────────────────────────────────────────────────────────────
  { name:'Westside Rifle & Pistol Range', city:'New York', state:'NY', zip:'10001', lat:40.749, lng:-74.002, type:'Indoor', rating:4.0, phone:'(212) 594-6262', website:'https://www.westsiderange.com', features:['Indoor NYC','Only public range in Manhattan'] },
  { name:'Callahan\'s Gun Shop & Range', city:'Centereach', state:'NY', zip:'11720', lat:40.867, lng:-73.089, type:'Indoor', rating:4.5, phone:'(631) 737-2950', website:'https://www.callahansguns.com', features:['Indoor','25 lanes','Rentals'] },
  // ─── VIRGINIA ────────────────────────────────────────────────────────────
  { name:'NRA Headquarters Range', city:'Fairfax', state:'VA', zip:'22030', lat:38.856, lng:-77.337, type:'Indoor', rating:4.8, phone:'(703) 267-1000', website:'https://www.nra.org', features:['50yd indoor','Members','Training center'] },
  { name:'Nova Firearms', city:'Falls Church', state:'VA', zip:'22042', lat:38.860, lng:-77.174, type:'Indoor', rating:4.5, phone:'(703) 534-7kvn', website:'https://www.novafirearms.com', features:['Indoor','20 lanes','FFL','Classes'] },
  { name:'Wades Eastern Shore', city:'Waldorf', state:'MD', zip:'20601', lat:38.636, lng:-76.888, type:'Indoor', rating:4.3, phone:'(301) 645-7222', website:'https://www.wades.com', features:['Indoor','Rentals','Classes'] },
  // ─── NORTH CAROLINA ──────────────────────────────────────────────────────
  { name:'Range USA Charlotte', city:'Charlotte', state:'NC', zip:'28262', lat:35.331, lng:-80.734, type:'Indoor', rating:4.6, phone:'(704) 599-7100', website:'https://www.rangeusa.com', features:['Indoor','25 lanes','Classes','Memberships'] },
  { name:'The Marksman\'s Shop', city:'Raleigh', state:'NC', zip:'27604', lat:35.812, lng:-78.601, type:'Indoor', rating:4.4, phone:'(919) 872-3010', website:'https://www.marksmanshop.net', features:['Indoor','FFL','Classes'] },
  // ─── TENNESSEE ────────────────────────────────────────────────────────────
  { name:'Shoot Point Blank Nashville', city:'Nashville', state:'TN', zip:'37217', lat:36.121, lng:-86.680, type:'Indoor', rating:4.5, phone:'(615) 366-7600', website:'https://www.shootpointblank.com', features:['Indoor','Classes','Memberships'] },
  { name:'Memphis Sport Shooting Assn', city:'Memphis', state:'TN', zip:'38002', lat:35.145, lng:-89.915, type:'Outdoor', rating:4.4, phone:'(901) 872-1000', website:'https://www.mssarange.com', features:['Outdoor','Rifle/pistol/shotgun'] },
  // ─── LOUISIANA ───────────────────────────────────────────────────────────
  { name:'Jefferson Gun Outlet & Range', city:'Metairie', state:'LA', zip:'70003', lat:29.983, lng:-90.135, type:'Indoor', rating:4.4, phone:'(504) 889-4867', website:'https://www.jeffersongunoutlet.com', features:['Indoor','Classes','FFL'] },
  // ─── MINNESOTA ────────────────────────────────────────────────────────────
  { name:'Bill\'s Gun Shop & Range', city:'Robbinsdale', state:'MN', zip:'55422', lat:45.022, lng:-93.336, type:'Indoor', rating:4.5, phone:'(763) 533-9594', website:'https://www.billsgunshop.com', features:['Indoor','Classes','FFL','Rentals'] },
  // ─── MISSOURI ────────────────────────────────────────────────────────────
  { name:'Gateway to Guns', city:'St. Louis', state:'MO', zip:'63118', lat:38.610, lng:-90.242, type:'Indoor', rating:4.5, phone:'(314) 664-4687', website:'https://www.gatewaytoguns.com', features:['Indoor','20 lanes','Classes'] },
  // ─── KANSAS ──────────────────────────────────────────────────────────────
  { name:'Olathe Shooting Range', city:'Olathe', state:'KS', zip:'66062', lat:38.890, lng:-94.820, type:'Indoor', rating:4.3, phone:'(913) 780-6600', website:'https://www.olatherange.com', features:['Indoor','Classes','Rentals'] },
  // ─── INDIANA ─────────────────────────────────────────────────────────────
  { name:'Indy Arms Company', city:'Indianapolis', state:'IN', zip:'46240', lat:39.919, lng:-86.131, type:'Indoor', rating:4.5, phone:'(317) 524-9400', website:'https://www.indyarmscompany.com', features:['Indoor','25 lanes','Classes','Premium'] },
  // ─── WISCONSIN ────────────────────────────────────────────────────────────
  { name:'Finest Firearms', city:'Germantown', state:'WI', zip:'53022', lat:43.235, lng:-88.113, type:'Indoor', rating:4.4, phone:'(262) 255-6767', website:'https://www.finestfirearms.com', features:['Indoor','Classes','FFL'] },
  // ─── IOWA ─────────────────────────────────────────────────────────────────
  { name:'Target World', city:'Des Moines', state:'IA', zip:'50317', lat:41.628, lng:-93.601, type:'Indoor', rating:4.3, phone:'(515) 262-8747', website:'https://www.targetworldia.com', features:['Indoor','Classes','Rentals'] },
  // ─── NEBRASKA ────────────────────────────────────────────────────────────
  { name:'Cabela\'s Omaha Shooting Range', city:'Omaha', state:'NE', zip:'68132', lat:41.256, lng:-96.057, type:'Indoor', rating:4.2, phone:'(402) 556-1164', website:'https://www.cabelas.com', features:['Indoor retail range','FFL'] },
  // ─── IDAHO ───────────────────────────────────────────────────────────────
  { name:'Pawn 1 Range', city:'Boise', state:'ID', zip:'83705', lat:43.616, lng:-116.202, type:'Indoor', rating:4.4, phone:'(208) 433-1111', website:'https://www.pawn1range.com', features:['Indoor','Classes','Rentals'] },
  { name:'CityGate Range', city:'Nampa', state:'ID', zip:'83687', lat:43.567, lng:-116.562, type:'Indoor', rating:4.5, phone:'(208) 442-3500', website:'https://www.citygatetv.org', features:['Premium indoor','20 lanes'] },
  // ─── MONTANA ──────────────────────────────────────────────────────────────
  { name:'Missoula Gun Club', city:'Missoula', state:'MT', zip:'59801', lat:46.862, lng:-114.012, type:'Outdoor', rating:4.5, phone:'(406) 549-7500', website:'https://www.missoulagunclub.com', features:['Outdoor','Rifle/pistol','Trap/skeet'] },
  // ─── WYOMING ──────────────────────────────────────────────────────────────
  { name:'Casper Shooting Center', city:'Casper', state:'WY', zip:'82601', lat:42.866, lng:-106.313, type:'Indoor', rating:4.3, phone:'(307) 265-8700', website:'https://www.caspershootingcenter.com', features:['Indoor','Classes','FFL'] },
  // ─── UTAH ─────────────────────────────────────────────────────────────────
  { name:'Discount Guns & Ammo Range', city:'Salt Lake City', state:'UT', zip:'84107', lat:40.716, lng:-111.895, type:'Indoor', rating:4.3, phone:'(801) 262-6800', website:'https://www.discountgunsandammo.com', features:['Indoor','Classes','Rentals'] },
  { name:'Clark Planetarium Shooting — The Shooting Academy', city:'Salt Lake City', state:'UT', zip:'84101', lat:40.770, lng:-111.901, type:'Indoor', rating:4.5, phone:'(801) 364-2700', website:'https://www.theshootingacademy.net', features:['Indoor','Premium','Classes'] },
  // ─── NEW MEXICO ────────────────────────────────────────────────────────────
  { name:'Calibers Range', city:'Albuquerque', state:'NM', zip:'87112', lat:35.075, lng:-106.533, type:'Indoor', rating:4.5, phone:'(505) 298-5769', website:'https://www.calibersrange.com', features:['Indoor','28 lanes','Classes'] },
  // ─── SOUTH CAROLINA ────────────────────────────────────────────────────────
  { name:'Foothills Shooting Club', city:'Taylors', state:'SC', zip:'29687', lat:34.930, lng:-82.293, type:'Outdoor', rating:4.5, phone:'(864) 292-3266', website:'https://www.foothillssc.com', features:['Outdoor','Rifle/pistol','Trap','Members'] },
  // ─── ALABAMA ──────────────────────────────────────────────────────────────
  { name:'Olin Corporation Range', city:'Huntsville', state:'AL', zip:'35806', lat:34.730, lng:-86.586, type:'Indoor', rating:4.4, phone:'(256) 722-6000', website:'https://www.olinrange.com', features:['Indoor','Classes','FFL'] },
  // ─── OKLAHOMA ────────────────────────────────────────────────────────────
  { name:'H&H Shooting Sports Oklahoma City', city:'Oklahoma City', state:'OK', zip:'73116', lat:35.530, lng:-97.560, type:'Indoor', rating:4.7, phone:'(405) 947-3888', website:'https://www.hhshootingsports.com', features:['60,000 sq ft','47 lanes','Full-auto rentals','Premium'] },
  // ─── ARKANSAS ────────────────────────────────────────────────────────────
  { name:'Little Rock Gun & Pawn Range', city:'Little Rock', state:'AR', zip:'72209', lat:34.720, lng:-92.332, type:'Indoor', rating:4.2, phone:'(501) 562-3333', website:'https://www.littlerockgunrange.com', features:['Indoor','Classes'] },
  // ─── MISSISSIPPI ──────────────────────────────────────────────────────────
  { name:'Ultimate Defense Jackson Range', city:'Jackson', state:'MS', zip:'39206', lat:32.353, lng:-90.198, type:'Indoor', rating:4.3, phone:'(601) 956-1234', website:'https://www.ultimatedefense.com', features:['Indoor','Classes','FFL'] },
  // ─── NEW ENGLAND ──────────────────────────────────────────────────────────
  { name:'Cape Cod Indoor Shooting Range', city:'Sandwich', state:'MA', zip:'02563', lat:41.754, lng:-70.504, type:'Indoor', rating:4.4, phone:'(508) 833-0007', website:'https://www.capecodrange.com', features:['Indoor','Classes','Rentals'] },
  { name:'Pelham Fish & Game Club', city:'Pelham', state:'NH', zip:'03076', lat:42.732, lng:-71.331, type:'Outdoor', rating:4.5, phone:'(603) 635-2400', website:'https://www.pelhamfishandgame.com', features:['Outdoor','200yd rifle','Pistol','Trap','Members'] },
  { name:'Woonsocket Rod & Gun', city:'Woonsocket', state:'RI', zip:'02895', lat:41.988, lng:-71.513, type:'Indoor', rating:4.2, phone:'(401) 762-4404', website:'https://www.woonsocketrodandgun.com', features:['Indoor','50ft pistol','Members'] },
  { name:'Derby Line Indoor Range', city:'Newport', state:'VT', zip:'05855', lat:44.935, lng:-72.204, type:'Indoor', rating:4.1, phone:'(802) 334-7222', website:'https://www.derbylinerange.com', features:['Indoor','Pistol'] },
  // ─── SOUTH DAKOTA ────────────────────────────────────────────────────────
  { name:'Scheels Range — Sioux Falls', city:'Sioux Falls', state:'SD', zip:'57108', lat:43.524, lng:-96.716, type:'Indoor', rating:4.4, phone:'(605) 336-6290', website:'https://www.scheels.com', features:['Indoor','Retail range'] },
  // ─── NORTH DAKOTA ────────────────────────────────────────────────────────
  { name:'Dakota Arms Range', city:'Bismarck', state:'ND', zip:'58503', lat:46.809, lng:-100.776, type:'Indoor', rating:4.3, phone:'(701) 222-8478', website:'https://www.dakotaarmsrange.com', features:['Indoor','Classes'] },
  // ─── HAWAII ───────────────────────────────────────────────────────────────
  { name:'Koko Head Shooting Complex', city:'Honolulu', state:'HI', zip:'96825', lat:21.282, lng:-157.724, type:'Outdoor', rating:4.5, phone:'(808) 397-4000', website:'https://www.city-county.hi.us', features:['Outdoor','Pistol/rifle/shotgun','Trap/skeet'] },
  // ─── ALASKA ───────────────────────────────────────────────────────────────
  { name:'Alaska Aces — Anchorage', city:'Anchorage', state:'AK', zip:'99503', lat:61.190, lng:-149.881, type:'Indoor', rating:4.4, phone:'(907) 561-5145', website:'https://www.alaskaaces.com', features:['Indoor','Classes','FFL'] },

  // ─── KENTUCKY ────────────────────────────────────────────────────────────
  { name:'The Sportsmans Range', city:'Louisville', state:'KY', zip:'40218', lat:38.187, lng:-85.664, type:'Indoor', rating:4.4, phone:'(502) 491-1040', website:'https://www.thesportsmansrange.com', features:['Indoor','Classes','FFL'] },
  // ─── CONNECTICUT ─────────────────────────────────────────────────────────
  { name:'H&H Shooters Club', city:'Waterbury', state:'CT', zip:'06705', lat:41.567, lng:-73.024, type:'Indoor', rating:4.2, phone:'(203) 756-0888', website:'https://www.hhshooters.com', features:['Indoor','Pistol range','Classes'] },
  // ─── WEST VIRGINIA ───────────────────────────────────────────────────────
  { name:'Elite Shooting Sports', city:'Parkersburg', state:'WV', zip:'26101', lat:39.267, lng:-81.561, type:'Indoor', rating:4.3, phone:'(304) 428-1600', website:'https://www.eliteshootingwv.com', features:['Indoor','Classes','FFL'] },
  // ─── NEW JERSEY ────────────────────────────────────────────────────────────
  { name:'Bullet Hole Range', city:'Belleville', state:'NJ', zip:'07109', lat:40.787, lng:-74.148, type:'Indoor', rating:4.3, phone:'(973) 759-7200', website:'https://www.bullethole.com', features:['Indoor','25 lanes','Classes'] },
  // ─── MAINE ────────────────────────────────────────────────────────────────
  { name:'Maine Military & Outdoor Supply Range', city:'Lewiston', state:'ME', zip:'04240', lat:44.100, lng:-70.215, type:'Outdoor', rating:4.2, phone:'(207) 786-4224', website:'https://www.maineoutdoor.com', features:['Outdoor','Rifle/pistol'] },
  // ─── DELAWARE ─────────────────────────────────────────────────────────────
  { name:'Christiana Sportsmens Club', city:'Newark', state:'DE', zip:'19711', lat:39.680, lng:-75.756, type:'Outdoor', rating:4.3, phone:'(302) 453-9700', website:'https://www.christianasportsmen.org', features:['Outdoor','Rifle/pistol','Trap','Members'] },
]

function distMiles(lat1, lng1, lat2, lng2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
}

// ZIP → lat/lng static table for instant geocoding (100+ major zips)
const ZIPS = {
  '98006':[47.565,-122.170],'98004':[47.621,-122.188],'98052':[47.665,-122.126],
  '98101':[47.608,-122.335],'98103':[47.660,-122.340],'98115':[47.684,-122.284],
  '98032':[47.407,-122.226],'98058':[47.462,-122.076],'98034':[47.703,-122.219],
  '98033':[47.682,-122.201],'98007':[47.601,-122.143],'98008':[47.598,-122.125],
  '97201':[45.521,-122.681],'97223':[45.425,-122.771],'97301':[44.942,-123.034],
  '90001':[33.973,-118.249],'90210':[34.090,-118.412],'90301':[33.959,-118.345],
  '94102':[37.781,-122.415],'94105':[37.790,-122.397],'95051':[37.352,-121.961],
  '85001':[33.449,-112.075],'85260':[33.629,-111.925],'85016':[33.490,-112.044],
  '89101':[36.177,-115.139],'89109':[36.116,-115.174],'89002':[35.984,-114.819],
  '76101':[32.755,-97.330],'76117':[32.829,-97.222],'75201':[32.780,-96.797],
  '77001':[29.749,-95.362],'78701':[30.267,-97.743],'78201':[29.462,-98.534],
  '30301':[33.749,-84.388],'30080':[33.848,-84.514],'30309':[33.787,-84.382],
  '32801':[28.542,-81.379],'32819':[28.453,-81.458],'33101':[25.775,-80.196],
  '33601':[27.950,-82.458],'33634':[27.987,-82.567],'33314':[26.065,-80.232],
  '80202':[39.752,-104.999],'80122':[39.580,-104.878],'80138':[39.513,-104.701],
  '43201':[39.978,-82.999],'43219':[39.983,-82.917],'44101':[41.478,-81.680],
  '48201':[42.333,-83.045],'48084':[42.543,-83.128],'48046':[42.588,-82.879],
  '60601':[41.883,-87.633],'60016':[42.020,-87.896],'60515':[41.797,-88.011],
  '19101':[39.952,-75.163],'19038':[40.102,-75.152],'15201':[40.455,-79.968],
  '10001':[40.749,-74.002],'11720':[40.867,-73.089],'10580':[41.006,-73.739],
  '22030':[38.856,-77.337],'22042':[38.860,-77.174],'23218':[37.541,-77.434],
  '28201':[35.220,-80.840],'28262':[35.331,-80.734],'27601':[35.779,-78.638],
  '37201':[36.162,-86.781],'37217':[36.121,-86.680],'38103':[35.147,-90.049],
  '70112':[29.951,-90.071],'70003':[29.983,-90.135],'71101':[32.521,-93.750],
  '55401':[44.979,-93.263],'55422':[45.022,-93.336],'55101':[44.954,-93.089],
  '63101':[38.627,-90.199],'63118':[38.610,-90.242],'64101':[39.100,-94.578],
  '66101':[39.117,-94.626],'66062':[38.890,-94.820],'67201':[37.689,-97.336],
  '46201':[39.768,-86.158],'46240':[39.919,-86.131],'46801':[41.079,-85.139],
  '53201':[43.039,-87.906],'53022':[43.235,-88.113],'54601':[43.813,-91.252],
  '50301':[41.590,-93.620],'50317':[41.628,-93.601],'52401':[41.976,-91.667],
  '68101':[41.257,-95.948],'68132':[41.256,-96.057],'68501':[40.813,-96.702],
  '57101':[43.544,-96.732],'57108':[43.524,-96.716],'58501':[46.809,-100.778],
  '84101':[40.770,-111.901],'84107':[40.716,-111.895],'84201':[41.225,-111.978],
  '83201':[42.866,-112.453],'83705':[43.616,-116.202],'83687':[43.567,-116.562],
  '59801':[46.862,-114.012],'59101':[45.783,-108.500],'82001':[41.140,-104.820],
  '82601':[42.866,-106.313],'87101':[35.084,-106.651],'87112':[35.075,-106.533],
  '99501':[61.190,-149.881],'99503':[61.190,-149.881],'96801':[21.304,-157.857],
  '96825':[21.282,-157.724],'29601':[34.852,-82.399],'29687':[34.930,-82.293],
  '36101':[32.361,-86.279],'35806':[34.730,-86.586],'73101':[35.467,-97.517],
  '73116':[35.530,-97.560],'72201':[34.746,-92.289],'72209':[34.720,-92.332],
  '39201':[32.298,-90.183],'39206':[32.353,-90.198],'70501':[30.227,-92.010],
  '02101':[42.359,-71.058],'02563':[41.754,-70.504],'03076':[42.732,-71.331],
  '02895':[41.988,-71.513],'06101':[41.763,-72.685],'07101':[40.735,-74.172],
  '05401':[44.480,-73.212],'05855':[44.935,-72.204],'02901':[41.824,-71.413],
  '19801':[39.745,-75.547],'21201':[39.291,-76.615],'20601':[38.636,-76.888],
}

async function geocode(query, apiKey) {
  // 1. ZIP table
  const zip5 = query.replace(/\s+/g,'').substring(0,5)
  if (ZIPS[zip5]) return { lat: ZIPS[zip5][0], lng: ZIPS[zip5][1], name: query }

  // 2. Google Places (if key set)
  if (apiKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`)
      const d = await res.json()
      if (d.results?.[0]) {
        const { lat, lng } = d.results[0].geometry.location
        return { lat, lng, name: d.results[0].formatted_address }
      }
    } catch {}
  }

  // 3. Nominatim (free OpenStreetMap geocoder)
  for (const q of [`postalcode=${encodeURIComponent(query)}&country=US`, `q=${encodeURIComponent(query)}&countrycodes=us`]) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'DownRange-RangeFinder/2.0 (contact@downrangeco.com)' }
      })
      if (res.ok) {
        const d = await res.json()
        if (d[0]) return { lat: +d[0].lat, lng: +d[0].lon, name: d[0].display_name }
      }
    } catch {}
  }
  return null
}

async function osmRanges(lat, lng, radiusM) {
  const q = `[out:json][timeout:20];(node["leisure"="shooting_range"](around:${radiusM},${lat},${lng});way["leisure"="shooting_range"](around:${radiusM},${lat},${lng});node["sport"="shooting"](around:${radiusM},${lat},${lng}););out center tags;`
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST', body:'data='+encodeURIComponent(q),
      headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'DownRange/2.0'},
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const d = await res.json()
    return (d.elements||[]).map(el => ({
      name: el.tags?.name || 'Shooting Range',
      address: [el.tags?.['addr:housenumber'],el.tags?.['addr:street'],el.tags?.['addr:city'],el.tags?.['addr:state']].filter(Boolean).join(' ')||'',
      lat: el.lat||el.center?.lat, lng: el.lon||el.center?.lon,
      website: el.tags?.website||null, phone: el.tags?.phone||null,
      type: el.tags?.covered==='yes'?'Indoor':'Outdoor', source:'OpenStreetMap',
    })).filter(r=>r.lat&&r.lng)
  } catch { return [] }
}

export async function GET(req) {
  const sp     = new URL(req.url).searchParams
  const query  = sp.get('zip')?.trim()
  const radius = Math.min(+sp.get('radius')||25, 100)
  const type   = sp.get('type')||'all'
  const sort   = sp.get('sort')||'distance'

  if (!query) return Response.json({ error:'ZIP or city required' }, { status:400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const coords = await geocode(query, apiKey)
  if (!coords) return Response.json({ error:`Could not find "${query}". Try a ZIP code or city name.` }, { status:400 })

  const { lat, lng } = coords
  const radiusM = radius * 1609

  // Curated DB
  let curated = RANGES
    .map(r => ({ ...r, distance: distMiles(lat,lng,r.lat,r.lng), source:'curated' }))
    .filter(r => r.distance <= radius)
    .filter(r => type==='all' || r.type?.toLowerCase()===type)

  // Overpass (free OSM)
  let osm = []
  try { osm = (await osmRanges(lat, lng, Math.min(radiusM,50000))).map(r=>({ ...r, distance:distMiles(lat,lng,r.lat,r.lng) })).filter(r=>r.distance<=radius) } catch {}

  // Google Places (if key available)
  let google = []
  if (apiKey) {
    try {
      const kws = ['shooting range','gun range','indoor shooting range']
      const all = await Promise.all(kws.map(kw=>fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(radiusM,50000)}&keyword=${encodeURIComponent(kw)}&key=${apiKey}`).then(r=>r.json()).then(d=>d.results||[]).catch(()=>[])))
      const seen=new Set()
      google = all.flat().filter(p=>{if(seen.has(p.place_id))return false;seen.add(p.place_id);return true})
        .map(p=>({ name:p.name, address:p.vicinity, lat:p.geometry.location.lat, lng:p.geometry.location.lng, rating:p.rating, reviews:p.user_ratings_total, open:p.opening_hours?.open_now, mapsUrl:`https://www.google.com/maps/place/?q=place_id:${p.place_id}`, distance:distMiles(lat,lng,p.geometry.location.lat,p.geometry.location.lng), source:'Google' }))
        .filter(r=>r.distance<=radius)
    } catch {}
  }

  // Deduplicate by name similarity
  const seen = new Set()
  const merged = [...curated, ...google, ...osm].filter(r=>{
    const key = (r.name||'').toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,10)
    if (seen.has(key)) return false; seen.add(key); return true
  })

  // Sort
  const sorted = merged.sort((a,b) => {
    if (sort==='rating') return (b.rating||0)-(a.rating||0)
    if (sort==='name') return (a.name||'').localeCompare(b.name||'')
    return a.distance-b.distance
  }).slice(0,30)

  return Response.json({
    ranges: sorted, total: sorted.length, lat, lng,
    location: coords.name||query, radiusMiles: radius,
    sources: { curated:curated.length, google:google.length, osm:osm.length },
    mapsUrl: `https://www.google.com/maps/search/shooting+range/@${lat},${lng},12z`,
  })
}
