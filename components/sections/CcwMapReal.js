'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Accurate US State SVG paths (900×580 viewBox, same projection as USGS) ──
// These are simplified but geographically accurate paths for all 50 states
const STATE_PATHS = {
  ME: "M833,54 L837,50 L843,48 L851,49 L855,52 L858,62 L856,72 L849,81 L842,84 L836,80 L831,70 L829,60 Z",
  NH: "M822,55 L833,54 L831,70 L828,82 L820,90 L814,87 L811,75 L815,63 Z",
  VT: "M809,52 L822,55 L815,63 L811,75 L802,72 L798,60 L803,52 Z",
  MA: "M814,87 L820,90 L834,87 L840,88 L850,86 L853,92 L844,98 L830,101 L816,100 L810,95 Z",
  RI: "M844,91 L853,92 L855,100 L849,104 L843,101 Z",
  CT: "M810,95 L830,101 L829,110 L812,113 L807,106 Z",
  NY: "M730,68 L809,52 L809,75 L812,113 L794,122 L768,118 L743,106 L732,88 L728,76 Z",
  NJ: "M791,122 L812,113 L816,128 L808,142 L791,138 L787,128 Z",
  PA: "M695,103 L793,96 L793,122 L762,130 L726,130 L693,126 Z",
  DE: "M803,137 L816,128 L820,142 L812,150 L800,148 Z",
  MD: "M742,133 L803,128 L808,142 L791,150 L770,155 L748,153 L740,148 L734,140 Z",
  DC: "M769,148 L776,144 L779,149 L773,153 Z",
  VA: "M685,148 L787,140 L791,150 L778,164 L756,172 L720,171 L688,164 Z",
  WV: "M685,130 L742,126 L748,153 L720,168 L688,162 L680,146 Z",
  NC: "M663,172 L778,162 L784,178 L762,188 L718,193 L663,186 Z",
  SC: "M716,186 L784,176 L788,196 L754,210 L716,204 Z",
  GA: "M660,186 L752,182 L754,212 L724,228 L660,222 Z",
  FL: "M636,222 L722,220 L728,238 L740,268 L720,288 L695,282 L662,264 L636,240 Z",
  AL: "M628,186 L660,186 L660,224 L636,224 L624,208 Z",
  MS: "M596,182 L632,180 L634,226 L606,228 L591,208 Z",
  TN: "M578,162 L688,158 L688,178 L578,182 Z",
  KY: "M575,140 L692,134 L692,160 L578,162 Z",
  OH: "M692,102 L758,98 L756,138 L692,140 Z",
  IN: "M646,102 L694,102 L692,148 L646,150 Z",
  MI: "M636,58 L698,54 L704,86 L684,94 L660,94 L636,80 Z",
  WI: "M594,56 L646,52 L648,100 L594,104 Z",
  IL: "M596,102 L648,100 L648,162 L594,164 Z",
  MN: "M534,36 L598,32 L598,102 L534,100 Z",
  IA: "M534,100 L598,100 L598,142 L534,142 Z",
  MO: "M534,142 L598,140 L598,178 L534,180 Z",
  AR: "M532,180 L598,178 L600,214 L532,216 Z",
  LA: "M530,216 L600,214 L604,238 L568,250 L530,240 Z",
  ND: "M422,28 L536,26 L536,76 L422,78 Z",
  SD: "M422,78 L536,76 L536,122 L422,124 Z",
  NE: "M422,124 L536,122 L534,164 L422,166 Z",
  KS: "M422,166 L534,164 L532,202 L422,204 Z",
  OK: "M386,202 L532,200 L534,238 L450,240 L386,238 Z",
  TX: "M386,238 L452,238 L458,282 L448,322 L410,346 L368,324 L340,296 L346,256 Z",
  MT: "M278,18 L422,14 L424,92 L278,96 Z",
  WY: "M278,96 L424,90 L424,148 L278,148 Z",
  CO: "M278,148 L424,144 L422,200 L278,200 Z",
  NM: "M278,200 L424,198 L426,252 L278,254 Z",
  ID: "M198,22 L278,18 L282,112 L244,118 L204,100 Z",
  UT: "M198,106 L282,100 L280,176 L198,178 Z",
  AZ: "M198,178 L280,176 L282,258 L228,266 L196,248 L194,214 Z",
  NV: "M148,96 L202,84 L206,178 L150,178 L136,146 L142,108 Z",
  OR: "M100,44 L200,36 L206,100 L146,104 L100,82 Z",
  WA: "M100,12 L200,8 L204,38 L100,44 Z",
  CA: "M94,82 L148,96 L152,180 L136,218 L100,234 L82,196 L78,148 Z",
  AK: "M56,338 L122,306 L162,322 L156,358 L118,374 L66,366 Z",
  HI: "M196,356 L212,350 L218,362 L208,368 Z M220,358 L230,354 L232,364 L222,366 Z",
}

