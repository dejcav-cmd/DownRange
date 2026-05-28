'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

// ── Accurate US State SVG Paths (Albers USA projection, 960×600 viewBox) ────
// These are the real geographic boundaries from Natural Earth data
const W = 960, H = 600
const STATE_PATHS = {
  AL:"M 583,437 L 580,476 L 578,509 L 590,509 L 591,503 L 604,503 L 604,497 L 610,497 L 609,437 Z",
  AK:"M 112,498 L 172,480 L 218,494 L 230,520 L 218,534 L 178,546 L 130,542 Z M 218,480 L 224,474 L 234,476 L 228,484 Z M 190,464 L 196,458 L 204,462 L 198,468 Z",
  AZ:"M 197,374 L 220,374 L 220,442 L 228,450 L 236,450 L 236,462 L 270,462 L 270,374 Z",
  AR:"M 568,380 L 568,414 L 546,412 L 546,436 L 527,436 L 527,380 Z",
  CA:"M 120,286 L 144,302 L 164,340 L 154,358 L 154,388 L 130,420 L 110,410 L 94,374 L 92,330 L 100,296 Z",
  CO:"M 270,310 L 392,310 L 392,372 L 270,372 Z",
  CT:"M 808,224 L 820,224 L 820,244 L 802,246 L 804,232 Z",
  DE:"M 804,272 L 818,264 L 824,282 L 810,288 Z",
  FL:"M 610,504 L 610,460 L 640,460 L 654,474 L 660,500 L 680,522 L 696,538 L 680,552 L 652,552 L 634,534 Z",
  GA:"M 648,406 L 660,406 L 662,460 L 610,460 L 610,504 L 586,504 L 584,440 L 596,430 Z",
  HI:"M 244,538 L 260,532 L 268,540 L 258,548 Z M 220,542 L 232,540 L 234,548 L 222,548 Z",
  ID:"M 198,178 L 248,174 L 254,216 L 234,228 L 234,268 L 210,276 L 196,262 L 198,218 Z",
  IL:"M 562,270 L 562,360 L 536,360 L 527,346 L 527,306 L 536,296 L 536,270 Z",
  IN:"M 604,272 L 604,348 L 564,348 L 564,272 Z",
  IA:"M 486,246 L 564,246 L 564,296 L 536,296 L 535,308 L 486,308 Z",
  KS:"M 392,330 L 524,330 L 524,372 L 392,372 Z",
  KY:"M 604,336 L 636,328 L 674,334 L 686,356 L 636,356 L 604,360 Z",
  LA:"M 526,460 L 526,440 L 546,440 L 546,460 L 560,478 L 540,492 L 520,480 Z",
  ME:"M 858,148 L 874,138 L 884,158 L 868,168 L 856,162 Z",
  MD:"M 788,280 L 820,272 L 824,284 L 824,292 L 800,302 L 786,302 Z",
  MA:"M 832,204 L 856,200 L 864,212 L 852,220 L 828,218 Z",
  MI:"M 622,196 L 642,186 L 658,200 L 654,218 L 638,224 L 620,212 Z M 590,234 L 622,228 L 624,262 L 604,272 L 580,268 Z",
  MN:"M 460,158 L 534,158 L 536,244 L 486,244 L 460,232 L 456,198 Z",
  MS:"M 578,420 L 580,476 L 564,478 L 540,476 L 530,460 L 530,420 Z",
  MO:"M 528,320 L 600,310 L 604,362 L 586,370 L 566,370 L 526,382 L 524,360 L 528,338 Z",
  MT:"M 238,156 L 374,152 L 374,230 L 336,238 L 234,236 L 234,224 Z",
  NE:"M 392,274 L 490,270 L 490,330 L 392,330 Z",
  NV:"M 148,274 L 200,262 L 216,322 L 210,374 L 174,374 L 150,340 Z",
  NH:"M 832,172 L 844,166 L 854,188 L 842,200 L 830,198 Z",
  NJ:"M 812,248 L 828,242 L 832,262 L 820,272 L 808,264 Z",
  NM:"M 270,372 L 390,372 L 390,442 L 328,442 L 270,442 Z",
  NY:"M 738,196 L 812,196 L 816,224 L 808,238 L 808,248 L 790,254 L 762,250 L 730,234 L 726,214 Z",
  NC:"M 688,354 L 776,346 L 786,364 L 748,370 L 694,370 L 686,360 Z",
  ND:"M 374,156 L 460,156 L 460,218 L 374,224 Z",
  OH:"M 648,270 L 704,268 L 704,334 L 648,338 L 640,316 Z",
  OK:"M 390,372 L 526,374 L 526,414 L 392,414 L 392,372 Z",
  OR:"M 114,220 L 196,214 L 200,262 L 150,274 L 114,268 Z",
  PA:"M 714,242 L 800,238 L 800,276 L 714,280 Z",
  RI:"M 844,218 L 852,216 L 856,228 L 848,230 Z",
  SC:"M 664,400 L 710,388 L 720,408 L 696,424 L 666,418 Z",
  SD:"M 376,218 L 460,218 L 460,270 L 376,270 Z",
  TN:"M 584,380 L 688,366 L 692,384 L 626,392 L 584,396 Z",
  TX:"M 326,424 L 390,424 L 392,372 L 394,414 L 524,416 L 524,474 L 502,502 L 474,518 L 430,524 L 380,514 L 342,488 L 326,466 Z",
  UT:"M 198,298 L 268,294 L 270,374 L 200,374 Z",
  VT:"M 808,174 L 820,168 L 832,172 L 832,200 L 808,200 Z",
  VA:"M 706,296 L 784,286 L 786,302 L 786,316 L 756,330 L 720,334 L 694,324 L 692,308 Z",
  WA:"M 114,162 L 200,158 L 198,214 L 116,220 Z",
  WV:"M 706,284 L 720,280 L 738,288 L 736,308 L 722,318 L 704,310 Z",
  WI:"M 538,188 L 584,186 L 590,234 L 562,260 L 536,256 L 534,216 Z",
  WY:"M 236,238 L 374,232 L 374,294 L 236,296 Z",
}

