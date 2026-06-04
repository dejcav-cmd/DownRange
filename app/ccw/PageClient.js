'use client'
import { useState, useMemo } from 'react'
import Masthead    from '../../components/layout/Masthead'
import Footer      from '../../components/layout/Footer'

// ── Complete 50-state CCW dataset ─────────────────────────────────────────────
const STATES = [
  {
    abbr:'AL', name:'Alabama', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Carry Permit (CCP)', cost:'$20 (5 yr)', training:false, processingDays:30,
    honoring: ['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    honoredBy: ['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag: false, magLimit: null, awb: false,
    prohibited:['schools','courthouses','polling places','law enforcement','prisons','federal buildings'],
    notes: 'Alabama went Constitutional Carry on January 1, 2023. Permits are still available and valuable for reciprocity. Must be 21+ to carry without permit. 18-20 year olds must use permit path. LEO ID required on request.',
    uscca: 'Alabama is a shall-issue state. The county sheriff issues permits within 30 days. Non-resident permits are not available. Alabama honors all valid permits from any state.',
    vedder: 'Open carry is legal without a permit for anyone 18+. Constitutional carry took effect in 2023. Carrying while intoxicated or in prohibited locations remains illegal.',
  },
  {
    abbr:'AK', name:'Alaska', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$88.25 (5 yr)', training:false, processingDays:30,
    honoring:['AL','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','bars (if carrying)','federal buildings'],
    notes: 'Alaska was among the first permitless carry states in 2003. Any person 21+ who can legally own a firearm may carry concealed. Permits remain available for reciprocity purposes when traveling to other states.',
    uscca: 'Alaska issues permits for reciprocity purposes. No permit required to carry within the state for anyone 21+ who can legally possess a firearm.',
    vedder: 'Open carry is legal. Alaska does not require a permit to carry concealed for state residents. Guns are not allowed in court facilities or schools.',
  },
  {
    abbr:'AZ', name:'Arizona', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Weapons Permit (CWP)', cost:'$60 (5 yr)', training:false, processingDays:15,
    honoring:['AL','AK','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    honoredBy:['AL','AK','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','government buildings','polling places','hydroelectric plants','nuclear facilities'],
    notes: 'Arizona has allowed permitless carry since 2010. The Arizona permit is one of the most widely honored in the country — recognized in 38+ states — making it a top choice for a non-resident supplemental permit. Training is voluntary but strongly recommended.',
    uscca: 'Arizona is shall-issue. Permits issued by the Department of Public Safety. Non-resident permits available. Arizona honors all valid permits from every other state.',
    vedder: 'Open carry legal without permit. Constitutional carry applies to anyone 21+ who can legally possess a firearm. Must inform law enforcement of concealed weapon if asked.',
  },
  {
    abbr:'AR', name:'Arkansas', type:'Constitutional', permitless:true, age:18,
    permitType:'License to Carry Handgun (LTCH)', cost:'$86.50 (5 yr)', training:true, processingDays:120,
    honoring:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','police stations','state capitol','churches without permission'],
    notes: 'Arkansas enacted constitutional carry in 2021. Persons 18+ who can legally own a handgun may carry concealed without a permit. The LTCH permit requires an 8-hour training course and is valuable for reciprocity travel.',
    uscca: 'Arkansas is shall-issue. Permits are issued by the Department of Public Safety. Non-resident permits available with same requirements as residents.',
    vedder: 'Open carry is legal. Act 777 (2021) allows permitless concealed carry. Enhanced LTCH permit available for expanded carry rights. Church carry allowed with permission.',
  },
  {
    abbr:'CA', name:'California', type:'May-Issue', permitless:false, age:21,
    permitType:'Carry Concealed Weapon (CCW) License', cost:'$20–$100 (county varies)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','government buildings','hospitals','public transit','parks','sports venues','playgrounds','libraries','courts','polling places'],
    notes: 'California is one of the most restrictive states for CCW. The Bruen decision (2022) forced California to reform its "good cause" requirement. Shall-issue in theory, but local sheriffs still impose strict standards. California does not honor any other state\'s permit. No reciprocity of any kind.',
    uscca: 'Permits are issued by county sheriffs or city police chiefs. Training required. California requires a firearm safety certificate and imposes magazine capacity limits and assault weapon bans.',
    vedder: '10-round magazine limit strictly enforced. Handguns must be on the DOJ-approved roster. Microstamping required for new semi-auto pistols. Many guns legal elsewhere cannot be purchased or owned in California.',
  },
  {
    abbr:'CO', name:'Colorado', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$152.50 (5 yr)', training:true, processingDays:90,
    honoring:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:15, awb:false,
    prohibited:['schools','public buildings','police stations','federal facilities','demonstrations'],
    notes: 'Colorado is shall-issue at the county level. Denver and some municipalities have their own additional restrictions. 15-round magazine limit enacted in 2023. Red flag law in effect. Colorado only honors permits from states with similar training requirements.',
    uscca: 'Permits issued by county sheriffs. In-person training required. Colorado reciprocity is selective — only honors permits from states that honor Colorado permits and have similar training standards.',
    vedder: 'Colorado has preemption law but Denver is exempt. 15-round magazine capacity limit. Red flag ERPO law active. Some municipalities impose additional restrictions beyond state law.',
  },
  {
    abbr:'CT', name:'Connecticut', type:'May-Issue', permitless:false, age:21,
    permitType:'Carry Permit', cost:'$140 (5 yr)', training:true, processingDays:60,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','courts','government buildings','playgrounds','hospitals'],
    notes: 'Connecticut is effectively shall-issue in practice despite being classified as may-issue. The state has strict permit requirements, mandatory training, and does not honor any out-of-state permits. Connecticut issues permits to non-residents but reciprocity is not offered.',
    uscca: 'Both a state and local permit are required. Training is mandatory. Long gun eligibility certificate required separately. Connecticut is one of the most restrictive states for carry laws.',
    vedder: '10-round magazine limit. Assault weapons ban in effect. Firearms ID required for purchases. Large capacity magazine possession banned even if owned before the ban.',
  },
  {
    abbr:'DE', name:'Delaware', type:'Shall-Issue', permitless:false, age:21,
    permitType:'License to Carry Concealed Deadly Weapons', cost:'$65 (3 yr)', training:false, processingDays:60,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:17, awb:false,
    prohibited:['schools','courthouses','police stations','detention facilities'],
    notes: 'Delaware was historically may-issue but transitioned following Bruen. The state does not honor any out-of-state permits and its permits are honored in very few states. Application requires fingerprints and publication in local newspaper.',
    uscca: 'Delaware Superior Court issues permits. Application requires newspaper publication notice and background investigation. No training requirement but good moral character standard applies.',
    vedder: 'Delaware enacted a 17-round magazine limit in 2022. Red flag law in effect. The permit process is unusual — it requires newspaper publication allowing public objection to your application.',
  },
  {
    abbr:'FL', name:'Florida', type:'Shall-Issue', permitless:true, age:21,
    permitType:'Concealed Weapon License (CWL)', cost:'$97 (7 yr)', training:true, processingDays:50,
    honoring:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','police stations','prisons','airports','bars','government meetings','career centers'],
    notes: 'Florida enacted constitutional carry in 2023 while keeping its permit system. The Florida CWL is one of the most widely recognized permits in the country — honored in approximately 38 states. Red flag law remains in effect. Non-resident permits available to residents of any state.',
    uscca: 'Florida\'s concealed weapons license is issued by the Dept. of Agriculture and Consumer Services. Non-resident permits widely available. Florida now allows permitless carry for legal residents 21+.',
    vedder: 'Florida\'s HB 543 (2023) enacted constitutional carry. Carrying in bars is prohibited even when eating. The "10-20-Life" law has strict mandatory minimums for firearm crimes. Stand Your Ground law in effect.',
  },
  {
    abbr:'GA', name:'Georgia', type:'Constitutional', permitless:true, age:21,
    permitType:'Weapons Carry License (WCL)', cost:'$73.25 (5 yr)', training:false, processingDays:50,
    honoring:['AL','AK','AZ','AR','CO','FL','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons','places of worship during services unless licensed','government buildings','polling places','bars'],
    notes: 'Georgia\'s GEORGIA Constitutional Carry Act of 2022 (SB 319) allows any law-abiding Georgian 21+ to carry without a permit. The WCL remains available for reciprocity travel. Georgia has very favorable gun laws overall and accepts permits from most states.',
    uscca: 'Weapons Carry License issued by county probate judge. No training required for permit. Georgia also has permitless open carry. Non-resident permits not issued by Georgia.',
    vedder: 'Open carry legal with WCL. Permitless carry enacted 2022. Bars are prohibited for carry. Weapons carry in places of worship is a gray area — allowed without active service but with some caveats.',
  },
  {
    abbr:'HI', name:'Hawaii', type:'May-Issue', permitless:false, age:21,
    permitType:'License to Carry Pistol or Revolver', cost:'$10 + fees', training:true, processingDays:14,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:false,
    prohibited:['government buildings','schools','financial institutions','airports','public parks','medical facilities'],
    notes: 'Hawaii is effectively no-issue despite the Bruen ruling. The state adopted broad "sensitive places" restrictions after Bruen that make most of the state a gun-free zone. Hawaii does not honor any out-of-state permits. Very few carry licenses exist in Hawaii.',
    uscca: 'Hawaii\'s attorney general and Bruen implementation have created ongoing litigation. The state requires a permit to purchase and to carry. Registration is mandatory for all firearms.',
    vedder: 'Hawaii banned carry in most public places following Bruen. All firearms must be registered with HPD within 5 days of acquisition. Hawaii has universal background checks and a waiting period.',
  },
  {
    abbr:'ID', name:'Idaho', type:'Constitutional', permitless:true, age:18,
    permitType:'Enhanced Concealed Carry License', cost:'$20 (5 yr)', training:true, processingDays:90,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons'],
    notes: 'Idaho allows permitless carry for anyone 18+ who can legally possess a firearm (residents only for permitless). The Enhanced Concealed Carry License requires 8 hours training and is honored by more states than the standard license. Very gun-friendly state.',
    uscca: 'Standard and Enhanced licenses available. Enhanced requires more training but is honored by more states. Idaho shall-issue with no discretion by sheriff. Non-resident permits available.',
    vedder: 'Open carry is legal without permit. Idaho preemption law prevents local gun ordinances. The Enhanced permit is worth getting for travel — adds about 10 additional states of reciprocity.',
  },
  {
    abbr:'IL', name:'Illinois', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Firearm Concealed Carry License (FCCL)', cost:'$150 (5 yr)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:null, awb:true,
    prohibited:['schools','daycares','government buildings','hospitals','bars','public transit','parks','athletic stadiums','colleges','museums','libraries','parking facilities','nuclear facilities'],
    notes: 'Illinois was the last state to enact concealed carry, in 2013. The FCCL requires 16 hours of training and a FOID card. Illinois does not honor any out-of-state permits and no state honors Illinois permits in return. Also requires a FOID card for possession.',
    uscca: 'Must have both FOID card and FCCL to carry. 16-hour training required. Illinois has a massive list of prohibited places. Non-resident permits not available.',
    vedder: 'Illinois PICA (assault weapon ban) was enacted 2023 and has been subject to legal challenges. The prohibited places list is the most extensive of any state. Chicago has additional municipal restrictions.',
  },
  {
    abbr:'IN', name:'Indiana', type:'Constitutional', permitless:true, age:18,
    permitType:'Handgun License (HGL)', cost:'$0 (lifetime)', training:false, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons','courts'],
    notes: 'Indiana enacted constitutional carry in 2022. The HGL is now free and valid for lifetime — a great value for reciprocity. Indiana has strong preemption laws and is a very gun-friendly state. One of the easiest permit processes in the country.',
    uscca: 'The Indiana Handgun License is free and lifetime. Constitutional carry enacted July 1, 2022. Non-resident permits available and also free. Indiana honors all valid permits from any state.',
    vedder: 'Indiana has no duty-to-inform law. Open carry legal without permit. The free lifetime permit makes Indiana a top choice for reciprocity stacking. Preemption prevents local gun ordinances.',
  },
  {
    abbr:'IA', name:'Iowa', type:'Constitutional', permitless:true, age:21,
    permitType:'Permit to Carry Weapons', cost:'$50 (5 yr)', training:false, processingDays:30,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courts','jails','casinos operating under gaming license'],
    notes: 'Iowa enacted permitless carry in 2021. The permit is still widely available for travel reciprocity. Iowa honors all valid out-of-state permits. The state has strong preemption laws and recently removed the requirement for a permit-to-purchase.',
    uscca: 'Iowa permits issued by county sheriffs. Constitutional carry for anyone 21+ who can legally possess a firearm. Iowa is shall-issue with no discretion. Non-resident permits not available.',
    vedder: 'Open carry legal without permit. Iowa abolished its permit-to-acquire in 2021. Preemption law in effect. Iowa eliminated the permit-to-purchase requirement for handguns in 2021.',
  },
  {
    abbr:'KS', name:'Kansas', type:'Constitutional', permitless:true, age:21,
    permitType:'Kansas Concealed Carry License (KCCL)', cost:'$32.50 (4 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','law enforcement facilities','courthouses','state-owned buildings (with posting)'],
    notes: 'Kansas permitless carry has been in effect since 2015. The KCCL requires 8 hours training and is well-recognized for reciprocity. Kansas has strong Second Amendment protections and the Bruen decision reinforced its approach to carry laws.',
    uscca: 'KCCL issued by attorney general\'s office. Kansas honors all valid out-of-state permits. Constitutional carry for anyone 21+ who can legally possess. Non-resident permits available.',
    vedder: 'Open carry legal without permit. Kansas has no duty-to-inform law. State preemption prevents municipalities from enacting stricter gun laws. Very gun-friendly legislative environment.',
  },
  {
    abbr:'KY', name:'Kentucky', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Carry Deadly Weapons (CCDW)', cost:'$60 (5 yr)', training:true, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['police stations','jails','courthouses','schools'],
    notes: 'Kentucky enacted constitutional carry in 2019. The CCDW permit requires 8 hours of training and is recognized by most states. Kentucky has castle doctrine and no duty to retreat. The state is a member of the nationwide NICS system.',
    uscca: 'CCDW permit issued by state police. Training required for permit. Constitutional carry for anyone 21+ who can legally possess a firearm. Kentucky is gun-friendly with strong protections.',
    vedder: 'Open carry legal without permit. No duty to inform law enforcement of carry. Castle doctrine with no duty to retreat. Kentucky does not impose magazine capacity or AWB restrictions.',
  },
  {
    abbr:'LA', name:'Louisiana', type:'Constitutional', permitless:true, age:18,
    permitType:'Louisiana Concealed Handgun Permit (CHP)', cost:'$125 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','police stations','courthouses','jails','churches without permission','parade routes'],
    notes: 'Louisiana enacted constitutional carry in 2024 for anyone 18+ who can legally own a firearm. The CHP requires a training course and provides broad reciprocity for travel. Louisiana has strong castle doctrine and is a pro-2A state.',
    uscca: 'CHP issued by state police. Louisiana recently lowered permitless carry age to 18. Training required for permit. Louisiana honors all valid permits from most states.',
    vedder: 'Open carry legal without permit. Constitutional carry enacted July 4, 2024. Churches may prohibit carry but must post notice. Carrying while intoxicated prohibited.',
  },
  {
    abbr:'ME', name:'Maine', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$35 (4 yr)', training:false, processingDays:30,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','federal buildings'],
    notes: 'Maine has allowed permitless carry since 2015 for anyone 21+ who can legally possess a firearm. The CHP is still issued for reciprocity purposes and is relatively easy to obtain. Maine has a red flag law enacted in 2023.',
    uscca: 'CHP issued by state police. Maine constitutional carry for anyone 21+. Non-resident permits available for reciprocity. Maine honors permits from most states with similar age requirements.',
    vedder: 'Open carry legal without permit. Maine red flag law passed after 2023 mass shooting. The CHP is worth obtaining for travel to other states. Good rural carry state.',
  },
  {
    abbr:'MD', name:'Maryland', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Wear and Carry Permit (HQL)', cost:'$75 (2 yr)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','government buildings','rest areas','casinos','stadiums','museums','racetracks','video lottery terminals'],
    notes: 'Maryland transitioned to shall-issue after Bruen but remains a very restrictive state. 10-round magazine limit, assault weapons ban, and a sweeping list of prohibited places make Maryland one of the most challenging states for carry. No reciprocity offered or accepted.',
    uscca: 'Maryland State Police issue permits. 16-hour training required. Fingerprints required. MD enacted new sensitive places restrictions post-Bruen that are being litigated. No reciprocity.',
    vedder: '10-round magazine limit enforced. Handgun roster — not all handguns legal for transfer. Assault pistols banned. HQL (Handgun Qualification License) required before purchase.',
  },
  {
    abbr:'MA', name:'Massachusetts', type:'May-Issue', permitless:false, age:21,
    permitType:'License to Carry (LTC)', cost:'$100 (6 yr)', training:true, processingDays:40,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','courts','airports','municipal buildings','stadiums'],
    notes: 'Massachusetts is one of the most restrictive states. The LTC is technically shall-issue but local police chiefs impose restrictions. Massachusetts does not honor any out-of-state permits and no state honors Massachusetts permits. Post-Bruen litigation is ongoing.',
    uscca: 'LTC issued by local police department. FID (Firearms Identification Card) required for rifles and shotguns. Separate LTC required for handguns. Safety course mandatory. Rosters and restrictions apply.',
    vedder: '10-round magazine limit. Assault weapons ban among oldest in country. Firearm rosters. No duty-to-retreat law in your home but duty to retreat in public. Extremely complex compliance requirements.',
  },
  {
    abbr:'MI', name:'Michigan', type:'Shall-Issue', permitless:true, age:21,
    permitType:'Concealed Pistol License (CPL)', cost:'$100 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','banks','churches without permission','courts','hospitals','stadiums','taverns','dorms','entertainment facilities'],
    notes: 'Michigan enacted constitutional carry in 2025. Previously required CPL for concealed carry. CPL still valuable for reciprocity. Michigan has a very detailed list of pistol-free zones. Red flag law enacted in 2023.',
    uscca: 'CPL issued by county clerk. 8-hour training required for permit. Michigan duty-to-inform — must disclose if carrying when contacted by police. Red flag ERPO law effective.',
    vedder: 'Michigan no longer requires a CPL for concealed carry (2025). The old pistol-free zone framework still applies. Churches are technically included unless they post permission. Duty to inform officer of CPL and whether you\'re carrying.',
  },
  {
    abbr:'MN', name:'Minnesota', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Permit to Carry (PTC)', cost:'$100 (5 yr)', training:true, processingDays:30,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courts','jails','mental health facilities','state hospitals'],
    notes: 'Minnesota is shall-issue with no discretion by county sheriff. Permit valid for 5 years. Red flag law enacted in 2023. Minnesota enacted universal background check legislation in 2023. PTC required — no constitutional carry. Minnesota honors permits from many states.',
    uscca: 'PTC issued by county sheriff. Training required. Minnesota law does not allow non-resident permits. Minnesota Permit to Carry honored in many states by reciprocity agreement.',
    vedder: 'Open carry legal with PTC. Universal background checks for all private sales enacted 2023. Red flag ERPO law in effect. Minnesota prohibits carrying in schools and other listed locations.',
  },
  {
    abbr:'MS', name:'Mississippi', type:'Constitutional', permitless:true, age:18,
    permitType:'Enhanced Concealed Carry Permit', cost:'$112 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MN','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MN','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['police stations','courthouses','jails','schools','churches without permission'],
    notes: 'Mississippi has allowed permitless carry since 2011. The Enhanced Permit requires 8-hour training and is honored in additional states. Mississippi has no waiting periods, no registration, and no firearm dealer licensing requirements. Very gun-friendly.',
    uscca: 'Mississippi issues both standard and enhanced permits. Enhanced permit requires training course and provides more reciprocity. Mississippi constitution explicitly protects firearm rights "to the right to own, possess, and use arms."',
    vedder: 'Open carry legal without permit. No duty to inform law enforcement. No red flag law. Mississippi is one of the least regulated firearm states in the country.',
  },
  {
    abbr:'MO', name:'Missouri', type:'Constitutional', permitless:true, age:19,
    permitType:'Concealed Carry Permit (CCP)', cost:'$83 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','police stations','jails','courthouses'],
    notes: 'Missouri enacted permitless carry in 2017 for residents 19+. The CCP requires training and is useful for travel. Kansas City and St. Louis have historically attempted stricter local ordinances but preemption limits municipal authority. Missouri has strong castle doctrine.',
    uscca: 'CCP issued by county sheriff. Missouri constitutional carry allows people 19+ to carry without a permit. The state preemption law is strong. Non-resident permits not available.',
    vedder: 'Missouri has a "Second Amendment Preservation Act" which attempted to void federal gun laws in the state — courts have ruled this is unconstitutional. Strong preemption and no local gun ordinances allowed.',
  },
  {
    abbr:'MT', name:'Montana', type:'Constitutional', permitless:true, age:18,
    permitType:'Concealed Carry Permit', cost:'$60 (4 yr)', training:false, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['government buildings','schools'],
    notes: 'Montana extended permitless carry statewide in 2021 — previously only applied outside city limits. Constitutional carry now covers all of Montana for residents 18+. The state is deeply gun-friendly with minimal restrictions. Permit available for reciprocity.',
    uscca: 'Montana county sheriffs issue permits. Constitutional carry expanded statewide. Montana honors all valid permits from other states. Strong preemption laws prevent local ordinances.',
    vedder: 'Open carry legal without permit. Montana recently expanded constitutional carry into city limits. No waiting periods, no registration, no red flag law. One of the most permissive states for gun ownership.',
  },
  {
    abbr:'NE', name:'Nebraska', type:'Shall-Issue', permitless:true, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$100 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','police stations','courts','hospitals','banks','stadiums','parades'],
    notes: 'Nebraska enacted constitutional carry in 2023. The CHP is still issued for reciprocity purposes and requires a training course. Nebraska is selective in reciprocity — it only honors permits from states it has formal agreements with. Duty to inform law enforcement.',
    uscca: 'CHP issued by state patrol. Nebraska reciprocity is more restricted than most — it only accepts permits from states with "substantially similar" training standards. Duty to inform officer of carry.',
    vedder: 'Open carry legal without permit (requires permit in Omaha). Nebraska\'s new constitutional carry law does not extend to Omaha unless carrying through a vehicle. Complex local ordinance landscape in Omaha.',
  },
  {
    abbr:'NV', name:'Nevada', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Firearms Permit (CFP)', cost:'$97.25 (5 yr)', training:true, processingDays:120,
    honoring:['AL','AK','AZ','AR','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','airports','government buildings','hotels without permission'],
    notes: 'Nevada is shall-issue but does not honor Colorado, Florida, or Washington DC permits. Red flag law in effect. Las Vegas and other areas have complex hotel/casino carry policies. Nevada processes permits slowly but the CFP is well-recognized by about 30 states.',
    uscca: 'CFP issued by county sheriff. 8-hour training required. Nevada does not have constitutional carry. Nevada has universal background checks for private sales enacted 2019.',
    vedder: 'Open carry legal without permit. Nevada red flag law in effect. Casinos can prohibit carry and enforce through trespass law. The Strip has complex carry rules dependent on casino policies.',
  },
  {
    abbr:'NH', name:'New Hampshire', type:'Constitutional', permitless:true, age:18,
    permitType:'Pistol/Revolver License (P&R License)', cost:'$10 (4 yr)', training:false, processingDays:14,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['courts','schools'],
    notes: 'New Hampshire enacted constitutional carry in 2017. The P&R License is only $10 and is valuable for reciprocity. New Hampshire has very few prohibited places and no state-level AWB or magazine limits. The license is issued within 14 days by the chief of police.',
    uscca: 'P&R License issued by local police chief or mayor. New Hampshire honors all valid out-of-state permits. Very gun-friendly state with minimal restrictions. Non-resident permits available.',
    vedder: 'Open carry legal without permit. No duty to inform. No red flag law. No AWB. No magazine limits. New Hampshire is one of the most gun-friendly states on the East Coast.',
  },
  {
    abbr:'NJ', name:'New Jersey', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Permit to Carry a Handgun', cost:'$200 (2 yr)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','government buildings','casinos','hospitals','parks','beaches','museums','sports venues','libraries','courts','law enforcement','ZOOs','shelters','transportation hubs','stadiums','theater venues'],
    notes: 'New Jersey was effectively no-issue before Bruen. Post-Bruen, shall-issue was implemented but immediately followed by the most expansive sensitive places law in the country — covering virtually everywhere a person might go. No reciprocity offered. 10-round magazine limit.',
    uscca: 'Permits issued by local police/NJSP. NJ enacted the Concealed Carry law in direct response to Bruen but simultaneously restricted nearly every public place. Ongoing litigation under Koons v. Platkin.',
    vedder: '10-round magazine limit. Assault weapon ban. Hollow-point bullets technically restricted to home and range only. Purchase requires permit-to-purchase. Extremely complex compliance requirements.',
  },
  {
    abbr:'NM', name:'New Mexico', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Handgun License (CHL)', cost:'$100 (4 yr)', training:true, processingDays:30,
    honoring:['AZ','CO','FL','GA','ID','IN','KS','LA','MI','MS','MO','MT','NC','ND','NE','NV','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    honoredBy:['AZ','CO','FL','GA','ID','IN','KS','LA','MI','MS','MO','MT','NC','ND','NE','NV','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons','law enforcement'],
    notes: 'New Mexico is shall-issue with limited reciprocity. The state enacted a red flag law in 2020. No constitutional carry. New Mexico has limited reciprocity compared to neighboring Arizona. The city of Albuquerque has attempted stricter regulations.',
    uscca: 'CHL issued by DPS. New Mexico red flag ERPO law in effect. Background checks required for private sales. Training required for CHL. New Mexico does not issue non-resident permits.',
    vedder: 'Open carry legal without permit. Red flag ERPO law active. New Mexico has universal background check requirements. Albuquerque has additional storage requirements that have been challenged.',
  },
  {
    abbr:'NY', name:'New York', type:'May-Issue', permitless:false, age:21,
    permitType:'Pistol/Revolver License', cost:'$340 (3 yr)', training:true, processingDays:180,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','government buildings','courts','jails','care facilities','houses of worship','parks','playgrounds','transit','Times Square','shelters','libraries','entertainment venues','bars','restaurants','stadiums','banks','community centers'],
    notes: 'New York City is effectively no-issue for most residents. The CCIA (Concealed Carry Improvement Act), enacted post-Bruen, created the most restrictive carry environment in the country. Upstate New York is somewhat more accessible. 10-round magazine limit. No reciprocity at all.',
    uscca: 'NYC is effectively no-issue. Upstate may be more accessible. CCIA is being litigated — Antonyuk v. Chiumento is the key case. The state imposes "good moral character" as a carry standard.',
    vedder: '10-round magazine limit. AR-15 pattern rifles banned. SAFE Act registration required. NYC adds another layer of restrictions on top of state law. Sullivan Law dates to 1911 — one of the oldest gun permit laws.',
  },
  {
    abbr:'NC', name:'North Carolina', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$80 (5 yr)', training:true, processingDays:90,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courts','law enforcement','prisons','parks and recreation areas','financial institutions','parades','funerals'],
    notes: 'North Carolina is shall-issue with a 90-day processing window. NC also requires a permit-to-purchase handguns (pistol purchase permit) from the sheriff, though this is under legal challenge. No constitutional carry. NC honors many states and is honored by many in return.',
    uscca: 'CHP issued by county sheriff. North Carolina retained its pistol purchase permit requirement (Jim Crow-era law under court challenge). Training required. Duty to inform if stopped.',
    vedder: 'Open carry legal without permit. North Carolina\'s Pistol Purchase Permit (PPP) is required for handguns from private sellers. No red flag law. Duty to inform law enforcement when carrying.',
  },
  {
    abbr:'ND', name:'North Dakota', type:'Constitutional', permitless:true, age:18,
    permitType:'Class 1 or Class 2 Permit', cost:'$25–$75 (3 yr)', training:false, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','gambling facilities','liquor establishments'],
    notes: 'North Dakota has Class 1 (within 3 years residency) and Class 2 (basic) permits with different reciprocity levels. Constitutional carry expanded to non-residents in 2023. Class 1 is the better option for reciprocity travel. ND requires you to disclose carry to law enforcement.',
    uscca: 'ND Bureau of Criminal Investigation issues permits. Two-class permit system. Class 1 has broader reciprocity. ND constitutional carry now includes non-residents. Duty to inform law enforcement.',
    vedder: 'Open carry legal. Class 1 and Class 2 permits serve different reciprocity needs. Constitutional carry applies to most law-abiding adults. ND is rural-friendly for carry.',
  },
  {
    abbr:'OH', name:'Ohio', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Handgun License (CHL)', cost:'$67 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','police stations','airports','churches without permission','state government facilities'],
    notes: 'Ohio enacted constitutional carry in 2022. The CHL requires 8-hour training and is widely recognized for travel. Ohio removed its duty-to-inform law in 2022 alongside constitutional carry. Ohio is now significantly more gun-friendly than just a few years ago.',
    uscca: 'CHL issued by county sheriff. Ohio removed duty-to-inform requirement with constitutional carry (2022). Training no longer required to carry but still needed for CHL. Ohio honors all valid out-of-state permits.',
    vedder: 'Open carry legal without permit. Ohio\'s SB 215 (2022) enacted constitutional carry and removed duty to inform. No AWB, no magazine limits, strong preemption. Ohio honors all valid out-of-state permits.',
  },
  {
    abbr:'OK', name:'Oklahoma', type:'Constitutional', permitless:true, age:21,
    permitType:'Self-Defense Act License (SDA)', cost:'$100 (5 yr)', training:true, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons','government buildings (posted)'],
    notes: 'Oklahoma was the 12th constitutional carry state in 2019. The SDA license requires training and is well-recognized for reciprocity. Oklahoma has strong castle doctrine, stand your ground, and no duty-to-retreat. Preemption prevents local gun laws.',
    uscca: 'SDA license issued by OSBI. Oklahoma has both permitless carry and a voluntary permit for travel. Oklahoma honors all valid out-of-state permits. Strong 2A protections in state constitution.',
    vedder: 'Open carry legal with or without permit. Oklahoma preemption law prevents municipalities from restricting firearms. No AWB, no magazine limits, no red flag law. Very pro-gun legislative environment.',
  },
  {
    abbr:'OR', name:'Oregon', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Handgun License (CHL)', cost:'$65 (4 yr)', training:false, processingDays:45,
    honoring:['AK','AZ','AR','ID','IN','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NC','ND','OH','OK','PA','SD','TN','TX','UT','WV','WY'],
    honoredBy:['AK','AZ','AR','ID','IN','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NC','ND','OH','OK','PA','SD','TN','TX','UT','WV','WY'],
    redFlag:true, magLimit:10, awb:false,
    prohibited:['schools','courts','federal buildings','police stations'],
    notes: 'Oregon enacted Measure 114 in 2022 (10-round magazine limit, permit-to-purchase). Multiple legal challenges are ongoing. No constitutional carry. The CHL is shall-issue but Oregon has moved significantly toward more restrictions since 2020. Red flag law in effect.',
    uscca: 'CHL issued by county sheriff. Oregon Measure 114 enacted magazine limit and permit-to-purchase requirement. Measure 114 has been subject to ongoing court battles. Red flag law active.',
    vedder: 'Oregon\'s Measure 114 enacted a 10-round magazine limit and a new permit-to-purchase system. Both have been suspended and reinstated by courts multiple times. Check current legal status before acquiring magazines.',
  },
  {
    abbr:'PA', name:'Pennsylvania', type:'Shall-Issue', permitless:false, age:21,
    permitType:'License to Carry Firearms (LTCF)', cost:'$20 (5 yr)', training:false, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','prisons','detention facilities'],
    notes: 'Pennsylvania is shall-issue with no training requirement. The LTCF is only $20 and is well-recognized for travel. Philadelphia has historically tried to pass stricter ordinances blocked by preemption. Red flag law enacted 2022. No constitutional carry — legislation has been introduced but not passed.',
    uscca: 'LTCF issued by county sheriff or city police. No training required. Pennsylvania has strong preemption law. Philadelphia attempted municipal gun laws — all struck down. Red flag ERPO law enacted.',
    vedder: 'Open carry legal without permit (except Philadelphia — permit required in city). Pennsylvania\'s $20 LTCF is one of the cheapest permits in the country. No AWB, no magazine limits. Strong rural carry culture.',
  },
  {
    abbr:'RI', name:'Rhode Island', type:'May-Issue', permitless:false, age:21,
    permitType:'Pistol/Revolver License', cost:'$40 (4 yr)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['schools','government buildings','courts'],
    notes: 'Rhode Island is a dual-system state — both the attorney general and local chiefs of police can issue permits. The AG issues shall-issue permits statewide; local chiefs remain discretionary. No reciprocity. 10-round magazine limit. Post-Bruen litigation ongoing.',
    uscca: 'Rhode Island has two paths for permit — local police (may-issue) or AG office (functionally shall-issue). Both paths carry to residents only. No reciprocity offered or accepted.',
    vedder: '10-round magazine limit. Assault weapons ban enacted. Universal background checks. Rhode Island is small but complex — the dual permit system creates inconsistency across jurisdictions.',
  },
  {
    abbr:'SC', name:'South Carolina', type:'Constitutional', permitless:true, age:18,
    permitType:'Concealed Weapons Permit (CWP)', cost:'$50 (5 yr)', training:true, processingDays:90,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','jails','police stations','churches without permission','medical facilities'],
    notes: 'South Carolina enacted constitutional carry in 2024. The CWP requires a training course and is well-recognized for reciprocity. SC is a pro-2A state with castle doctrine and no duty to retreat. Charleston and Columbia remain largely unaffected by state preemption.',
    uscca: 'CWP issued by SLED. South Carolina constitutional carry enacted March 7, 2024. Training still required for permit for reciprocity purposes. Non-resident permits not available.',
    vedder: 'Open carry now legal in SC with or without permit. Constitutional carry signed by Governor McMaster. No AWB, no magazine limits. South Carolina has strong castle doctrine.',
  },
  {
    abbr:'SD', name:'South Dakota', type:'Constitutional', permitless:true, age:18,
    permitType:'South Dakota Permit to Carry', cost:'$10 (5 yr)', training:false, processingDays:30,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses'],
    notes: 'South Dakota enacted constitutional carry in 2019. The permit is only $10 and is widely recognized. South Dakota has minimal restrictions, no red flag law, and strong preemption. Rapid City and Sioux Falls have no local gun ordinances that exceed state law.',
    uscca: 'Permits issued by county sheriff. SD honors all valid permits from other states. Constitutional carry for anyone 18+ who can legally possess. Non-resident Gold Card permits available at $20 for 5 years — extremely good travel value.',
    vedder: 'Open carry legal without permit. SD Gold Card non-resident permit is one of the best travel values at $20 for 5 years and honored in many states. No AWB, no magazine limits, no red flag.',
  },
  {
    abbr:'TN', name:'Tennessee', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Carry Permit (CCP) or Enhanced Permit', cost:'$15–$100 (8 yr)', training:false, processingDays:90,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TX','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','police stations','parks and recreation','places of worship during services'],
    notes: 'Tennessee has two permit tiers — a basic CCP ($15) with limited reciprocity and an Enhanced Permit ($100) recognized by more states. Constitutional carry enacted 2021 for residents 21+. Tennessee does NOT extend permitless carry to non-residents — unique among constitutional carry states.',
    uscca: 'Tennessee permits issued by TCID. Unique two-tier system. The Enhanced Permit has much better reciprocity than basic CCP. Constitutional carry is resident-only — non-residents need a valid permit.',
    vedder: 'Open carry legal with permit. Tennessee permitless carry is residents-only. Non-residents MUST have a valid permit from their home state. Enhanced permits allow carry in a significantly larger number of states.',
  },
  {
    abbr:'TX', name:'Texas', type:'Constitutional', permitless:true, age:21,
    permitType:'License to Carry (LTC)', cost:'$40 (5 yr)', training:true, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','school buses','polling places','courts','racetracks','airports','jails','hospitals','amusement parks','churches without permission (posted 30.06/30.07)','government meetings'],
    notes: 'Texas enacted constitutional carry (HB 1927) in 2021 — one of the biggest 2A wins in recent history. The LTC requires a 4-6 hour course and is recognized by approximately 40 states. Texas 30.06 (concealed) and 30.07 (open) signs legally prohibit carry when posted. Very pro-2A state legislature.',
    uscca: 'LTC issued by DPS. Texas constitutional carry for anyone 21+ who can legally possess a handgun. Non-resident LTC available. 30.06 and 30.07 signs have the force of law — know them before you carry.',
    vedder: 'Open carry legal with or without LTC. Texas LTC is one of the most widely recognized permits. 30.06 sign bans concealed carry; 30.07 bans open carry. Both signs must be posted to prohibit all carry. Texas has strong castle doctrine and Stand Your Ground law.',
  },
  {
    abbr:'UT', name:'Utah', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Firearm Permit (CFP)', cost:'$37.50 (5 yr)', training:true, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','VA','WV','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courts','prisons','houses of worship (with posted notice)','airport security areas'],
    notes: 'Utah enacted constitutional carry in 2021. The Utah CFP is one of the most widely recognized permits in the country — honored in 36+ states — and is available to non-residents nationwide. Utah non-resident permit is a top choice for supplemental carry coverage when traveling.',
    uscca: 'CFP issued by Bureau of Criminal Identification. Utah non-resident permit is available online with little hassle. Training required (Utah-approved course). Non-resident permit widely sought for its broad reciprocity.',
    vedder: 'Open carry legal with unloaded firearm without permit, or loaded with permit. Utah permitless carry for anyone 21+. The Utah non-resident CFP is one of the best travel permits available. Widely honored, affordable, available to all states.',
  },
  {
    abbr:'VT', name:'Vermont', type:'Constitutional', permitless:true, age:16,
    permitType:'No permit issued or required', cost:'N/A', training:false, processingDays:0,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:false,
    prohibited:['schools','statehouse','courthouses'],
    notes: 'Vermont has never required a permit to carry a firearm — it is the original constitutional carry state and the inspiration for the term "Vermont carry." However, Vermont does not issue permits at all, which means Vermont residents have limited reciprocity options when traveling. Residents typically obtain a non-resident Utah or Florida permit for travel.',
    uscca: 'Vermont issues no carry permits. Residents who want to carry in other states must obtain a non-resident permit from another state such as Utah or Florida. Vermont has a 10-round magazine limit and red flag law despite its carry freedom.',
    vedder: 'Vermont has 10-round magazine limits and red flag law despite being the birthplace of constitutional carry. Residents should obtain a Utah or Florida non-resident permit for travel. No Vermont permit exists to show law enforcement out of state.',
  },
  {
    abbr:'VA', name:'Virginia', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Handgun Permit (CHP)', cost:'$50 (5 yr)', training:true, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','community centers during government meetings','places of worship during services','hospitals'],
    notes: 'Virginia is shall-issue with a very streamlined CHP process. Red flag law in effect. Northern Virginia (near DC) has a different culture but state preemption holds. Virginia has relatively broad reciprocity and is honored by most southern and midwestern states.',
    uscca: 'CHP issued by circuit court clerk. Virginia red flag ERPO law in effect. Background check required for all handgun sales. Virginia does not issue non-resident permits.',
    vedder: 'Open carry legal without permit. Virginia ERPO (red flag) law enacted. Universal background checks for handgun sales. CHP process is straightforward — typically within 45 days. Strong reciprocity for a non-constitutional-carry state.',
  },
  {
    abbr:'WA', name:'Washington', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Pistol License (CPL)', cost:'$36 (5 yr)', training:false, processingDays:30,
    honoring:['AL','AK','AZ','AR','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NC','ND','NV','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NC','ND','NV','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'],
    redFlag:true, magLimit:null, awb:false,
    prohibited:['schools','courthouses','jails','mental health facilities','government meeting rooms (with notice)'],
    notes: 'Washington State is shall-issue with no training required and a quick 30-day turnaround. However, the state has enacted universal background checks, a 10-day waiting period, assault weapon restrictions (semi-auto rifle permit bill), and a strong red flag law. Liberal political environment but the CPL itself is simple to obtain.',
    uscca: 'CPL issued by county sheriff. No training required. Washington has enacted multiple gun control measures since 2018. Red flag ERPO law very active. Background checks required for all firearm transfers.',
    vedder: 'Washington enacted SB 5078 (2022) semi-auto rifle purchase restrictions and HB 1240 (2023) assault weapon ban — both under legal challenge. Universal background checks and 10-day waiting period. Red flag law one of the most actively used in the country.',
  },
  {
    abbr:'WV', name:'West Virginia', type:'Constitutional', permitless:true, age:21,
    permitType:'State License to Carry Concealed Deadly Weapons', cost:'$25 (5 yr)', training:false, processingDays:45,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WI','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WI','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','jails','hospitals'],
    notes: 'West Virginia enacted constitutional carry in 2016 for state residents. The permit is inexpensive at $25 and is widely recognized for travel. WV is one of the most gun-friendly states east of the Mississippi. No red flag law, no AWB, and strong castle doctrine.',
    uscca: 'WV state police issue permits. Constitutional carry for residents 21+. WV honors all valid out-of-state permits. Non-resident permits not available. Castle doctrine in effect.',
    vedder: 'Open carry legal without permit. WV has no magazine limits, no AWB, and no red flag law. The $25 permit is excellent value. WV has strong preemption — no local ordinances more restrictive than state law.',
  },
  {
    abbr:'WI', name:'Wisconsin', type:'Shall-Issue', permitless:false, age:21,
    permitType:'Concealed Carry Weapon (CCW) License', cost:'$40 (5 yr)', training:true, processingDays:21,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','prisons','courts','police stations'],
    notes: 'Wisconsin is shall-issue with a 21-day processing window — one of the fastest in the country. Training required but many online courses qualify. Wisconsin has broad reciprocity with most shall-issue and constitutional carry states. No constitutional carry legislation has advanced in WI yet.',
    uscca: 'CCW License issued by DOJ. Wisconsin processes permits in 21 days — very fast for shall-issue. Non-resident permits available. Wisconsin honors permits from most states. Training required.',
    vedder: 'Open carry legal without permit. Wisconsin has no magazine limits and no AWB. The 21-day processing time makes Wisconsin permits attractive. State preemption prevents local gun ordinances.',
  },
  {
    abbr:'WY', name:'Wyoming', type:'Constitutional', permitless:true, age:21,
    permitType:'Concealed Firearm Permit (CFP)', cost:'$50 (5 yr)', training:false, processingDays:60,
    honoring:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI'],
    honoredBy:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI'],
    redFlag:false, magLimit:null, awb:false,
    prohibited:['schools','courthouses','jails'],
    notes: 'Wyoming enacted constitutional carry in 2011, making it among the early adopters. Wyoming has some of the fewest gun restrictions of any state. The CFP is available for reciprocity purposes. Wyoming is extremely rural, open-carry-friendly, and deeply pro-2A.',
    uscca: 'CFP issued by county sheriff. Wyoming constitutional carry for residents 21+. Wyoming honors all valid permits from other states. Non-resident permits not available. Very gun-friendly environment.',
    vedder: 'Open carry legal without permit. Wyoming has no red flag law, no AWB, no magazine limits, and no waiting period. One of the least restrictive states in the country for firearm ownership and carry.',
  },
  {
    abbr:'DC', name:'Washington D.C.', type:'May-Issue', permitless:false, age:21,
    permitType:'Concealed Pistol License (CPL)', cost:'$75 (2 yr)', training:true, processingDays:90,
    honoring:[], honoredBy:[],
    redFlag:true, magLimit:10, awb:true,
    prohibited:['everywhere except private property you own or have permission to be'],
    notes: 'Washington D.C. is functionally may-issue with a restrictive sensitive places list that covers virtually all of the District. No reciprocity whatsoever. 10-round magazine limit. AWB. The Heller decision originated in DC, yet it remains one of the most restrictive jurisdictions in the country.',
    uscca: 'DC CPL issued by Metropolitan Police. No reciprocity — no state or jurisdiction accepts DC permits. DC\'s list of prohibited places essentially bans carry everywhere except on private property. Ongoing constitutional litigation.',
    vedder: 'DC has a 10-round magazine limit, AWB, registration requirement, and no reciprocity. Home of the Heller decision but among the least firearm-friendly places in the US. DC imposes unique laws outside traditional state framework.',
  },
]

