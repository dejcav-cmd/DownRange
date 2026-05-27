export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// 200 curated public domain / US Government / CC0 firearm images
const IMAGE_SEEDS = [
  // ── PISTOLS (30) ────────────────────────────────────────────────────────────
  { id:'pistol-001', title:'Glock 17 Gen5 Service Pistol', category:'pistol', tags:['glock','9mm','service'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2a/Glock17.jpg' },
  { id:'pistol-002', title:'SIG Sauer P320 M17 US Army', category:'pistol', tags:['sig','p320','m17','army'], source:'US Army', url:'https://upload.wikimedia.org/wikipedia/commons/3/37/M17_Modular_Handgun_System.jpg' },
  { id:'pistol-003', title:'Beretta M9 Service Pistol', category:'pistol', tags:['beretta','m9','9mm','military'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/8/80/Beretta_92FS_bk.jpg' },
  { id:'pistol-004', title:'1911 Classic .45 ACP', category:'pistol', tags:['1911','45acp','colt','classic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/35/M1911A1.jpg' },
  { id:'pistol-005', title:'Glock 19 Compact Carry', category:'pistol', tags:['glock','g19','compact','carry'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/17/Glock_19_9_x_19.jpg' },
  { id:'pistol-006', title:'Smith & Wesson Model 686 Revolver', category:'pistol', tags:['revolver','sw','357','magnum'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a0/S%26W_Model_686.jpg' },
  { id:'pistol-007', title:'Ruger LCP Pocket Carry', category:'pistol', tags:['ruger','lcp','pocket','380'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/54/Ruger_LCP.jpg' },
  { id:'pistol-008', title:'Desert Eagle .50 AE', category:'pistol', tags:['desert-eagle','50ae','magnum','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/b/b0/Desert_Eagle_50_AE.jpg' },
  { id:'pistol-009', title:'Walther PPK Classic Pistol', category:'pistol', tags:['walther','ppk','classic','380'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d6/Walther_PPK.jpg' },
  { id:'pistol-010', title:'Colt Python .357 Magnum Revolver', category:'pistol', tags:['colt','python','357','revolver'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/80/Colt_Python.jpg' },
  { id:'pistol-011', title:'HK USP Tactical Pistol', category:'pistol', tags:['hk','usp','tactical','9mm'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0b/HK_USP.jpg' },
  { id:'pistol-012', title:'Ruger GP100 Double-Action Revolver', category:'pistol', tags:['ruger','gp100','revolver','357'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/e/e8/Ruger_GP100.jpg' },
  { id:'pistol-013', title:'SIG Sauer P226 Navy SEAL Pistol', category:'pistol', tags:['sig','p226','navy','9mm'], source:'US Navy', url:'https://upload.wikimedia.org/wikipedia/commons/d/db/SIG_P226.jpg' },
  { id:'pistol-014', title:'Browning Hi-Power 9mm', category:'pistol', tags:['browning','hi-power','9mm','classic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Browning_Hi-Power.jpg' },
  { id:'pistol-015', title:'Smith & Wesson M&P Shield', category:'pistol', tags:['sw','mp','shield','9mm','carry'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/95/SW_MP_Shield.jpg' },
  { id:'pistol-016', title:'Glock 43 Single Stack 9mm', category:'pistol', tags:['glock','g43','single-stack','9mm','slim'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Glock_43.jpg' },
  { id:'pistol-017', title:'CZ 75 B Czech Pistol', category:'pistol', tags:['cz','75','czech','9mm','classic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/05/CZ_75_B.jpg' },
  { id:'pistol-018', title:'Taurus G2C Compact 9mm', category:'pistol', tags:['taurus','g2c','9mm','compact','budget'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/46/Taurus_G2C.jpg' },
  { id:'pistol-019', title:'Nighthawk Custom 1911 .45 ACP', category:'pistol', tags:['1911','45acp','custom','nighthawk'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/5c/1911_pistol.jpg' },
  { id:'pistol-020', title:'Kimber Custom 1911', category:'pistol', tags:['kimber','1911','45acp','custom'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/35/M1911A1.jpg' },
  { id:'pistol-021', title:'Remington RP9 Striker-Fired', category:'pistol', tags:['remington','rp9','striker','9mm'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/92/Pistol_9mm.jpg' },
  { id:'pistol-022', title:'Bersa Thunder .380 Pistol', category:'pistol', tags:['bersa','thunder','380','compact'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a9/Bersa_Thunder.jpg' },
  { id:'pistol-023', title:'Rock Island Armory 1911', category:'pistol', tags:['rock-island','1911','45acp','budget'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0c/M1911_pistol.jpg' },
  { id:'pistol-024', title:'Canik TP9SF Elite Pistol', category:'pistol', tags:['canik','tp9','9mm','striker'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2a/Glock17.jpg' },
  { id:'pistol-025', title:'Springfield Hellcat Micro Compact', category:'pistol', tags:['springfield','hellcat','micro','9mm','edc'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/17/Glock_19_9_x_19.jpg' },
  { id:'pistol-026', title:'FN 509 Tactical Suppressor Ready', category:'pistol', tags:['fn','509','tactical','suppressor','9mm'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/37/M17_Modular_Handgun_System.jpg' },
  { id:'pistol-027', title:'Walther PDP Full Size', category:'pistol', tags:['walther','pdp','9mm','optic-ready'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d6/Walther_PPK.jpg' },
  { id:'pistol-028', title:'Mossberg MC2c Compact 9mm', category:'pistol', tags:['mossberg','mc2c','9mm','compact'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/80/Beretta_92FS_bk.jpg' },
  { id:'pistol-029', title:'Kahr Arms PM9 Micro Pistol', category:'pistol', tags:['kahr','pm9','micro','9mm','pocket'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/54/Ruger_LCP.jpg' },
  { id:'pistol-030', title:'Taurus Judge .45 Colt/.410 Revolver', category:'pistol', tags:['taurus','judge','revolver','410','45colt'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a0/S%26W_Model_686.jpg' },

  // ── RIFLES (40) ─────────────────────────────────────────────────────────────
  { id:'rifle-001', title:'M4A1 SOPMOD Block II US Military', category:'rifle', tags:['ar15','m4','556','military'], source:'US DoD', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-002', title:'AR-15 Sporting Rifle', category:'rifle', tags:['ar15','556','223','sporting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-003', title:'AK-47 Pattern Rifle', category:'rifle', tags:['ak47','762x39','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2b/AK-47_type_II_Para_title.jpg' },
  { id:'rifle-004', title:'Remington 700 Bolt Action Precision', category:'rifle', tags:['remington','700','bolt-action','precision'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-005', title:'M16A1 Vietnam Era Rifle', category:'rifle', tags:['m16','vietnam','military','556'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/5/5b/M16A1_brimob.jpg' },
  { id:'rifle-006', title:'AR-10 .308 Precision Rifle', category:'rifle', tags:['ar10','308','762','precision'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'rifle-007', title:'Ruger Mini-14 Ranch Rifle', category:'rifle', tags:['ruger','mini14','ranch','223'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/Ruger_Mini-14.jpg' },
  { id:'rifle-008', title:'Barrett M82A1 .50 BMG Anti-Material', category:'rifle', tags:['barrett','m82','50bmg','anti-material'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/f/f4/M82A1_barrett.jpg' },
  { id:'rifle-009', title:'M24 Sniper Weapon System', category:'rifle', tags:['m24','sniper','308','bolt-action'], source:'US Army', url:'https://upload.wikimedia.org/wikipedia/commons/4/48/M24_sniper.jpg' },
  { id:'rifle-010', title:'Ruger 10/22 Semiauto Rimfire', category:'rifle', tags:['ruger','1022','22lr','rimfire','training'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ruger10-22.jpg' },
  { id:'rifle-011', title:'Springfield M1A SOCOM .308', category:'rifle', tags:['springfield','m1a','308','762','socom'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d0/M14_rifle.jpg' },
  { id:'rifle-012', title:'Steyr AUG Bullpup Rifle', category:'rifle', tags:['steyr','aug','bullpup','556'], source:'Austrian Military', url:'https://upload.wikimedia.org/wikipedia/commons/6/67/Steyr_AUG_A3.jpg' },
  { id:'rifle-013', title:'FN SCAR-17S Heavy .308', category:'rifle', tags:['fn','scar','308','762','heavy'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/SCAR-H.jpg' },
  { id:'rifle-014', title:'HK 416 Assault Rifle', category:'rifle', tags:['hk','416','556','assault'], source:'German Military', url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/HK416.jpg' },
  { id:'rifle-015', title:'Tikka T3x Hunter Bolt Action', category:'rifle', tags:['tikka','t3x','hunter','bolt-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-016', title:'Winchester Model 70 Hunting Rifle', category:'rifle', tags:['winchester','70','hunting','bolt-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/97/Winchester_Model_70.jpg' },
  { id:'rifle-017', title:'Browning BAR Hunting Semi-Auto', category:'rifle', tags:['browning','bar','hunting','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-018', title:'Marlin Model 336 .30-30 Lever Action', category:'rifle', tags:['marlin','336','3030','lever-action','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/56/Marlin_336.jpg' },
  { id:'rifle-019', title:'Henry Golden Boy .22 Lever Action', category:'rifle', tags:['henry','golden-boy','22lr','lever-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ruger10-22.jpg' },
  { id:'rifle-020', title:'Howa 1500 Long Range Rifle', category:'rifle', tags:['howa','1500','long-range','bolt-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-021', title:'CMMG Banshee 9mm Pistol Caliber Carbine', category:'rifle', tags:['cmmg','banshee','9mm','pcc'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-022', title:'Kel-Tec Sub2000 Folding 9mm', category:'rifle', tags:['keltec','sub2000','9mm','folding','pcc'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-023', title:'Ruger PC Carbine 9mm', category:'rifle', tags:['ruger','pc-carbine','9mm','pistol-caliber'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-024', title:'SIG MCX Spear 6.8x51 Next-Gen', category:'rifle', tags:['sig','mcx','spear','68x51','xm5'], source:'US Army', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-025', title:'Aero Precision M5 AR-10 Build', category:'rifle', tags:['aero','m5','ar10','308','build'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'rifle-026', title:'Palmetto State Armory AR-15', category:'rifle', tags:['psa','ar15','556','budget'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-027', title:'Rock River Arms RRAGE Carbine', category:'rifle', tags:['rra','rrage','556','carbine'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-028', title:'LWRC Individual Carbine .223', category:'rifle', tags:['lwrc','ic','556','piston','carbine'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-029', title:'Sako 85 Finnish Hunting Rifle', category:'rifle', tags:['sako','85','finnish','hunting','precision'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-030', title:'Christensen Arms Mesa Titanium', category:'rifle', tags:['christensen','mesa','titanium','lightweight'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-031', title:'Daniel Defense DD5 V5 .308', category:'rifle', tags:['daniel-defense','dd5','308','precision'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'rifle-032', title:'Accuracy International AXMC Chassis', category:'rifle', tags:['ai','axmc','precision','long-range'], source:'UK Military', url:'https://upload.wikimedia.org/wikipedia/commons/4/48/M24_sniper.jpg' },
  { id:'rifle-033', title:'Colt Canada C7 Service Rifle', category:'rifle', tags:['colt','c7','canada','556'], source:'Canadian Forces', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-034', title:'PTR 91 GI .308 Battle Rifle', category:'rifle', tags:['ptr','91','308','battle-rifle','roller-delayed'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'rifle-035', title:'M1 Garand WWII Service Rifle', category:'rifle', tags:['m1','garand','wwii','30-06','historic'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/e/e7/M1_Garand_clip_eject.jpg' },
  { id:'rifle-036', title:'Springfield M1A Scout Squad Rifle', category:'rifle', tags:['springfield','m1a','scout','308'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d0/M14_rifle.jpg' },
  { id:'rifle-037', title:'Kriss Vector CRB 9mm Carbine', category:'rifle', tags:['kriss','vector','9mm','carbine','compact'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-038', title:'Tavor X95 Bullpup 5.56', category:'rifle', tags:['tavor','x95','bullpup','556','iwi'], source:'IDF', url:'https://upload.wikimedia.org/wikipedia/commons/6/67/Steyr_AUG_A3.jpg' },
  { id:'rifle-039', title:'Ruger Precision Rifle 6.5 Creedmoor', category:'rifle', tags:['ruger','precision','65cm','creedmoor','prs'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-040', title:'Mossberg MVP Patrol .308', category:'rifle', tags:['mossberg','mvp','308','bolt-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },

  // ── SHOTGUNS (15) ────────────────────────────────────────────────────────────
  { id:'shotgun-001', title:'Mossberg 500 Pump Action 12 Gauge', category:'shotgun', tags:['mossberg','500','pump','12gauge'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'shotgun-002', title:'Remington 870 Wingmaster Classic', category:'shotgun', tags:['remington','870','pump','12gauge'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },
  { id:'shotgun-003', title:'Benelli M4 Tactical Semi-Auto', category:'shotgun', tags:['benelli','m4','tactical','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-004', title:'Mossberg 590A1 Mil-Spec Tactical', category:'shotgun', tags:['mossberg','590a1','tactical','pump'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'shotgun-005', title:'Beretta A400 Extreme Hunting Shotgun', category:'shotgun', tags:['beretta','a400','hunting','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-006', title:'Browning Citori Over-Under', category:'shotgun', tags:['browning','citori','over-under','clays'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },
  { id:'shotgun-007', title:'Kel-Tec KSG Bullpup Pump', category:'shotgun', tags:['keltec','ksg','bullpup','pump','tactical'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'shotgun-008', title:'Winchester SXP Defender Tactical', category:'shotgun', tags:['winchester','sxp','defender','pump'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },
  { id:'shotgun-009', title:'Remington 1100 Semi-Auto Classic', category:'shotgun', tags:['remington','1100','semi-auto','classic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-010', title:'Mossberg 590 Shockwave 12 Gauge', category:'shotgun', tags:['mossberg','590','shockwave','12gauge','NFA'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'shotgun-011', title:'Benelli Nova Field Pump', category:'shotgun', tags:['benelli','nova','field','pump','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },
  { id:'shotgun-012', title:'Charles Daly 12-Gauge Tactical', category:'shotgun', tags:['charles-daly','tactical','12gauge','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-013', title:'Stoeger M3000 Semi-Auto Defense', category:'shotgun', tags:['stoeger','m3000','semi-auto','defense'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-014', title:'Browning A5 Lightning Hunting', category:'shotgun', tags:['browning','a5','lightning','hunting','semi-auto'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },
  { id:'shotgun-015', title:'CZ 712 G3 Semi-Auto Shotgun', category:'shotgun', tags:['cz','712','semi-auto','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },

  // ── SUPPRESSORS / NFA (10) ──────────────────────────────────────────────────
  { id:'supp-001', title:'Pistol Suppressor Attached', category:'suppressor', tags:['suppressor','silencer','nfa','pistol'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/10/Silencer.jpg' },
  { id:'supp-002', title:'Rifle Suppressor SOPMOD Kit', category:'suppressor', tags:['suppressor','rifle','nfa','tactical'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/1/1d/SOPMOD_Kit.jpg' },
  { id:'supp-003', title:'SilencerCo Omega 300 Suppressor', category:'suppressor', tags:['silencerco','omega','300','rifle'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'supp-004', title:'Dead Air Sandman Suppressor', category:'suppressor', tags:['dead-air','sandman','suppressor','rifle'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'supp-005', title:'AAC M4-2000 5.56 Suppressor', category:'suppressor', tags:['aac','m4','556','suppressor'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'supp-006', title:'SureFire SOCOM Suppressor', category:'suppressor', tags:['surefire','socom','suppressor','military'], source:'US Special Forces', url:'https://upload.wikimedia.org/wikipedia/commons/1/1d/SOPMOD_Kit.jpg' },
  { id:'supp-007', title:'Liberty Cosmic Pistol Suppressor', category:'suppressor', tags:['liberty','cosmic','pistol','9mm'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/10/Silencer.jpg' },
  { id:'supp-008', title:'Thunder Beast Ultra 7 Suppressor', category:'suppressor', tags:['thunder-beast','ultra','308','suppressor'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1d/SOPMOD_Kit.jpg' },
  { id:'supp-009', title:'Rugged Suppressors Surge Rimfire', category:'suppressor', tags:['rugged','surge','22lr','rimfire'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/10/Silencer.jpg' },
  { id:'supp-010', title:'Gemtech GMT-300BLK SBR Suppressor', category:'suppressor', tags:['gemtech','300blk','sbr','suppressor'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },

  // ── AMMUNITION (20) ─────────────────────────────────────────────────────────
  { id:'ammo-001', title:'Pistol Cartridge Lineup 9mm .45 .40', category:'ammo', tags:['ammo','9mm','45acp','40sw'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'ammo-002', title:'Rifle Cartridge Comparison 5.56 .308', category:'ammo', tags:['ammo','556','308','rifle'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-003', title:'JHP Hollow Point Defensive Ammo', category:'ammo', tags:['jhp','hollow-point','defensive'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Hollowpoint_bullet.jpg' },
  { id:'ammo-004', title:'12 Gauge Shotgun Shell 00 Buck', category:'ammo', tags:['shotgun','shell','12gauge','00buck'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/09/Shotgun_shells_2.jpg' },
  { id:'ammo-005', title:'.22 LR Rimfire Cartridges', category:'ammo', tags:['22lr','rimfire','plinking'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/.22_Long_Rifle_Comparison.JPG' },
  { id:'ammo-006', title:'5.56 NATO M855 Green Tip', category:'ammo', tags:['556','nato','m855','green-tip'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-007', title:'7.62x39 AK Cartridges', category:'ammo', tags:['762x39','ak','cartridge'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-008', title:'.300 Blackout Subsonic Supersonic', category:'ammo', tags:['300blk','subsonic','supersonic','suppressor'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-009', title:'6.5 Creedmoor Long Range Precision', category:'ammo', tags:['65cm','creedmoor','precision','long-range'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-010', title:'Federal Premium HST 9mm+P', category:'ammo', tags:['federal','hst','9mm','defensive','premium'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Hollowpoint_bullet.jpg' },
  { id:'ammo-011', title:'Hornady Critical Defense .380 ACP', category:'ammo', tags:['hornady','critical-defense','380','carry'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Hollowpoint_bullet.jpg' },
  { id:'ammo-012', title:'Speer Gold Dot .45 ACP Carry', category:'ammo', tags:['speer','gold-dot','45acp','carry'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Hollowpoint_bullet.jpg' },
  { id:'ammo-013', title:'Winchester White Box FMJ 9mm 115gr', category:'ammo', tags:['winchester','white-box','fmj','9mm','training'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'ammo-014', title:'Remington Core-Lokt .308 Hunting', category:'ammo', tags:['remington','core-lokt','308','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-015', title:'Fiocchi 5.56 M193 55gr Training', category:'ammo', tags:['fiocchi','556','m193','training','fmj'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-016', title:'CCI Mini-Mag .22 LR Copper Plated', category:'ammo', tags:['cci','mini-mag','22lr','copper'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/.22_Long_Rifle_Comparison.JPG' },
  { id:'ammo-017', title:'Underwood 10mm Hard Cast Bear Loads', category:'ammo', tags:['underwood','10mm','hard-cast','bear'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'ammo-018', title:'Nosler Partition .30-06 Hunting', category:'ammo', tags:['nosler','partition','3006','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-019', title:'Buffalo Bore .44 Magnum Hard Cast', category:'ammo', tags:['buffalo-bore','44magnum','hard-cast','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'ammo-020', title:'Aguila .22 LR Colibri Subsonic', category:'ammo', tags:['aguila','22lr','colibri','subsonic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/.22_Long_Rifle_Comparison.JPG' },

  // ── LAW / 2A / LEGAL (15) ───────────────────────────────────────────────────
  { id:'law-001', title:'US Supreme Court Building', category:'law', tags:['supreme-court','scotus','law'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f5/US_Supreme_Court_Building.jpg' },
  { id:'law-002', title:'United States Constitution Page 1', category:'law', tags:['constitution','2a','rights'], source:'US National Archives', url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'law-003', title:'Bill of Rights Second Amendment', category:'law', tags:['2a','bill-of-rights','text'], source:'US National Archives', url:'https://upload.wikimedia.org/wikipedia/commons/e/e4/Bill_of_Rights_Pg1of1_AC.jpg' },
  { id:'law-004', title:'US Capitol Building West Side', category:'law', tags:['congress','capitol','legislation'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
  { id:'law-005', title:'ATF Bureau of Alcohol Tobacco Firearms', category:'law', tags:['atf','federal','agency'], source:'US Government', url:'https://upload.wikimedia.org/wikipedia/commons/5/57/US-AlcoholTobaccoFirearmsAndExplosives-Seal.svg' },
  { id:'law-006', title:'US Department of Justice Seal', category:'law', tags:['doj','justice','federal','law'], source:'US Government', url:'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_United_States_Department_of_Justice.svg' },
  { id:'law-007', title:'National Rifle Association NRA Logo', category:'law', tags:['nra','lobby','organization'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f5/US_Supreme_Court_Building.jpg' },
  { id:'law-008', title:'Senate Chamber US Congress', category:'law', tags:['senate','congress','legislation','chamber'], source:'US Congress', url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
  { id:'law-009', title:'State Legislature Building', category:'law', tags:['state','legislature','law'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
  { id:'law-010', title:'Fourth Amendment Search Warrant', category:'law', tags:['fourth','amendment','rights','warrant'], source:'US Archives', url:'https://upload.wikimedia.org/wikipedia/commons/e/e4/Bill_of_Rights_Pg1of1_AC.jpg' },
  { id:'law-011', title:'Heller v DC Case Documents', category:'law', tags:['heller','dc','scotus','2a'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f5/US_Supreme_Court_Building.jpg' },
  { id:'law-012', title:'Bruen Decision New York Supreme Court', category:'law', tags:['bruen','ny','scotus','carry'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f5/US_Supreme_Court_Building.jpg' },
  { id:'law-013', title:'National Shooting Sports Foundation NSSF', category:'law', tags:['nssf','industry','organization'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'law-014', title:'SAF Second Amendment Foundation Seal', category:'law', tags:['saf','2a','foundation','rights'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/e/e4/Bill_of_Rights_Pg1of1_AC.jpg' },
  { id:'law-015', title:'Gun Owners of America GOA Lobby', category:'law', tags:['goa','lobby','rights','organization'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },

  // ── TRAINING / RANGE (15) ───────────────────────────────────────────────────
  { id:'train-001', title:'Pistol Shooting Isosceles Stance', category:'training', tags:['training','stance','pistol','range'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-002', title:'USMC Rifle Qualification Range', category:'training', tags:['marine','rifle','range','qual'], source:'US Marine Corps', url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-003', title:'US Navy Pistol Training at Sea', category:'training', tags:['navy','pistol','training','shooting'], source:'US Navy', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'train-004', title:'Army Marksmanship Training Program', category:'training', tags:['army','marksmanship','training','rifle'], source:'US Army', url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-005', title:'Police Pistol Qualification Course', category:'training', tags:['police','pistol','qualification','law-enforcement'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-006', title:'Dry Fire Home Training Practice', category:'training', tags:['dry-fire','home','training','practice'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-007', title:'Concealed Carry Draw From Holster', category:'training', tags:['ccw','draw','holster','carry','training'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'train-008', title:'Rifle Prone Position Long Range', category:'training', tags:['prone','rifle','position','long-range'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-009', title:'Defensive Shotgun Training Course', category:'training', tags:['shotgun','defensive','training','course'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'train-010', title:'Shooting Range Indoor Lane', category:'training', tags:['range','indoor','lane','target'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-011', title:'Three-Gun Competition Training Stage', category:'training', tags:['3gun','competition','stage','training'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-012', title:'Force-on-Force Simunition Training', category:'training', tags:['fof','simunition','force','training'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'train-013', title:'Low Light Pistol Shooting with Weapon Light', category:'training', tags:['low-light','pistol','weapon-light','training'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-014', title:'Carbine Transition Drills Training', category:'training', tags:['carbine','transition','drills','ar15'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-015', title:'First Aid TCCC Tactical Shooting', category:'training', tags:['tccc','first-aid','tactical','medical'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },

  // ── COMPETITION (10) ────────────────────────────────────────────────────────
  { id:'comp-001', title:'IPSC USPSA Practical Shooting Stage', category:'competition', tags:['uspsa','ipsc','competition','stage'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },
  { id:'comp-002', title:'Long Range Precision Rifle PRS Match', category:'competition', tags:['prs','precision','long-range','match'], source:'US Army', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },
  { id:'comp-003', title:'IDPA International Defensive Pistol', category:'competition', tags:['idpa','defensive','pistol','match'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },
  { id:'comp-004', title:'NRA High Power Rifle Prone Match', category:'competition', tags:['nra','high-power','rifle','prone'], source:'NRA', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },
  { id:'comp-005', title:'Steel Challenge Shooting Competition', category:'competition', tags:['steel-challenge','speed','competition'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },
  { id:'comp-006', title:'3-Gun Nation Competition Multi-Stage', category:'competition', tags:['3gun','nation','multi-stage','pistol','rifle'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },
  { id:'comp-007', title:'Cowboy Action Shooting SASS Match', category:'competition', tags:['cowboy','action','sass','lever-action'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },
  { id:'comp-008', title:'Biathlon Cross-Country Rifle', category:'competition', tags:['biathlon','cross-country','rifle','olympic'], source:'Olympic Committee', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },
  { id:'comp-009', title:'Benchrest Precision Shooting', category:'competition', tags:['benchrest','precision','accuracy','competition'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },
  { id:'comp-010', title:'Olympic Pistol 10m Air Pistol Finals', category:'competition', tags:['olympic','air-pistol','10m','precision'], source:'Olympic Committee', url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },

  // ── HUNTING (15) ─────────────────────────────────────────────────────────────
  { id:'hunt-001', title:'Whitetail Deer Hunt Bolt Action Rifle', category:'hunting', tags:['hunting','deer','whitetail','rifle'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-002', title:'Turkey Hunting Spring Season Shotgun', category:'hunting', tags:['hunting','turkey','shotgun','spring'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },
  { id:'hunt-003', title:'Elk Hunting Western Mountains', category:'hunting', tags:['hunting','elk','mountain','rifle','western'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-004', title:'Wild Boar Hog Hunting .308', category:'hunting', tags:['hunting','boar','hog','308'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-005', title:'Duck Waterfowl Hunting Blind', category:'hunting', tags:['hunting','duck','waterfowl','shotgun','blind'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },
  { id:'hunt-006', title:'Pheasant Upland Bird Hunting', category:'hunting', tags:['hunting','pheasant','upland','bird','shotgun'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },
  { id:'hunt-007', title:'Mule Deer Western Tag Hunt', category:'hunting', tags:['hunting','mule-deer','western','tag'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-008', title:'Pronghorn Antelope Antelope Hunt', category:'hunting', tags:['hunting','pronghorn','antelope','rifle'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-009', title:'Bear Hunting with Lever Action', category:'hunting', tags:['hunting','bear','lever-action','big-game'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-010', title:'Black Bear Spring Archery Hunt', category:'hunting', tags:['hunting','black-bear','spring','big-game'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-011', title:'Quail Hunting Classic Southern Upland', category:'hunting', tags:['hunting','quail','upland','southern'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },
  { id:'hunt-012', title:'Moose Alaska Hunt .300 Win Mag', category:'hunting', tags:['hunting','moose','alaska','300winmag'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-013', title:'Coyote Predator Hunting Night Optics', category:'hunting', tags:['hunting','coyote','predator','night'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-014', title:'Whitetail Rut Bow Season Crossover', category:'hunting', tags:['hunting','rut','whitetail','season'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-015', title:'Goose Canada Geese Waterfowl Migration', category:'hunting', tags:['hunting','goose','waterfowl','migration'], source:'USFWS', url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },

  // ── GEAR / ACCESSORIES (15) ─────────────────────────────────────────────────
  { id:'gear-001', title:'Liberty Centurion Gun Safe Home', category:'gear', tags:['safe','storage','home','security'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'gear-002', title:'Kydex IWB Holster Concealed Carry', category:'gear', tags:['holster','iwb','kydex','carry','edc'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-003', title:'Trijicon RMR Red Dot on Glock', category:'gear', tags:['trijicon','rmr','red-dot','optic'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0f/Trijicon_RMR_on_Glock.jpg' },
  { id:'gear-004', title:'ACOG Scope on M16 Combat Optic', category:'gear', tags:['acog','scope','m16','combat','optic'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/c/c7/ACOG_on_M16.jpg' },
  { id:'gear-005', title:'SureFire X300U Weapon Mounted Light', category:'gear', tags:['surefire','x300','weapon-light','tactical'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-006', title:'Magpul PMAG 30-Round AR-15 Magazine', category:'gear', tags:['magpul','pmag','magazine','ar15','30rd'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'gear-007', title:'Drop Leg Holster Tactical OWB', category:'gear', tags:['holster','drop-leg','owb','tactical'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-008', title:'Vortex Viper HD 10x42 Binoculars', category:'gear', tags:['vortex','binoculars','optic','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/c/c7/ACOG_on_M16.jpg' },
  { id:'gear-009', title:'Leupold VX-Freedom 3-9x40 Scope', category:'gear', tags:['leupold','scope','3-9x40','hunting'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/c/c7/ACOG_on_M16.jpg' },
  { id:'gear-010', title:'Streamlight TLR-1 HL Weapon Light', category:'gear', tags:['streamlight','tlr1','weapon-light'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-011', title:'Alien Gear Cloak Tuck 3.5 Holster', category:'gear', tags:['alien-gear','cloak-tuck','holster','iwb'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-012', title:'Holosun 507C Red Dot Pistol Optic', category:'gear', tags:['holosun','507c','red-dot','pistol'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/0/0f/Trijicon_RMR_on_Glock.jpg' },
  { id:'gear-013', title:'Safariland ALS Duty Holster', category:'gear', tags:['safariland','als','duty','retention','holster'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-014', title:'KeyMod MLOK Rail Accessory System', category:'gear', tags:['keymod','mlok','rail','ar15','handguard'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'gear-015', title:'Lancer Systems L5AWM Translucent Magazine', category:'gear', tags:['lancer','l5awm','magazine','translucent'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },

  // ── HOME DEFENSE (10) ────────────────────────────────────────────────────────
  { id:'hd-001', title:'Home Defense Shotgun Mossberg 590', category:'homedefense', tags:['home-defense','shotgun','tactical'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'hd-002', title:'Pistol with Weapon Light Home Defense', category:'homedefense', tags:['pistol','weapon-light','home-defense'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'hd-003', title:'AR-15 Home Defense Carbine Setup', category:'homedefense', tags:['ar15','home-defense','carbine','setup'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'hd-004', title:'Biometric Handgun Safe Bedside', category:'homedefense', tags:['safe','biometric','bedside','quick-access'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'hd-005', title:'Home Surveillance Security System', category:'homedefense', tags:['security','surveillance','home','camera'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'hd-006', title:'Sabre Pepper Spray Defense', category:'homedefense', tags:['pepper-spray','defense','less-lethal'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'hd-007', title:'Lock and Load Safe Storage Practice', category:'homedefense', tags:['lock','load','safe','storage','practice'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'hd-008', title:'Doorway Clearing Tactics Home Defense', category:'homedefense', tags:['clearing','doorway','tactics','home-defense'], source:'US Military', url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'hd-009', title:'Secure Handgun Trigger Lock', category:'homedefense', tags:['trigger-lock','security','storage','safety'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'hd-010', title:'ADT Home Security Alarm System', category:'homedefense', tags:['alarm','security','home','adt'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },

  // ── INDUSTRY / NEWS (10) ────────────────────────────────────────────────────
  { id:'news-001', title:'SHOT Show Las Vegas Convention', category:'news', tags:['shot-show','industry','trade','nssf'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'news-002', title:'Smith & Wesson Manufacturing Plant', category:'news', tags:['smith-wesson','manufacturing','factory'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'news-003', title:'Colt Industries Connecticut Factory', category:'news', tags:['colt','factory','manufacturing','history'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'news-004', title:'FBI NICS Background Check System', category:'news', tags:['nics','background-check','fbi','system'], source:'US Government', url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'news-005', title:'FFL Dealer Counter Gun Store', category:'news', tags:['ffl','dealer','gun-store','retail'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'news-006', title:'SIG Sauer New Hampshire HQ', category:'news', tags:['sig-sauer','hq','manufacturer','nh'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/3/37/M17_Modular_Handgun_System.jpg' },
  { id:'news-007', title:'Glock Inc Smyrna Georgia Facility', category:'news', tags:['glock','factory','smyrna','georgia'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/2/2a/Glock17.jpg' },
  { id:'news-008', title:'Black Friday Gun Sales Record NICS', category:'news', tags:['black-friday','gun-sales','nics','record'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'news-009', title:'ATF Form 4473 Firearm Purchase', category:'news', tags:['atf','4473','form','purchase','ffl'], source:'US Government', url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'news-010', title:'NICS Gun Sales Monthly Data Chart', category:'news', tags:['nics','gun-sales','monthly','data'], source:'Public Domain', url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
]

async function uploadFromUrl(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent':'Mozilla/5.0','Referer':'https://en.wikipedia.org/','Accept':'image/*,*/*' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.includes('image') && !contentType.includes('svg')) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength < 2000) return null
    const asset = await sanity.assets.upload('image', Buffer.from(buffer), { filename, contentType })
    return asset?.url || null
  } catch (e) {
    console.error(`Upload failed for ${filename}:`, e.message)
    return null
  }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  const cronAuth = req.headers.get('authorization')
  const isCron = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  if (key !== process.env.ADMIN_KEY && !isCron) return Response.json({ error:'Unauthorized' }, { status:401 })

  const { force = false, category = null, limit = null } = await req.json().catch(() => ({}))

  const existing = await sanity.fetch(`*[_type == "imageAsset"]{_id}`)
  const existingIds = new Set(existing.map(e => e._id))

  let seeds = category ? IMAGE_SEEDS.filter(s => s.category === category) : IMAGE_SEEDS
  if (limit && limit > 0) seeds = seeds.slice(0, limit)

  const results = { seeded:0, skipped:0, failed:0, total:seeds.length, items:[] }

  for (const seed of seeds) {
    const docId = `imageAsset-${seed.id}`
    if (!force && existingIds.has(docId)) { results.skipped++; continue }

    const filename = `${seed.id}.${seed.url.endsWith('.svg') ? 'svg' : 'jpg'}`
    const cdnUrl = await uploadFromUrl(seed.url, filename)

    if (!cdnUrl) {
      results.failed++
      results.items.push({ id:seed.id, status:'failed', title:seed.title })
      await new Promise(r => setTimeout(r, 200))
      continue
    }

    try {
      await sanity.createOrReplace({
        _id: docId, _type:'imageAsset',
        title: seed.title, alt: seed.title,
        category: seed.category, tags: seed.tags,
        source: seed.source, approved: true, usageCount: 0,
        cdnUrl, imageUrl: cdnUrl,
      })
      results.seeded++
      results.items.push({ id:seed.id, status:'seeded', title:seed.title })
    } catch (e) {
      results.failed++
      results.items.push({ id:seed.id, status:'db-error', title:seed.title, error:e.message })
    }
    await new Promise(r => setTimeout(r, 400))
  }

  return Response.json({ ok:true, ...results })
}

export async function GET(req) { return POST(req) }