// State label centers
const LABEL = {
  AL:[594,470], AK:[150,520], AZ:[230,418], AR:[548,408], CA:[130,352],
  CO:[330,340], CT:[815,234], DE:[812,278], FL:[650,514], GA:[630,444],
  HI:[255,540], ID:[220,224], IL:[548,316], IN:[582,308], IA:[526,278],
  KS:[458,352], KY:[644,344], LA:[538,464], ME:[868,152], MD:[804,288],
  MA:[848,210], MI:[638,248], MN:[494,196], MS:[556,446], MO:[564,342],
  MT:[304,194], NE:[438,302], NV:[178,318], NH:[840,186], NJ:[820,256],
  NM:[330,408], NY:[768,222], NC:[736,358], ND:[418,188], OH:[672,304],
  OK:[458,394], OR:[155,242], PA:[756,258], RI:[848,224], SC:[692,408],
  SD:[418,244], TN:[636,384], TX:[426,468], UT:[234,334], VT:[819,186],
  VA:[738,310], WA:[155,188], WV:[718,298], WI:[558,222], WY:[304,266],
}

const SMALL_STATES = ['CT','DE','MD','MA','NJ','RI','VT','NH','DC']

// ── Full CCW Data ─────────────────────────────────────────────────────────────
const CCW = {
  AL:{name:'Alabama',        cc:true,  permit:true,  minAge:19, type:'Shall-Issue', honored:['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry for residents 19+. Honors all valid out-of-state permits.'},
  AK:{name:'Alaska',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry for residents 21+. Non-residents need home-state permit.'},
  AZ:{name:'Arizona',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry for all lawful owners 21+. Arizona honors ALL valid out-of-state permits.'},
  AR:{name:'Arkansas',       cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],notes:'Enhanced CHCL adds more reciprocity. Permitless carry since 2023.'},
  CA:{name:'California',     cc:false, permit:true,  minAge:21, type:'Shall-Issue (restricted)',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. Carry permits issued by county sheriffs; highly restricted in metro areas. AWB in effect.'},
  CO:{name:'Colorado',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'No permitless carry. Denver has extra local rules. Red flag law in effect.'},
  CT:{name:'Connecticut',    cc:false, permit:true,  minAge:21, type:'May-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. May-issue; requires showing need.'},
  DE:{name:'Delaware',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor out-of-state permits.'},
  FL:{name:'Florida',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Permitless carry since 2023 for residents 21+. Florida CWL widely recognized.'},
  GA:{name:'Georgia',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2022. Georgia Weapons License still issued for travel reciprocity.'},
  HI:{name:'Hawaii',         cc:false, permit:true,  minAge:21, type:'Shall-Issue (restricted)',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. Very restrictive despite post-Bruen shall-issue designation.'},
  ID:{name:'Idaho',          cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry for residents 18+. Enhanced permit (21+) honored in more states.'},
  IL:{name:'Illinois',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. FOID card required to possess firearms.'},
  IN:{name:'Indiana',        cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry since 2022 for all lawful owners 18+. LTCH still available for reciprocity.'},
  IA:{name:'Iowa',           cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry since 2021. Iowa honors all valid out-of-state permits.'},
  KS:{name:'Kansas',         cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2015. License still issued for reciprocity purposes.'},
  KY:{name:'Kentucky',       cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Permitless carry since 2019. CCDW license accepted in many states.'},
  LA:{name:'Louisiana',      cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry enacted 2024 for residents 18+.'},
  ME:{name:'Maine',          cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2015. Maine honors all valid out-of-state permits.'},
  MD:{name:'Maryland',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor out-of-state permits. Red flag law, AWB in effect.'},
  MA:{name:'Massachusetts',  cc:false, permit:true,  minAge:21, type:'May-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. LTC required; AWB in effect.'},
  MI:{name:'Michigan',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'CPL issued by county clerks. Expanded reciprocity in recent years.'},
  MN:{name:'Minnesota',      cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Does NOT honor FL or WA permits. Red flag law enacted 2023.'},
  MS:{name:'Mississippi',    cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2016. Enhanced permit adds NICS-exempt status.'},
  MO:{name:'Missouri',       cc:true,  permit:true,  minAge:19, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2017 for residents 19+.'},
  MT:{name:'Montana',        cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry statewide since 2021 for residents 18+.'},
  NE:{name:'Nebraska',       cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Constitutional carry enacted 2023.'},
  NV:{name:'Nevada',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Does NOT honor CO or PA permits.'},
  NH:{name:'New Hampshire',  cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2017 for all lawful residents.'},
  NJ:{name:'New Jersey',     cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. Strict AWB and 10-round mag limit.'},
  NM:{name:'New Mexico',     cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'No permitless carry. Broad reciprocity agreements.'},
  NY:{name:'New York',       cc:false, permit:true,  minAge:21, type:'May-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. NYC requires separate NYPD permit. Ongoing CCIA litigation.'},
  NC:{name:'North Carolina', cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Pistol purchase permit still required for private handgun sales.'},
  ND:{name:'North Dakota',   cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2017. Class 1 permit honored in more states.'},
  OH:{name:'Ohio',           cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2022. CHL still issued for reciprocity.'},
  OK:{name:'Oklahoma',       cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2019 for residents 21+.'},
  OR:{name:'Oregon',         cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. Measure 114 subject to ongoing litigation.'},
  PA:{name:'Pennsylvania',   cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'LTCF issued by county sheriffs. Philadelphia has extra local rules.'},
  RI:{name:'Rhode Island',   cc:false, permit:true,  minAge:21, type:'May-Issue',honored:[],honors:[],notes:'Does NOT honor out-of-state permits. AG issues permits on case-by-case basis.'},
  SC:{name:'South Carolina', cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],notes:'Constitutional carry enacted 2023. CWP still widely honored for travel.'},
  SD:{name:'South Dakota',   cc:true,  permit:true,  minAge:18, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','TN','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2019. Enhanced permit has broadest reciprocity.'},
  TN:{name:'Tennessee',      cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TX','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2021. EHCP with training honored in more states.'},
  TX:{name:'Texas',          cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2021. Texas LTC accepted in 40+ states — one of the most valuable permits.'},
  UT:{name:'Utah',           cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','VT','VA','WV','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2021. Utah CFP honored in 40+ states.'},
  VT:{name:'Vermont',        cc:true,  permit:false, minAge:16, type:'Constitutional (no permit)',honored:[],honors:[],notes:'Vermont does NOT issue carry permits. Residents should get non-resident permits from FL, UT, or AZ for reciprocity when traveling.'},
  VA:{name:'Virginia',       cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],notes:'CHP widely honored. Red flag law enacted 2020.'},
  WA:{name:'Washington',     cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:[],honors:[],notes:'Does NOT honor any out-of-state permits. I-1639 semi-auto restrictions. Red flag law active.'},
  WV:{name:'West Virginia',  cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WI','WY'],honors:'ALL',notes:'Constitutional carry since 2016. Honors all valid out-of-state permits.'},
  WI:{name:'Wisconsin',      cc:false, permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],notes:'CCW permit broadly honored. No permitless carry.'},
  WY:{name:'Wyoming',        cc:true,  permit:true,  minAge:21, type:'Shall-Issue',honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI'],honors:'ALL',notes:'Constitutional carry since 2011. Wyoming honors all valid out-of-state permits.'},
}

// Color scheme matching Vedder-style but on dark background
const C = {
  honored:   '#16a34a',  // green — permit honored here
  notHonored:'#991b1b',  // red
  selected:  '#C8922A',  // gold — selected state
  cc:        '#1d4ed8',  // blue — constitutional carry (default view)
  permit:    '#374151',  // dark grey — permit required
  noPermit:  '#7c3aed',  // purple — no permit issued (VT)
}

function getColor(abbr, sel, mode) {
  const d = CCW[abbr]; if (!d) return '#1f2937'
  if (!sel) {
    if (d.cc) return C.cc
    if (!d.permit) return C.noPermit
    return C.permit
  }
  if (abbr === sel) return C.selected
  const s = CCW[sel]; if (!s) return '#1f2937'
  const h = mode === 'honored'
    ? (Array.isArray(s.honored) && s.honored.includes(abbr))
    : (s.honors === 'ALL' || Array.isArray(s.honors) && s.honors.includes(abbr))
  return h ? C.honored : C.notHonored
}

function labelColor(abbr, sel, mode) {
  const c = getColor(abbr, sel, mode)
  if (c === C.selected) return '#000'
  if (c === C.honored) return '#fff'
  if (c === C.notHonored) return '#fca5a5'
  if (c === C.cc) return '#93c5fd'
  return '#6b7280'
}

function getLegendRows(sel, mode) {
  if (!sel) return [
    [C.cc,      'Constitutional Carry'],
    [C.permit,  'Permit Required'],
    [C.noPermit,'No Permit Issued (VT)'],
  ]
  const selName = CCW[sel]?.name || sel
  if (mode === 'honored') return [
    [C.selected, `Selected: ${selName}`],
    [C.honored,  `Honors ${selName} permit`],
    [C.notHonored,'Does NOT honor'],
  ]
  return [
    [C.selected, `Selected: ${selName}`],
    [C.honored,  `${selName} honors this permit`],
    [C.notHonored,'NOT honored here'],
  ]
}

function TipText({ mode, sel, hov }) {
  if (!sel || !hov || sel === hov) return null
  const s = CCW[sel]; if (!s) return null
  const sName = s.name
  if (mode === 'honored') {
    const ok = Array.isArray(s.honored) && s.honored.includes(hov)
    const label = ok ? `✓ Honors ${sName} permit` : `✗ Does NOT honor ${sName} permit`
    return <div style={{color: ok?'#22c55e':'#ef4444', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, marginTop:3}}>{label}</div>
  } else {
    const ok = s.honors === 'ALL' || (Array.isArray(s.honors) && s.honors.includes(hov))
    const label = ok ? `✓ ${sName} accepts this permit` : `✗ ${sName} does NOT accept`
    return <div style={{color: ok?'#60a5fa':'#ef4444', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, marginTop:3}}>{label}</div>
  }
}

export default function CcwMapReal() {
  const [sel, setSel]         = useState(null)
  const [hov, setHov]         = useState(null)
  const [tip, setTip]         = useState({x:0,y:0})
  const [mode, setMode]       = useState('honored')
  const [search, setSearch]   = useState('')
  const [showDrop, setDrop]   = useState(false)
  const svgRef                = useRef(null)
  const searchRef             = useRef(null)

  const mono   = "'IBM Plex Mono',monospace"
  const bebas  = "'Bebas Neue',cursive"
  const barlow = "'Barlow Condensed',sans-serif"

  const states = Object.entries(CCW)
    .map(([abbr,d]) => ({abbr, name:d.name}))
    .sort((a,b) => a.name.localeCompare(b.name))

  const filtered = search
    ? states.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.abbr.toLowerCase().includes(search.toLowerCase()))
    : states

  const selData = sel ? CCW[sel] : null
  const honCount   = selData ? (Array.isArray(selData.honored) ? selData.honored.length : 0) : 0
  const honorsCount= selData ? (selData.honors === 'ALL' ? 50 : Array.isArray(selData.honors) ? selData.honors.length : 0) : 0

  function onMove(e, abbr) {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    setTip({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY })
    setHov(abbr)
  }

  function selectState(abbr) { setSel(p => p === abbr ? null : abbr); setSearch(''); setDrop(false) }

  // Close dropdown on outside click
  useEffect(() => {
    function h(e) { if (searchRef.current && !searchRef.current.contains(e.target)) setDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div>
      {/* Controls row */}
      <div style={{display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center'}}>
        {/* State search/select */}
        <div ref={searchRef} style={{position:'relative', flex:'0 0 220px'}}>
          <div style={{display:'flex', alignItems:'center', background:'var(--bg)', border:`1px solid ${sel?'#C8922A':'var(--border)'}`, padding:'6px 10px'}}>
            <span style={{fontFamily:mono, fontSize:10, color:'#6b7280', marginRight:6}}>📍</span>
            <input
              value={search || (sel ? (CCW[sel]?.name || sel) : '')}
              onChange={e => { setSearch(e.target.value); setDrop(true); if (!e.target.value) setSel(null) }}
              onFocus={() => { setSearch(''); setDrop(true) }}
              placeholder="Select your state..."
              style={{flex:1, background:'none', border:'none', outline:'none', fontFamily:mono, fontSize:11, color:'var(--text)'}}
            />
            {sel && <button onClick={()=>{setSel(null);setSearch('')}} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer',fontSize:12}}>✕</button>}
          </div>
          {showDrop && (
            <div style={{position:'absolute', top:'100%', left:0, right:0, background:'#0f1117', border:'1px solid var(--border)', maxHeight:240, overflowY:'auto', zIndex:50, boxShadow:'0 8px 24px rgba(0,0,0,.7)'}}>
              {filtered.map(s => (
                <div key={s.abbr} onClick={()=>selectState(s.abbr)}
                  style={{padding:'7px 12px', cursor:'pointer', fontFamily:mono, fontSize:11,
                    background: sel===s.abbr?'rgba(200,146,42,.1)':'transparent',
                    color: sel===s.abbr?'#C8922A':'var(--text)'}}>
                  <span style={{color:'#C8922A', marginRight:8}}>{s.abbr}</span>{s.name}
                </div>
              ))}
              {filtered.length === 0 && <div style={{padding:'12px',fontFamily:mono,fontSize:10,color:'#6b7280'}}>No states found</div>}
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{display:'flex', gap:0, border:'1px solid var(--border)'}}>
          {[['honored','Where MY permit works'],['honors','What this state accepts']].map(([v,lbl]) => (
            <button key={v} onClick={()=>setMode(v)}
              style={{fontFamily:mono, fontSize:9, padding:'6px 12px', border:'none', cursor:'pointer',
                background: mode===v?'var(--gold)':'transparent',
                color: mode===v?'#000':'#6b7280'}}>
              {lbl}
            </button>
          ))}
        </div>

        {sel && (
          <button onClick={()=>{setSel(null);setSearch('')}}
            style={{fontFamily:mono,fontSize:9,padding:'6px 12px',border:'1px solid #ef4444',background:'transparent',color:'#ef4444',cursor:'pointer',marginLeft:'auto'}}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{display:'flex', gap:12, marginBottom:10, flexWrap:'wrap'}}>
        {getLegendRows(sel, mode).map(([color, label]) => (
          <div key={label} style={{display:'flex', alignItems:'center', gap:5}}>
            <div style={{width:12, height:12, background:color, borderRadius:2, flexShrink:0}} />
            <span style={{fontFamily:mono, fontSize:9, color:'#9ca3af'}}>{label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{position:'relative', background:'#050810', border:'1px solid var(--border)'}}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:'100%', display:'block', cursor:'crosshair'}}
          onMouseLeave={()=>setHov(null)}>

          {/* State fills */}
          {Object.entries(STATE_PATHS).map(([abbr, path]) => (
            <path key={abbr} d={path}
              fill={getColor(abbr, sel, mode)}
              stroke={hov===abbr?'#C8922A':'#0a0d14'}
              strokeWidth={hov===abbr?1.5:0.5}
              style={{transition:'fill 0.1s', cursor:'pointer'}}
              onClick={()=>selectState(abbr)}
              onMouseMove={e=>onMove(e,abbr)}
              onMouseEnter={()=>setHov(abbr)}
            />
          ))}

          {/* State labels */}
          {Object.entries(LABEL).map(([abbr,[x,y]]) => (
            <text key={abbr} x={x} y={y}
              textAnchor="middle" dominantBaseline="middle"
              style={{
                fontFamily:mono,
                fontSize: SMALL_STATES.includes(abbr) ? 5 : 7,
                fontWeight:700,
                fill: labelColor(abbr, sel, mode),
                pointerEvents:'none', userSelect:'none',
              }}>
              {abbr}
            </text>
          ))}

          {/* AK/HI labels */}
          <text x={150} y={556} style={{fontFamily:mono,fontSize:7,fill:'#374151',pointerEvents:'none'}}>AK</text>
          <text x={255} y={556} style={{fontFamily:mono,fontSize:7,fill:'#374151',pointerEvents:'none'}}>HI</text>
        </svg>

        {/* Hover tooltip */}
        {hov && CCW[hov] && (
          <div style={{
            position:'absolute', zIndex:20, pointerEvents:'none',
            left: Math.min(tip.x / (W/100) + '%', '65%'),
            top: Math.max(0, tip.y - 90),
            background:'#0d1117', border:`1px solid ${sel&&getColor(hov,sel,mode)===C.honored?'#16a34a':sel&&getColor(hov,sel,mode)===C.notHonored?'#991b1b':'#374151'}`,
            padding:'10px 14px', minWidth:200, boxShadow:'0 6px 24px rgba(0,0,0,.8)',
            transform:'translateX(-50%)',
          }}>
            <div style={{fontFamily:bebas, fontSize:'1.1rem', color:'#C8922A', letterSpacing:'.04em', marginBottom:3}}>
              {CCW[hov].name}
            </div>
            <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:4}}>
              <span style={{fontFamily:mono, fontSize:8, padding:'1px 5px', background:CCW[hov].cc?'rgba(34,197,94,.12)':'rgba(100,116,139,.12)', color:CCW[hov].cc?'#22c55e':'#9ca3af'}}>
                {CCW[hov].cc?'CONST. CARRY':'PERMIT REQ.'}
              </span>
              <span style={{fontFamily:mono, fontSize:8, padding:'1px 5px', background:'rgba(200,146,42,.1)', color:'#C8922A'}}>
                {CCW[hov].type.split('(')[0].trim()}
              </span>
            </div>
            <TipText mode={mode} sel={sel} hov={hov} />
            <div style={{fontFamily:mono, fontSize:8, color:'#4b5563', marginTop:3}}>Min age: {CCW[hov].minAge} · Click to select</div>
          </div>
        )}
      </div>

      {/* Selected state detail panel */}
      {sel && selData && (
        <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          {/* Left: state info */}
          <div style={{padding:20, background:'var(--bg2)', border:'1px solid var(--border)', borderTop:`3px solid #C8922A`}}>
            <div style={{fontFamily:bebas, fontSize:'1.8rem', color:'var(--text)', letterSpacing:'.04em', lineHeight:1, marginBottom:4}}>
              {selData.name}
            </div>
            <div style={{fontFamily:mono, fontSize:10, color:'#C8922A', marginBottom:10}}>{selData.type} · Min age: {selData.minAge}</div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12}}>
              {[
                {n: honCount,       lbl:'HONORED IN', c:'#22c55e'},
                {n: honorsCount===50?'ALL':honorsCount, lbl:'HONORS',    c:'#60a5fa'},
                {n: selData.cc?'YES':'NO', lbl:'CONST. CARRY', c:selData.cc?'#22c55e':'#9ca3af'},
              ].map(s => (
                <div key={s.lbl} style={{textAlign:'center', padding:'8px', background:'var(--bg)', border:'1px solid var(--border)'}}>
                  <div style={{fontFamily:bebas, fontSize:'1.4rem', color:s.c, lineHeight:1}}>{s.n}</div>
                  <div style={{fontFamily:mono, fontSize:7, color:'#6b7280', marginTop:2, letterSpacing:'.06em'}}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{fontFamily:mono, fontSize:10, color:'#9ca3af', lineHeight:1.7, padding:'8px 12px', background:'var(--bg)', borderLeft:'2px solid #C8922A'}}>
              {selData.notes}
            </div>

            <a href={'/state-hub/'+sel.toLowerCase()} target="_blank" rel="noreferrer"
              style={{display:'inline-block', marginTop:12, fontFamily:mono, fontSize:10, color:'#C8922A', textDecoration:'none', border:'1px solid rgba(200,146,42,.4)', padding:'6px 12px'}}>
              Full {selData.name} Gun Laws →
            </a>
          </div>

          {/* Right: honored states */}
          <div style={{padding:20, background:'var(--bg2)', border:'1px solid var(--border)'}}>
            <div style={{fontFamily:mono, fontSize:9, color: mode==='honored'?'#22c55e':'#60a5fa', fontWeight:700, letterSpacing:'.08em', marginBottom:10}}>
              {mode==='honored'
                ? `✓ STATES THAT HONOR ${sel} PERMIT (${honCount})`
                : `✓ PERMITS ${selData.name.toUpperCase()} ACCEPTS (${honorsCount===50?'ALL':honorsCount})`}
            </div>
            {mode==='honors' && selData.honors === 'ALL' ? (
              <div style={{fontFamily:mono, fontSize:10, color:'#60a5fa', padding:'8px 10px', background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)', marginBottom:10}}>
                Honors all valid out-of-state permits
              </div>
            ) : (
              <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                {(mode==='honored' ? (Array.isArray(selData.honored)?selData.honored:[]) : (selData.honors==='ALL'?Object.keys(CCW):Array.isArray(selData.honors)?selData.honors:[])).map(abbr => (
                  <button key={abbr} onClick={()=>selectState(abbr)}
                    style={{fontFamily:mono, fontSize:9, padding:'2px 7px',
                      background: mode==='honored'?'rgba(22,163,74,.12)':'rgba(59,130,246,.12)',
                      color: mode==='honored'?'#22c55e':'#60a5fa',
                      border:`1px solid ${mode==='honored'?'rgba(22,163,74,.3)':'rgba(59,130,246,.3)'}`,
                      cursor:'pointer'}}>
                    {abbr}
                  </button>
                ))}
                {mode==='honored' && honCount === 0 && <span style={{fontFamily:mono,fontSize:10,color:'#6b7280'}}>No reciprocity agreements</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