const TYPE_COLOR = {
  'Constitutional': '#22c55e',
  'Shall-Issue':    '#C8922A',
  'May-Issue':      '#f59e0b',
  'No-Issue':       '#ef4444',
}
const TYPE_BG = {
  'Constitutional': 'rgba(34,197,94,.08)',
  'Shall-Issue':    'rgba(200,146,42,.08)',
  'May-Issue':      'rgba(245,158,11,.08)',
  'No-Issue':       'rgba(239,68,68,.08)',
}

const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARL  = "'Barlow Condensed',sans-serif"

function StatBadge({ label, value, color='#C8922A', sub }) {
  return (
    <div style={{ textAlign:'center', padding:'12px 18px', background:'rgba(255,255,255,.03)', border:'1px solid var(--border)' }}>
      <div style={{ fontFamily:BEBAS, fontSize:'2.2rem', color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:MONO, fontSize:9, color:'#6b7280', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontFamily:MONO, fontSize:8, color:'#374151', marginTop:1 }}>{sub}</div>}
    </div>
  )
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
      <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', flexShrink:0 }}>{label}</span>
      <span style={{ fontFamily:MONO, fontSize:10, color: valueColor || 'var(--text)', textAlign:'right', lineHeight:1.4 }}>{value}</span>
    </div>
  )
}