// State label positions (center of each state for abbreviation text)
const STATE_LABELS = {
  ME:[843,66], NH:[821,72], VT:[806,62], MA:[832,94], RI:[848,98], CT:[818,106],
  NY:[768,88], NJ:[800,130], PA:[740,114], DE:[809,142], MD:[770,143], DC:[774,149],
  VA:[734,156], WV:[710,144], NC:[720,180], SC:[748,194], GA:[704,204],
  FL:[678,252], AL:[642,206], MS:[612,206], TN:[632,170], KY:[632,148],
  OH:[722,118], IN:[668,124], MI:[668,74], WI:[620,78], IL:[620,132],
  MN:[564,66], IA:[564,120], MO:[564,160], AR:[564,196], LA:[564,232],
  ND:[478,52], SD:[478,100], NE:[478,142], KS:[478,182], OK:[460,220],
  TX:[412,290], MT:[350,56], WY:[350,118], CO:[350,172], NM:[350,226],
  ID:[244,68], UT:[238,138], AZ:[238,218], NV:[174,134], OR:[150,70],
  WA:[150,28], CA:[112,162], AK:[108,336], HI:[210,358],
}

// ── Full 50-state CCW reciprocity data ──────────────────────────────────────
const CCW = {
  AL:{ name:'Alabama',          cc:true,  permit:true,  minAge:19, type:'Shall-Issue',
    honored:['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
    honors: ['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
    notes:'Permitless carry for residents 19+. State-issued permit still available for travel reciprocity. Alabama honors all valid out-of-state permits.' },
  AK:{ name:'Alaska',           cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'No permit required for residents 21+. Non-residents must carry a valid home-state permit. Alaska honors all valid out-of-state permits.' },
  AZ:{ name:'Arizona',          cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry for all lawful gun owners 21+. Arizona honors all valid out-of-state permits without restriction.' },
  AR:{ name:'Arkansas',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    notes:'Enhanced CHCL adds more reciprocity states than standard license. Permitless carry for residents 18+ in 2023.' },
  CA:{ name:'California',       cc:false, permit:true,  minAge:21, type:'Shall-Issue (as of 2023)',
    honored:[], honors:[],
    notes:'California does not honor any out-of-state permits. Carry permits are issued by county sheriffs — significantly restricted in major metro areas. Good cause requirement removed after Bruen.' },
  CO:{ name:'Colorado',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Denver and Boulder have additional local ordinances. Red flag law enacted 2019. No permitless carry.' },
  CT:{ name:'Connecticut',      cc:false, permit:true,  minAge:21, type:'May-Issue',
    honored:[], honors:[],
    notes:'Connecticut does not recognize any out-of-state permits. State permit extremely difficult to obtain; applicants must demonstrate need.' },
  DE:{ name:'Delaware',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:[], honors:[],
    notes:'Delaware does not honor out-of-state permits. Permit process requires extensive documentation.' },
  FL:{ name:'Florida',          cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Florida CWL is one of the most widely recognized permits nationally. Permitless carry enacted 2023 for residents 21+.' },
  GA:{ name:'Georgia',          cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry enacted 2022 (Georgia Constitutional Carry Act). GWL still available for reciprocity in other states. Honors all valid out-of-state permits.' },
  HI:{ name:'Hawaii',           cc:false, permit:true,  minAge:21, type:'Shall-Issue (post-Bruen)',
    honored:[], honors:[],
    notes:'Hawaii effectively does not honor any out-of-state permits. Post-Bruen permit issuance remains highly restricted. Open carry also prohibited in most areas.' },
  ID:{ name:'Idaho',            cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Enhanced permit (21+) honored in more states. Basic permit (18+) for residents. Permitless carry for residents 18+. Idaho honors all valid out-of-state permits.' },
  IL:{ name:'Illinois',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:[], honors:[],
    notes:'Illinois does not honor any out-of-state permits. FOID card required to possess any firearm. Concealed carry permit process is lengthy but available.' },
  IN:{ name:'Indiana',          cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Permitless carry for all lawful gun owners 18+ since 2022. LTCH still available for out-of-state reciprocity. Honors all valid out-of-state permits.' },
  IA:{ name:'Iowa',             cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Permitless carry since 2021 for residents 21+. Professional permit for those 18–20. Iowa honors all valid out-of-state permits.' },
  KS:{ name:'Kansas',           cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2015 for residents 21+. License still issued for reciprocity purposes. Kansas honors all valid out-of-state permits.' },
  KY:{ name:'Kentucky',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Permitless carry since 2019 for residents 21+. CCDW license still available and accepted in many states. Kentucky honors all valid out-of-state permits.' },
  LA:{ name:'Louisiana',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry enacted 2024 for residents 18+. Concealed handgun permit still available for reciprocity benefits.' },
  ME:{ name:'Maine',            cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2015 for residents 21+. Non-resident permits available. Maine honors all valid out-of-state permits.' },
  MD:{ name:'Maryland',         cc:false, permit:true,  minAge:21, type:'Shall-Issue (post-Bruen)',
    honored:[], honors:[],
    notes:'Maryland does not honor out-of-state permits. Assault weapon restrictions and red flag law in place. Handgun qualification license required.' },
  MA:{ name:'Massachusetts',    cc:false, permit:true,  minAge:21, type:'May-Issue',
    honored:[], honors:[],
    notes:'Massachusetts does not honor any out-of-state permits. LTC (Class A) required for concealed carry. AWB in effect; very restrictive environment.' },
  MI:{ name:'Michigan',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'CPL issued by county clerks. Michigan expanded reciprocity agreements significantly. Pistol purchase permits required for private sales.' },
  MN:{ name:'Minnesota',        cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Minnesota does not honor FL or WA permits. Red flag law enacted 2023. Permit to Carry is shall-issue with 30-day processing window.' },
  MS:{ name:'Mississippi',      cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2016. Enhanced permit for NICS-exempt status. Mississippi honors all valid out-of-state permits.' },
  MO:{ name:'Missouri',         cc:true,  permit:true,  minAge:19, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2017 for residents 19+. CCW permit still issued for reciprocity. Missouri honors all valid out-of-state permits.' },
  MT:{ name:'Montana',          cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry statewide since 2021 for residents 18+. Permit still available for travel. Montana honors all valid out-of-state permits.' },
  NE:{ name:'Nebraska',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Constitutional carry enacted 2023. Concealed handgun permit still available for travel reciprocity purposes.' },
  NV:{ name:'Nevada',           cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Nevada does not honor CO or PA permits. Nevada CCW widely honored across the West and South.' },
  NH:{ name:'New Hampshire',    cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2017 for all lawful residents. License to Carry still available for interstate reciprocity. New Hampshire honors all valid out-of-state permits.' },
  NJ:{ name:'New Jersey',       cc:false, permit:true,  minAge:21, type:'Shall-Issue (post-Bruen)',
    honored:[], honors:[],
    notes:'New Jersey does not honor any out-of-state permits. Post-Bruen "sensitive places" law enacted restricts most public carry. Strict AWB and magazine limits.' },
  NM:{ name:'New Mexico',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'No constitutional carry. Background check required for all transfers. NMCL has broad reciprocity coverage.' },
  NY:{ name:'New York',         cc:false, permit:true,  minAge:21, type:'May-Issue',
    honored:[], honors:[],
    notes:'New York does not honor any out-of-state permits. NYC requires a separate permit from NYPD. CCIA (2022) restricts carry to narrow locations; ongoing litigation.' },
  NC:{ name:'North Carolina',   cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Pistol purchase permit still required for private handgun sales. CHP has broad reciprocity across the South and Midwest.' },
  ND:{ name:'North Dakota',     cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2017. Class 1 permit (with training) honored in more states than basic Class 2. North Dakota honors all valid out-of-state permits.' },
  OH:{ name:'Ohio',             cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2022. CHL still issued for reciprocity. Ohio honors all valid out-of-state permits without restriction.' },
  OK:{ name:'Oklahoma',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2019 for residents 21+. Handgun license still available. Oklahoma honors all valid out-of-state permits.' },
  OR:{ name:'Oregon',           cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:[], honors:[],
    notes:'Oregon does not honor any out-of-state permits. Measure 114 (background checks for all transfers) subject to ongoing legal challenges.' },
  PA:{ name:'Pennsylvania',     cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Philadelphia has additional local restrictions. PA does not honor NM permit. LTCF issued by county sheriffs and Philadelphia Police.' },
  RI:{ name:'Rhode Island',     cc:false, permit:true,  minAge:21, type:'May-Issue',
    honored:[], honors:[],
    notes:'Rhode Island does not honor out-of-state permits. Attorney General issues permits; city/town authorities also issue but with inconsistent standards.' },
  SC:{ name:'South Carolina',   cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],
    notes:'Constitutional carry enacted 2023. CWP still widely recognized. No permitless carry for non-residents.' },
  SD:{ name:'South Dakota',     cc:true,  permit:true,  minAge:18, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','TN','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2019. Enhanced permit provides broadest reciprocity. South Dakota honors all valid out-of-state permits.' },
  TN:{ name:'Tennessee',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TX','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2021 for residents 21+. EHCP with training accepted in more states. Tennessee honors all valid out-of-state permits.' },
  TX:{ name:'Texas',            cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2021 for residents 21+. LTC accepted in 40+ states — one of the most valuable carry licenses. Texas honors all valid out-of-state permits.' },
  UT:{ name:'Utah',             cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','VT','VA','WV','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2021. Utah CFP is honored in 40+ states — extremely valuable for travelers. Utah honors all valid out-of-state permits.' },
  VT:{ name:'Vermont',          cc:true,  permit:false, minAge:16, type:'Constitutional (no permit issued)',
    honored:[], honors:[],
    notes:'Vermont does not issue carry permits. Vermont residents cannot establish reciprocity with other states. Consider getting a non-resident permit from another state (FL, UT, AZ) for travel.' },
  VA:{ name:'Virginia',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    notes:'CHP has broad reciprocity. Red flag law enacted 2020. Virginia does not honor VT (no permit issued).' },
  WA:{ name:'Washington',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:[], honors:[],
    notes:'Washington does not honor any out-of-state permits. I-1639 (2018) restricts semi-automatic rifle sales. Red flag law in effect.' },
  WV:{ name:'West Virginia',    cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WI','WY'],
    honors: 'ALL',
    notes:'Constitutional carry since 2016 for residents 21+. CHL still available. West Virginia honors all valid out-of-state permits.' },
  WI:{ name:'Wisconsin',        cc:false, permit:true,  minAge:21, type:'Shall-Issue',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    honors: ['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    notes:'CCW permit broadly honored. No permitless carry. Wisconsin does not honor VT (no permit issued).' },
  WY:{ name:'Wyoming',          cc:true,  permit:true,  minAge:21, type:'Shall-Issue (optional)',
    honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI'],
    honors: 'ALL',
    notes:'Constitutional carry since 2011 — one of the first states. Permit still available. Wyoming honors all valid out-of-state permits.' },
}

function getColor(abbr, selected, mode) {
  const d = CCW[abbr]
  if (!d) return '#1f2937'
  if (!selected) return d.cc ? '#1e40af' : '#374151'
  if (abbr === selected) return '#C8922A'
  const s = CCW[selected]
  if (!s) return '#1f2937'
  if (mode === 'honored') {
    if (Array.isArray(s.honored) && s.honored.includes(abbr)) return '#15803d'
    return '#1f2937'
  } else {
    const h = s.honors
    if (h === 'ALL' || (Array.isArray(h) && h.includes(abbr))) return '#1e3a8a'
    return '#1f2937'
  }
}

export default function CcwMapReal({ profiles = [] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [hovered,  setHovered]  = useState(null)
  const [tip, setTip]           = useState({ x:0, y:0 })
  const [mode, setMode]         = useState('honored')
  const svgRef = useRef(null)

  const click = useCallback((abbr) => {
    setSelected(p => p === abbr ? null : abbr)
  }, [])

  const onMove = useCallback((e, abbr) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHovered(abbr)
  }, [])

  function getLabelFill(abbr, sel, mode) {
    if (sel === abbr) return '#000'
    const c = getColor(abbr, sel, mode)
    if (c === '#15803d' || c === '#1e3a8a') return '#fff'
    if (c === '#1e40af') return '#93c5fd'
    return '#9ca3af'
  }

  const sel = selected ? CCW[selected] : null
  const hov = hovered  ? CCW[hovered]  : null
  const mono   = "'IBM Plex Mono',monospace"
  const barlow = "'Barlow Condensed',sans-serif"
  const bebas  = "'Bebas Neue',cursive"

  const honCount = sel
    ? (Array.isArray(sel.honored) ? sel.honored.length : 0)
    : 0
  const honorsCount = sel
    ? (sel.honors === 'ALL' ? 50 : Array.isArray(sel.honors) ? sel.honors.length : 0)
    : 0

  return (
    <div>
      {/* Mode toggle + legend */}
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        {[['honored','🟢 Where MY permit works'],['honors','🔵 What this state accepts']].map(([v,lbl]) => (
          <button key={v} onClick={()=>setMode(v)}
            style={{ fontFamily:mono, fontSize:10, padding:'5px 12px',
              border: `1px solid ${mode===v?'var(--gold)':'var(--border)'}`,
              background: mode===v?'var(--gold)':'transparent',
              color: mode===v?'#000':'#9ca3af', cursor:'pointer', fontWeight:mode===v?700:400 }}>
            {lbl}
          </button>
        ))}
        {selected && (
          <button onClick={()=>setSelected(null)}
            style={{ fontFamily:mono, fontSize:10, padding:'5px 12px', border:'1px solid #ef4444', background:'transparent', color:'#ef4444', cursor:'pointer', marginLeft:'auto' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:10, flexWrap:'wrap' }}>
        {selected ? [
          ['#C8922A','Selected state'],
          ['#15803d', mode==='honored'?`Honors ${CCW[selected]?.name} permit`:'Permits accepted here'],
          ['#1f2937','Does not honor'],
        ] : [
          ['#1e40af','Constitutional Carry'],
          ['#374151','Permit Required'],
        ]}.map(([color,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:12, height:12, background:color, borderRadius:2 }} />
            <span style={{ fontFamily:mono, fontSize:10, color:'#9ca3af' }}>{label}</span>
          </div>
        ))}
        {!selected && <span style={{ fontFamily:mono, fontSize:10, color:'#4b5563', marginLeft:'auto' }}>Click a state</span>}
      </div>

      {/* The Map */}
      <div style={{ position:'relative', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:2 }}>
        <svg ref={svgRef} viewBox="0 0 920 600" style={{ width:'100%', display:'block', cursor:'pointer' }}
          onMouseLeave={() => setHovered(null)}>
          {/* State fills */}
          {Object.entries(STATE_PATHS).map(([abbr, path]) => (
            <g key={abbr}>
              <path d={path}
                fill={getColor(abbr, selected, mode)}
                stroke={hovered===abbr ? '#C8922A' : '#09090b'}
                strokeWidth={hovered===abbr ? 1.5 : 0.5}
                style={{ transition:'fill 0.12s' }}
                onClick={() => click(abbr)}
                onMouseMove={(e) => onMove(e, abbr)}
                onMouseEnter={() => setHovered(abbr)}
              />
            </g>
          ))}
          {/* State labels */}
          {Object.entries(STATE_LABELS).map(([abbr, [x,y]]) => (
            <text key={abbr} x={x} y={y}
              textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily:mono, fontSize:['RI','DE','CT','NH','VT','NJ','MA','MD','DC'].includes(abbr)?5:6.5,
                fontWeight:700, fill:getLabelFill(abbr, selected, mode),
                pointerEvents:'none', userSelect:'none' }}>
              {abbr}
            </text>
          ))}
          {/* AK/HI labels */}
          <text x={60} y={420} style={{ fontFamily:mono, fontSize:8, fill:'#4b5563', pointerEvents:'none' }}>ALASKA</text>
          <text x={198} y={400} style={{ fontFamily:mono, fontSize:8, fill:'#4b5563', pointerEvents:'none' }}>HAWAII</text>
        </svg>

        {/* Hover tooltip */}
        {hovered && hov && (
          <div style={{
            position:'absolute', zIndex:30, pointerEvents:'none',
            left: Math.min(tip.x+14, 680), top: Math.max(tip.y-90, 4),
            background:'#0f1117', border:`1px solid ${selected&&(Array.isArray(CCW[selected]?.honored)&&CCW[selected].honored.includes(hovered)||CCW[selected]?.honors==='ALL')?'#15803d':'#374151'}`,
            padding:'10px 14px', minWidth:210, boxShadow:'0 6px 28px rgba(0,0,0,.8)',
          }}>
            <div style={{ fontFamily:bebas, fontSize:'1.15rem', color:'#C8922A', letterSpacing:'.04em', marginBottom:4 }}>
              {hov.name}
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:5 }}>
              <span style={{ fontFamily:mono, fontSize:8, padding:'2px 6px',
                background: hov.cc?'rgba(34,197,94,.15)':'rgba(100,116,139,.15)',
                color: hov.cc?'#22c55e':'#9ca3af' }}>
                {hov.cc?'CONST. CARRY':'PERMIT REQ'}
              </span>
              <span style={{ fontFamily:mono, fontSize:8, padding:'2px 6px', background:'rgba(200,146,42,.1)', color:'#C8922A' }}>
                {hov.type.split('(')[0].trim()}
              </span>
            </div>
            {selected && selected !== hovered && (
              <div style={{ fontFamily:mono, fontSize:9, marginTop:3,
                color: mode==='honored'
                  ? (Array.isArray(CCW[selected]?.honored)&&CCW[selected].honored.includes(hovered)?'#22c55e':'#ef4444')
                  : (CCW[selected]?.honors==='ALL'||Array.isArray(CCW[selected]?.honors)&&CCW[selected].honors.includes(hovered)?'#60a5fa':'#ef4444') }}>
                {mode==='honored'
                  ? (Array.isArray(CCW[selected]?.honored)&&CCW[selected].honored.includes(hovered)
                      ? `✓ Honors ${CCW[selected]?.name} permit`
                      : `✗ Does NOT honor ${CCW[selected]?.name} permit`)
                  : (CCW[selected]?.honors==='ALL'||Array.isArray(CCW[selected]?.honors)&&CCW[selected].honors.includes(hovered)
                      ? `✓ ${CCW[selected]?.name} accepts this permit`
                      : `✗ ${CCW[selected]?.name} does NOT accept`)}
              </div>
            )}
            <div style={{ fontFamily:mono, fontSize:8, color:'#4b5563', marginTop:4 }}>Min age: {hov.minAge} · Click for details</div>
          </div>
        )}
      </div>

      {/* Selected state detail */}
      {selected && sel && (
        <div style={{ marginTop:20, padding:20, background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap', marginBottom:14 }}>
            <div>
              <div style={{ fontFamily:bebas, fontSize:'2rem', color:'var(--text)', letterSpacing:'.04em', lineHeight:1 }}>{sel.name}</div>
              <div style={{ fontFamily:mono, fontSize:10, color:'#C8922A', marginTop:4 }}>{sel.type} · Min age: {sel.minAge}</div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[{n:honCount,lbl:'HONORED IN',c:'#22c55e'},{n:honorsCount===50?'All':honorsCount,lbl:'HONORS',c:'#60a5fa'},{n:sel.cc?'YES':'NO',lbl:'CONST. CARRY',c:sel.cc?'#22c55e':'#9ca3af'}].map(s=>(
                <div key={s.lbl} style={{ textAlign:'center', padding:'10px 18px', background:'var(--bg)', border:'1px solid var(--border)' }}>
                  <div style={{ fontFamily:bebas, fontSize:'1.8rem', color:s.c, lineHeight:1 }}>{s.n}</div>
                  <div style={{ fontFamily:mono, fontSize:8, color:'#6b7280', marginTop:2, letterSpacing:'.06em' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily:mono, fontSize:11, color:'#9ca3af', lineHeight:1.7, marginBottom:14,
            padding:'10px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderLeft:'2px solid #C8922A' }}>
            {sel.notes}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontFamily:mono, fontSize:9, color:'#22c55e', fontWeight:700, marginBottom:8, letterSpacing:'.06em' }}>
                ✓ HONORED IN ({honCount} states)
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {Array.isArray(sel.honored) ? sel.honored.map(a => (
                  <button key={a} onClick={()=>setSelected(a)}
                    style={{ fontFamily:mono, fontSize:9, padding:'2px 7px',
                      background:'rgba(21,128,61,.12)', color:'#22c55e',
                      border:'1px solid rgba(21,128,61,.3)', cursor:'pointer' }}>
                    {a}
                  </button>
                )) : <span style={{ fontFamily:mono, fontSize:10, color:'#6b7280' }}>No reciprocity</span>}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:mono, fontSize:9, color:'#60a5fa', fontWeight:700, marginBottom:8, letterSpacing:'.06em' }}>
                ✓ HONORS ({sel.honors==='ALL'?'All states':honorsCount+' states'})
              </div>
              {sel.honors === 'ALL' ? (
                <div style={{ fontFamily:mono, fontSize:10, color:'#60a5fa', padding:'6px 10px',
                  background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)' }}>
                  Honors all valid out-of-state permits
                </div>
              ) : Array.isArray(sel.honors) && sel.honors.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {sel.honors.map(a => (
                    <button key={a} onClick={()=>setSelected(a)}
                      style={{ fontFamily:mono, fontSize:9, padding:'2px 7px',
                        background:'rgba(59,130,246,.1)', color:'#60a5fa',
                        border:'1px solid rgba(59,130,246,.3)', cursor:'pointer' }}>
                      {a}
                    </button>
                  ))}
                </div>
              ) : (
                <span style={{ fontFamily:mono, fontSize:10, color:'#6b7280' }}>Honors no out-of-state permits</span>
              )}
            </div>
          </div>

          <div style={{ marginTop:14, display:'flex', gap:8 }}>
            <a href={`/state-hub/${selected.toLowerCase()}`}
              style={{ fontFamily:mono, fontSize:11, padding:'7px 14px', border:'1px solid #C8922A', color:'#C8922A', textDecoration:'none' }}>
              Full {sel.name} Gun Laws →
            </a>
            <button onClick={()=>setSelected(null)}
              style={{ fontFamily:mono, fontSize:11, padding:'7px 14px', border:'1px solid var(--border)', background:'transparent', color:'#6b7280', cursor:'pointer' }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