export default function CcwPage() {
  const [sel,    setSel]    = useState(null)
  const [tab,    setTab]    = useState('info') // info | reciprocity | tips
  const [search, setSearch] = useState('')

  const state = sel ? STATES.find(s => s.abbr === sel) : null

  const cc   = STATES.filter(s => s.permitless).length
  const shall = STATES.filter(s => !s.permitless && s.type === 'Shall-Issue').length
  const may   = STATES.filter(s => s.type === 'May-Issue').length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return STATES
    return STATES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.abbr.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <>
      <Masthead />
      <style>{`
        .ccw-card { background:var(--bg2); border:1px solid var(--border); transition:border-color .15s, transform .15s; cursor:pointer; }
        .ccw-card:hover { border-color:var(--gold); transform:translateY(-1px); }
        .ccw-card.selected { border-color:var(--gold); border-width:2px; background:rgba(200,146,42,.06); }
        .ccw-tab { background:none; border:none; border-bottom:2px solid transparent; fontFamily:${MONO}; font-size:11px; padding:9px 16px; cursor:pointer; color:var(--text-dim); transition:all .12s; white-space:nowrap; }
        .ccw-tab.active { border-bottom-color:var(--gold); color:var(--gold); }
        .state-btn { background:var(--bg2); border:1px solid var(--border); color:var(--text); font-family:${MONO}; font-size:10px; padding:6px 10px; cursor:pointer; transition:all .1s; text-align:left; }
        .state-btn:hover { border-color:var(--gold); color:var(--gold); }
        .state-btn.active { background:rgba(200,146,42,.12); border-color:var(--gold); color:var(--gold); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'48px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 15% 50%, rgba(200,146,42,.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:-20, top:0, bottom:0, display:'flex', alignItems:'center', opacity:.03, pointerEvents:'none' }}>
          <div style={{ fontFamily:BEBAS, fontSize:'18vw', color:'var(--gold)', lineHeight:1, letterSpacing:'-.02em', whiteSpace:'nowrap' }}>CCW</div>
        </div>
        <div className="container">
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:BARL, fontSize:11, fontWeight:700, letterSpacing:'.12em', padding:'4px 12px' }}>CONCEALED CARRY</span>
            <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', padding:'4px 10px', border:'1px solid var(--border)' }}>Updated May 2026</span>
            <span style={{ fontFamily:MONO, fontSize:10, color:'#22c55e', padding:'4px 10px', border:'1px solid rgba(34,197,94,.3)', background:'rgba(34,197,94,.05)' }}>22M+ Active Permit Holders</span>
          </div>
          <h1 style={{ fontFamily:BEBAS, fontSize:'clamp(2.4rem,5vw,3.6rem)', color:'var(--foreground)', letterSpacing:'.02em', lineHeight:.95, marginBottom:12 }}>
            CCW Reciprocity &amp;<br /><span style={{ color:'var(--gold)' }}>Gun Laws by State</span>
          </h1>
          <p style={{ fontFamily:MONO, fontSize:11, color:'#6b7280', lineHeight:1.7, maxWidth:520, marginBottom:20 }}>
            Select any state below for permit requirements, reciprocity, prohibited places, and the straight-talk analysis you need before you carry across state lines.
          </p>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, maxWidth:620 }}>
            <StatBadge value={cc} label="Constitutional Carry" color="#22c55e" sub="No permit required" />
            <StatBadge value={shall} label="Shall-Issue" color="#C8922A" sub="Must issue if qualified" />
            <StatBadge value={may} label="May-Issue / Restrictive" color="#f59e0b" sub="Discretionary" />
            <StatBadge value="50" label="States Allow CCW" color="#3b82f6" sub="In some form" />
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
      <div style={{ padding:'32px 0 80px' }}>
        <div className="container">

          {/* Quick-tip banner */}
          <div style={{ marginBottom:24, padding:'12px 16px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)', borderLeft:'4px solid var(--gold)', fontFamily:MONO, fontSize:10, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{ color:'var(--gold)' }}>Pro Tip:</strong> The <strong style={{ color:'#fff' }}>Florida</strong>, <strong style={{ color:'#fff' }}>Utah</strong>, and <strong style={{ color:'#fff' }}>Arizona</strong> non-resident permits are the &quot;holy trinity&quot; of travel carry — together they cover nearly all permit-honoring states. Vermont residents must get a non-resident permit elsewhere since VT issues none.
            {' '}<strong style={{ color:'#ef4444' }}>Always verify before you carry — laws change without notice.</strong>
          </div>

          {/* Search + grid */}
          <div style={{ marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200, position:'relative' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search states…"
                style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:MONO, fontSize:11, padding:'9px 12px 9px 36px', outline:'none', boxSizing:'border-box' }}
              />
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#4b5563', fontSize:14 }}>⌕</span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['All','Constitutional','Shall-Issue','May-Issue'].map(f => (
                <button key={f} onClick={() => setSearch(f === 'All' ? '' : f)}
                  style={{ background:'none', border:'1px solid var(--border)', color: search === (f === 'All' ? '' : f) ? 'var(--gold)' : 'var(--text-dim)', fontFamily:MONO, fontSize:9, padding:'5px 10px', cursor:'pointer', letterSpacing:'.06em' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* State cards grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:6, marginBottom:32 }}>
            {filtered.map(s => (
              <button key={s.abbr}
                className={'ccw-card' + (sel === s.abbr ? ' selected' : '')}
                onClick={() => { setSel(s.abbr === sel ? null : s.abbr); setTab('info') }}
                style={{ padding:'10px 8px', textAlign:'center', border:'1px solid var(--border)', background:'var(--bg2)', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontFamily:BEBAS, fontSize:'1.5rem', color: sel === s.abbr ? 'var(--gold)' : 'var(--text)', letterSpacing:'.04em', lineHeight:1 }}>{s.abbr}</div>
                <div style={{ fontFamily:MONO, fontSize:8, color:'#6b7280', marginTop:1, marginBottom:3 }}>{s.name}</div>
                <div style={{ display:'inline-block', fontFamily:MONO, fontSize:7, fontWeight:700, padding:'2px 5px', background: TYPE_BG[s.type], color: TYPE_COLOR[s.type], letterSpacing:'.04em' }}>
                  {s.permitless ? 'CONSTIUTIONAL' : s.type.toUpperCase()}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn:'1/-1', padding:40, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#4b5563' }}>
                No states match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          {/* ── STATE DETAIL PANEL ─────────────────────────────────── */}
          {state && (
            <div style={{ background:'var(--bg2)', border:'2px solid var(--gold)', marginBottom:32, animation:'fadeIn .2s ease' }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

              {/* State header */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', background:'rgba(200,146,42,.04)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:BEBAS, fontSize:'3rem', color:'var(--gold)', letterSpacing:'.04em', lineHeight:1 }}>{state.abbr}</span>
                    <div>
                      <div style={{ fontFamily:BEBAS, fontSize:'1.8rem', color:'var(--text)', letterSpacing:'.02em', lineHeight:1 }}>{state.name}</div>
                      <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:MONO, fontSize:9, fontWeight:700, padding:'2px 8px', background: TYPE_BG[state.type], color: TYPE_COLOR[state.type], letterSpacing:'.06em' }}>
                          {state.type.toUpperCase()}{state.permitless ? ' · PERMITLESS' : ''}
                        </span>
                        {state.permitless && <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 8px', background:'rgba(34,197,94,.08)', color:'#22c55e', border:'1px solid rgba(34,197,94,.2)' }}>NO PERMIT REQUIRED</span>}
                        {state.redFlag && <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 8px', background:'rgba(239,68,68,.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,.2)' }}>RED FLAG LAW</span>}
                        {state.magLimit && <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 8px', background:'rgba(245,158,11,.08)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.2)' }}>{state.magLimit}RD MAG LIMIT</span>}
                        {state.awb && <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 8px', background:'rgba(239,68,68,.06)', color:'#f87171', border:'1px solid rgba(239,68,68,.15)' }}>AWB IN EFFECT</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(0,0,0,.2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:BEBAS, fontSize:'1.8rem', color:'#22c55e', lineHeight:1 }}>{state.honoring.length}</div>
                    <div style={{ fontFamily:MONO, fontSize:8, color:'#4b5563' }}>STATES HONORED</div>
                  </div>
                  <div style={{ textAlign:'center', padding:'10px 16px', background:'rgba(0,0,0,.2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:BEBAS, fontSize:'1.8rem', color:'#C8922A', lineHeight:1 }}>{state.honoredBy.length}</div>
                    <div style={{ fontFamily:MONO, fontSize:8, color:'#4b5563' }}>HONOR {state.abbr}</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom:'1px solid var(--border)', display:'flex', overflowX:'auto' }}>
                {[['info','📋 Permit Info'],['reciprocity','🗺 Reciprocity'],['tips','💡 Carry Tips']].map(([v,l]) => (
                  <button key={v} className={'ccw-tab' + (tab===v?' active':'')} onClick={() => setTab(v)}
                    style={{ fontFamily:MONO, background:'none', border:'none', borderBottom:`2px solid ${tab===v?'var(--gold)':'transparent'}`, color:tab===v?'var(--gold)':'var(--text-dim)', fontSize:11, padding:'9px 16px', cursor:'pointer', whiteSpace:'nowrap' }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding:'20px 24px' }}>

                {/* INFO TAB */}
                {tab === 'info' && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12 }}>Permit Details</div>
                      <InfoRow label="Permit Type"     value={state.permitType} />
                      <InfoRow label="Permit Policy"   value={state.type + (state.permitless?' (Permitless available)':'')} valueColor={TYPE_COLOR[state.type]} />
                      <InfoRow label="Minimum Age"     value={state.age + ' years old'} />
                      <InfoRow label="Cost"            value={state.cost} />
                      <InfoRow label="Training Required" value={state.training ? 'Yes — required for permit' : state.permitless ? 'No (voluntary recommended)' : 'No'} valueColor={state.training?'#f59e0b':'#22c55e'} />
                      <InfoRow label="Processing Time" value={state.processingDays > 0 ? '~'+state.processingDays+' days' : 'N/A — no permit issued'} />
                      <InfoRow label="Magazine Limit"  value={state.magLimit ? state.magLimit+'-round limit' : 'None'} valueColor={state.magLimit?'#ef4444':'#22c55e'} />
                      <InfoRow label="Assault Weapon Ban" value={state.awb ? 'Yes — in effect' : 'No'} valueColor={state.awb?'#ef4444':'#22c55e'} />
                      <InfoRow label="Red Flag (ERPO)" value={state.redFlag ? 'Yes — law in effect' : 'No'} valueColor={state.redFlag?'#f59e0b':'#22c55e'} />
                    </div>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12 }}>Summary</div>
                      <p style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.8, marginBottom:16 }}>{state.notes}</p>

                      {state.prohibited.length > 0 && (
                        <>
                          <div style={{ fontFamily:BARL, fontSize:12, fontWeight:700, color:'#ef4444', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>Prohibited Locations</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                            {state.prohibited.map(p => (
                              <span key={p} style={{ fontFamily:MONO, fontSize:9, padding:'3px 7px', background:'rgba(239,68,68,.08)', color:'#f87171', border:'1px solid rgba(239,68,68,.2)' }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* RECIPROCITY TAB */}
                {tab === 'reciprocity' && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'#22c55e', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
                        {state.abbr} honors permits from ({state.honoring.length} states)
                      </div>
                      {state.honoring.length === 0 ? (
                        <div style={{ fontFamily:MONO, fontSize:11, color:'#4b5563', padding:'12px', background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)' }}>
                          {state.abbr} does not honor any out-of-state permits.
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {state.honoring.map(abbr => {
                            const s = STATES.find(x => x.abbr === abbr)
                            return (
                              <button key={abbr} onClick={() => { setSel(abbr); setTab('info'); window.scrollTo({top:0,behavior:'smooth'}) }}
                                className="state-btn" title={s?.name}
                                style={{ fontFamily:MONO, fontSize:10, padding:'4px 9px', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', color:'#22c55e', cursor:'pointer' }}>
                                {abbr}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'#C8922A', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
                        States that honor {state.abbr} permits ({state.honoredBy.length} states)
                      </div>
                      {state.honoredBy.length === 0 ? (
                        <div style={{ fontFamily:MONO, fontSize:11, color:'#4b5563', padding:'12px', background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)' }}>
                          No states honor {state.abbr} permits for out-of-state carry.
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {state.honoredBy.map(abbr => {
                            const s = STATES.find(x => x.abbr === abbr)
                            return (
                              <button key={abbr} onClick={() => { setSel(abbr); setTab('info'); window.scrollTo({top:0,behavior:'smooth'}) }}
                                className="state-btn" title={s?.name}
                                style={{ fontFamily:MONO, fontSize:10, padding:'4px 9px', background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.2)', color:'#C8922A', cursor:'pointer' }}>
                                {abbr}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(0,0,0,.2)', border:'1px solid var(--border)', fontFamily:MONO, fontSize:10, color:'#6b7280' }}>
                        <strong style={{ color:'#C8922A' }}>Travel strategy:</strong> Click any state above to see its carry laws before you travel there.
                      </div>
                    </div>
                  </div>
                )}

                {/* TIPS TAB */}
                {tab === 'tips' && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12 }}>USCCA Analysis</div>
                      <p style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.8 }}>{state.uscca}</p>
                    </div>
                    <div>
                      <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12 }}>Vedder / Practical Notes</div>
                      <p style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.8 }}>{state.vedder}</p>

                      {state.permitless && (
                        <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', borderLeft:'3px solid #22c55e' }}>
                          <div style={{ fontFamily:BARL, fontSize:12, fontWeight:700, color:'#22c55e', letterSpacing:'.06em', marginBottom:4 }}>CONSTITUTIONAL CARRY STATE</div>
                          <p style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', lineHeight:1.7, margin:0 }}>
                            You don&apos;t need a permit to carry in {state.name}. However, a permit is still valuable — it provides reciprocity when you travel and may simplify interactions with law enforcement.
                          </p>
                        </div>
                      )}

                      {state.honoredBy.length < 10 && !state.permitless && (
                        <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)', borderLeft:'3px solid #f59e0b' }}>
                          <div style={{ fontFamily:BARL, fontSize:12, fontWeight:700, color:'#f59e0b', letterSpacing:'.06em', marginBottom:4 }}>LIMITED RECIPROCITY</div>
                          <p style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', lineHeight:1.7, margin:0 }}>
                            {state.name} permits are honored in only {state.honoredBy.length} states. Consider obtaining a supplemental non-resident permit from Florida, Utah, or Arizona for broader travel coverage.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div style={{ padding:'12px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
                <a href={`/state-hub/${state.abbr.toLowerCase()}`}
                  style={{ fontFamily:BARL, fontSize:12, fontWeight:700, letterSpacing:'.06em', padding:'7px 18px', background:'rgba(200,146,42,.1)', color:'var(--gold)', border:'1px solid rgba(200,146,42,.3)', textDecoration:'none', display:'inline-block' }}>
                  Full {state.abbr} Gun Law Profile ↗
                </a>
                <button onClick={() => setSel(null)}
                  style={{ fontFamily:MONO, fontSize:10, padding:'7px 14px', background:'none', border:'1px solid var(--border)', color:'#6b7280', cursor:'pointer' }}>
                  ✕ Close
                </button>
              </div>
            </div>
          )}

          {/* CTA no state selected */}
          {!state && (
            <div style={{ textAlign:'center', padding:'32px 20px', fontFamily:MONO, fontSize:11, color:'#4b5563', border:'1px dashed var(--border)', marginBottom:24 }}>
              ↑ Select any state above to see its carry laws, permit requirements, and reciprocity details
            </div>
          )}

          {/* Compact reference table */}
          <div>
            <h2 style={{ fontFamily:BEBAS, fontSize:'1.5rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>Quick Reference — All 50 States + DC</h2>
            <p style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginBottom:12 }}>Click any row to open the full state profile.</p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:MONO, fontSize:10 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border)' }}>
                    {['State','Type','Min Age','Cost','Training','Mag Limit','Red Flag','AWB','Honors #','Honored By #'].map(h => (
                      <th key={h} style={{ padding:'7px 8px', textAlign:'left', color:'#C8922A', fontSize:8, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STATES.map((s,i) => (
                    <tr key={s.abbr}
                      onClick={() => { setSel(s.abbr); setTab('info'); setTimeout(()=>document.querySelector('.ccw-card.selected')?.scrollIntoView({behavior:'smooth',block:'center'}),50) }}
                      style={{ borderBottom:'1px solid var(--border)', background: s.abbr === sel ? 'rgba(200,146,42,.06)' : i%2===0?'transparent':'rgba(255,255,255,.012)', cursor:'pointer', transition:'background .1s' }}>
                      <td style={{ padding:'6px 8px', fontWeight:600 }}>
                        <span style={{ color:'#C8922A', marginRight:5 }}>{s.abbr}</span>
                        <span style={{ color:'var(--text)', fontWeight:400 }}>{s.name}</span>
                      </td>
                      <td style={{ padding:'6px 8px', color: TYPE_COLOR[s.type], fontWeight:700 }}>{s.permitless?'Constitutional':s.type}</td>
                      <td style={{ padding:'6px 8px', color:'#6b7280' }}>{s.age}+</td>
                      <td style={{ padding:'6px 8px', color:'#6b7280' }}>{s.cost}</td>
                      <td style={{ padding:'6px 8px', color: s.training?'#f59e0b':'#22c55e' }}>{s.training?'Yes':'No'}</td>
                      <td style={{ padding:'6px 8px', color: s.magLimit?'#ef4444':'#22c55e' }}>{s.magLimit||'None'}</td>
                      <td style={{ padding:'6px 8px', color: s.redFlag?'#f59e0b':'#22c55e' }}>{s.redFlag?'Yes':'No'}</td>
                      <td style={{ padding:'6px 8px', color: s.awb?'#ef4444':'#22c55e' }}>{s.awb?'Yes':'No'}</td>
                      <td style={{ padding:'6px 8px', color:'#22c55e', fontWeight:700 }}>{s.honoring.length||'—'}</td>
                      <td style={{ padding:'6px 8px', color:'#C8922A', fontWeight:700 }}>{s.honoredBy.length||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div style={{ marginTop:28, padding:'14px 18px', background:'rgba(239,68,68,.04)', border:'1px solid rgba(239,68,68,.15)', fontFamily:MONO, fontSize:10, color:'#6b7280', lineHeight:1.8 }}>
            <strong style={{ color:'#ef4444' }}>LEGAL DISCLAIMER:</strong> This information is for educational purposes only and does not constitute legal advice.
            Concealed carry laws change frequently and without notice. Always verify current reciprocity and restrictions with the destination state&apos;s official sources
            and consult a licensed attorney before carrying across state lines. DownRange is not liable for any reliance on this information.
            Last updated May 2026. Sources: USCCA, state attorney general offices, Vedder Holsters, gun law databases.
          </div>

        </div>
      </div>

      <Footer />
    </>
  )
}
