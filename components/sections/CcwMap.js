'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Comprehensive CCW reciprocity data ──────────────────────────────────────
// For each state: which states honor its permit (honored), and which permits it honors (honors)
// Source: compiled from USCCA, Handgunlaw.us, state AG offices (current as of 2026)
const CCW_DATA = {
  AL:{ name:'Alabama', cc:true,  permit:true,  honored:['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], honors:['AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], permitType:'Shall-Issue', minAge:19, notes:'Permitless carry legal for all lawful gun owners 19+. Permit still available for reciprocity purposes.' },
  AK:{ name:'Alaska',  cc:true,  permit:true,  honored:['AL','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['AL','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry for residents 21+. Non-residents must have home-state permit.' },
  AZ:{ name:'Arizona', cc:true,  permit:true,  honored:['AL','AK','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry for all lawful gun owners 21+. Honors all valid out-of-state permits.' },
  AR:{ name:'Arkansas',cc:true,  permit:true,  honored:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['AL','AK','AZ','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Enhanced CHCL honored in more states than standard license. Both available.' },
  CA:{ name:'California',cc:false,permit:true, honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not honor any out-of-state permits. May-issue permit extremely difficult to obtain in most counties. Strict use of force laws.' },
  CO:{ name:'Colorado', cc:false, permit:true, honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Denver has additional local restrictions. Red Flag law in effect.' },
  CT:{ name:'Connecticut',cc:false,permit:true,honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not honor out-of-state permits. Assault weapon restrictions in place.' },
  DE:{ name:'Delaware', cc:false, permit:true, honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not recognize out-of-state permits. Permit process requires good cause.' },
  FL:{ name:'Florida',  cc:false, permit:true, honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Florida CWL is widely recognized. Does not honor MN or WA permits.' },
  GA:{ name:'Georgia',  cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry as of 2022. Honors all valid out-of-state permits.' },
  HI:{ name:'Hawaii',   cc:false, permit:true, honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Effectively no-issue for concealed carry. Does not honor any out-of-state permits.' },
  ID:{ name:'Idaho',    cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','OR','PA','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Enhanced permit (age 21+) honored in more states than basic permit. Permitless carry 18+.' },
  IL:{ name:'Illinois', cc:false, permit:true, honored:[], honors:[], permitType:'Shall-Issue', minAge:21, notes:'Does not honor any out-of-state permits. FOID card required to possess firearms.' },
  IN:{ name:'Indiana',  cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Permitless carry since 2022. LTCH still available for reciprocity.' },
  IA:{ name:'Iowa',     cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2021. Honors all valid out-of-state permits.' },
  KS:{ name:'Kansas',   cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2015.' },
  KY:{ name:'Kentucky', cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2019.' },
  LA:{ name:'Louisiana',cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2024.' },
  ME:{ name:'Maine',    cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2015. Honors all valid out-of-state permits.' },
  MD:{ name:'Maryland', cc:false, permit:true, honored:[], honors:[], permitType:'Shall-Issue', minAge:21, notes:'Does not honor any out-of-state permits. Assault weapon restrictions. Red flag law.' },
  MA:{ name:'Massachusetts',cc:false,permit:true,honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not honor any out-of-state permits. AWB in effect. Very restrictive.' },
  MI:{ name:'Michigan', cc:false, permit:true, honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Expanded reciprocity in recent years. Pistol purchase permits still required for handguns.' },
  MN:{ name:'Minnesota',cc:false, permit:true, honored:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','MI','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Minnesota does not honor FL or WA. Red flag law in effect.' },
  MS:{ name:'Mississippi',cc:true,permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2016. Enhanced permit provides broader reciprocity.' },
  MO:{ name:'Missouri', cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:19, notes:'Permitless carry since 2017.' },
  MT:{ name:'Montana',  cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Permitless carry since 2021. Permit still valuable for reciprocity.' },
  NE:{ name:'Nebraska', cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2023.' },
  NV:{ name:'Nevada',   cc:false, permit:true, honored:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Nevada does not honor CO or PA permits. No reciprocity with CA.' },
  NH:{ name:'New Hampshire',cc:true,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Permitless carry since 2017. One of the most gun-friendly states in New England.' },
  NJ:{ name:'New Jersey',cc:false,permit:true, honored:[], honors:[], permitType:'Shall-Issue', minAge:21, notes:'Does not honor any out-of-state permits. Very restrictive; AWB and mag limits in effect.' },
  NM:{ name:'New Mexico',cc:false,permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'No permitless carry. Broad reciprocity agreements.' },
  NY:{ name:'New York', cc:false, permit:true, honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not honor any out-of-state permits. NYC requires separate permit. CCIA restrictions.' },
  NC:{ name:'North Carolina',cc:false,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Pistol purchase permit still required. Broad reciprocity.' },
  ND:{ name:'North Dakota',cc:true,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Permitless carry since 2017. Class 1 permit honored in more states.' },
  OH:{ name:'Ohio',     cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OK','PA','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2022.' },
  OK:{ name:'Oklahoma', cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2019.' },
  OR:{ name:'Oregon',   cc:false, permit:true, honored:[], honors:[], permitType:'Shall-Issue', minAge:21, notes:'Does not honor any out-of-state permits. Measure 114 challenged in courts. Background checks for all transfers.' },
  PA:{ name:'Pennsylvania',cc:false,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','SC','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Philadelphia has additional local restrictions. PA does not honor NM.' },
  RI:{ name:'Rhode Island',cc:false,permit:true,honored:[], honors:[], permitType:'May-Issue', minAge:21, notes:'Does not honor out-of-state permits. Attorney General issues permits on a may-issue basis.' },
  SC:{ name:'South Carolina',cc:false,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SD','TN','TX','UT','VA','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'Permitless carry passed 2023. CWP still widely honored.' },
  SD:{ name:'South Dakota',cc:true,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','TN','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:18, notes:'Permitless carry since 2019. Enhanced permit honored in more states.' },
  TN:{ name:'Tennessee', cc:true, permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TX','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2021.' },
  TX:{ name:'Texas',    cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2021. LTC still valuable for reciprocity in 40+ states.' },
  UT:{ name:'Utah',     cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','VT','VA','WV','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Utah CFP is one of the most widely-recognized permits in the country — accepted in 40+ states.' },
  VT:{ name:'Vermont',  cc:true,  permit:false,honored:[], honors:[], permitType:'Constitutional (no permit issued)', minAge:16, notes:'Vermont does not issue carry permits. Residents must use home-state permit or be unable to carry in most states that require reciprocity.' },
  VA:{ name:'Virginia', cc:false, permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','WV','WI','WY'], permitType:'Shall-Issue', minAge:21, notes:'CHP honored in most of the South and Midwest. Red flag law in effect.' },
  WA:{ name:'Washington',cc:false,permit:true, honored:[], honors:[], permitType:'Shall-Issue', minAge:21, notes:'Does not honor any out-of-state permits. I-1639 restrictions on semi-autos. Red flag law.' },
  WV:{ name:'West Virginia',cc:true,permit:true,honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WI','WY'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2016.' },
  WI:{ name:'Wisconsin', cc:false,permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'], honors:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VA','WV','WY'], permitType:'Shall-Issue', minAge:21, notes:'No permitless carry. CCW permit broadly honored across the Midwest and South.' },
  WY:{ name:'Wyoming',  cc:true,  permit:true, honored:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','MI','MN','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI'], honors:['ALL'], permitType:'Shall-Issue (optional)', minAge:21, notes:'Permitless carry since 2011.' },
}

const STATE_PATHS = {
  ME:"M830,65 L840,60 L855,62 L858,75 L845,85 L832,80 Z",
  NH:"M820,68 L830,65 L832,80 L825,95 L815,90 L810,78 Z",
  VT:"M808,65 L820,68 L815,90 L805,85 L800,70 Z",
  MA:"M820,95 L845,90 L852,100 L835,108 L815,105 Z",
  RI:"M845,98 L852,96 L855,108 L848,110 Z",
  CT:"M808,100 L820,95 L818,110 L806,112 Z",
  NY:"M740,70 L808,65 L808,100 L806,112 L788,120 L760,115 L742,100 L735,82 Z",
  NJ:"M788,120 L806,112 L810,130 L800,145 L785,138 Z",
  PA:"M700,105 L788,100 L788,120 L760,128 L700,125 Z",
  DE:"M800,138 L810,130 L815,145 L805,150 Z",
  MD:"M745,135 L800,130 L805,150 L785,155 L748,150 Z",
  VA:"M690,145 L785,140 L790,158 L770,170 L720,168 L688,162 Z",
  WV:"M690,125 L745,120 L748,150 L720,165 L688,158 L682,138 Z",
  NC:"M668,172 L778,165 L782,182 L720,190 L668,185 Z",
  SC:"M720,182 L782,178 L785,198 L748,208 L715,200 Z",
  GA:"M668,185 L748,180 L750,210 L720,225 L668,220 Z",
  FL:"M640,220 L720,218 L725,240 L738,268 L715,285 L688,278 L658,260 L638,238 Z",
  AL:"M635,185 L668,185 L668,222 L638,225 L630,205 Z",
  MS:"M600,182 L638,180 L638,225 L608,225 L595,205 Z",
  TN:"M582,162 L690,158 L690,178 L582,182 Z",
  KY:"M580,140 L692,135 L692,160 L582,162 Z",
  OH:"M695,105 L760,100 L758,138 L695,140 Z",
  IN:"M650,105 L697,105 L695,148 L650,148 Z",
  MI:"M640,62 L700,58 L705,88 L685,95 L660,95 L638,82 Z",
  WI:"M598,60 L648,55 L650,100 L598,105 Z",
  IL:"M600,105 L650,105 L650,162 L598,162 Z",
  MN:"M540,38 L600,35 L600,100 L540,100 Z",
  IA:"M540,100 L600,100 L600,140 L538,140 Z",
  MO:"M540,140 L600,138 L600,175 L538,178 Z",
  AR:"M538,178 L600,175 L602,210 L538,212 Z",
  LA:"M538,212 L602,210 L605,238 L565,248 L535,238 Z",
  ND:"M428,30 L542,28 L542,78 L428,80 Z",
  SD:"M428,80 L542,78 L540,125 L428,128 Z",
  NE:"M428,128 L540,125 L540,162 L428,165 Z",
  KS:"M428,165 L540,162 L538,200 L428,202 Z",
  OK:"M390,200 L538,198 L540,235 L448,238 L390,235 Z",
  TX:"M390,235 L452,235 L460,280 L448,320 L408,345 L370,322 L342,292 L348,255 Z",
  MT:"M285,20 L430,15 L432,95 L285,98 Z",
  WY:"M285,98 L432,92 L432,148 L285,148 Z",
  CO:"M285,148 L432,145 L430,198 L285,198 Z",
  NM:"M285,198 L432,198 L432,250 L285,252 Z",
  ID:"M205,25 L285,20 L288,115 L248,120 L210,100 Z",
  UT:"M205,115 L285,110 L285,175 L205,178 Z",
  AZ:"M205,178 L285,175 L285,258 L230,265 L200,248 L198,212 Z",
  NV:"M155,98 L208,88 L212,175 L155,178 L142,145 L148,110 Z",
  OR:"M105,48 L205,38 L210,100 L150,105 L105,85 Z",
  WA:"M108,15 L205,10 L208,40 L108,48 Z",
  CA:"M102,85 L155,98 L158,178 L140,215 L105,232 L88,195 L85,148 Z",
  AK:"M62,340 L125,308 L160,325 L155,360 L118,375 L72,368 Z",
  HI:"M200,355 L220,348 L225,362 L210,368 Z",
}

// Centroid positions for state abbreviation labels
const STATE_LABELS = {
  ME:[843,72],NH:[821,78],VT:[810,77],MA:[833,100],RI:[849,104],CT:[812,106],
  NY:[770,92],NJ:[795,132],PA:[740,115],DE:[807,142],MD:[770,145],
  VA:[738,155],WV:[712,143],NC:[720,180],SC:[748,192],GA:[707,202],
  FL:[678,252],AL:[648,205],MS:[615,205],TN:[635,170],KY:[635,150],
  OH:[725,120],IN:[672,126],MI:[672,76],WI:[622,80],IL:[623,133],
  MN:[568,68],IA:[568,120],MO:[568,158],AR:[568,193],LA:[568,228],
  ND:[484,54],SD:[484,103],NE:[484,143],KS:[484,183],OK:[464,218],
  TX:[415,288],MT:[358,58],WY:[358,120],CO:[358,173],NM:[358,225],
  ID:[248,72],UT:[244,145],AZ:[244,218],NV:[178,138],OR:[155,72],
  WA:[155,30],CA:[118,170],AK:[110,338],HI:[212,358],
}

function getStateColor(abbr, selected, mode) {
  const data = CCW_DATA[abbr]
  if (!data) return '#1f2937'
  
  if (selected) {
    const selData = CCW_DATA[selected]
    if (!selData) return '#1f2937'
    
    if (abbr === selected) return '#C8922A'  // selected state = gold
    
    if (mode === 'honored') {
      // Which states honor the selected permit
      if (selData.honored.includes(abbr)) return '#22c55e'
      return '#374151'
    } else {
      // Which permits does selected state honor
      if (selData.honors[0] === 'ALL' || selData.honors.includes(abbr)) return '#22c55e'
      return '#374151'
    }
  }
  
  // Default: shade by constitutional carry
  if (data.cc) return '#1d4ed8'
  if (!data.permit) return '#7c3aed'
  return '#374151'
}

export default function CcwMap({ profiles = [] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered]   = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x:0, y:0 })
  const [mode, setMode] = useState('honored') // honored | honors

  const selData = selected ? CCW_DATA[selected] : null
  const honCount = selected
    ? (selData?.honored?.length || 0)
    : null
  const honorsCount = selected
    ? (selData?.honors?.[0] === 'ALL' ? 50 : selData?.honors?.length || 0)
    : null

  const handleClick = useCallback((abbr) => {
    if (selected === abbr) { setSelected(null); return }
    setSelected(abbr)
  }, [selected])

  const handleMouseMove = useCallback((e, abbr) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect()
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHovered(abbr)
  }, [])

  const M = { fontFamily:"'IBM Plex Mono',monospace" }
  const B = { fontFamily:"'Barlow Condensed',sans-serif" }
  const bN = { fontFamily:"'Bebas Neue',cursive" }

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ ...M, fontSize:10, color:'#4b5563' }}>MAP MODE:</span>
        {[
          ['honored','🟢 Where YOUR permit works'],
          ['honors', '🔵 What permits THIS state accepts'],
        ].map(([val, label]) => (
          <button key={val} onClick={()=>setMode(val)}
            style={{ ...M, fontSize:10, padding:'5px 12px', border:'1px solid var(--border)',
              background: mode===val ? 'var(--gold)' : 'transparent',
              color: mode===val ? '#000' : '#9ca3af', cursor:'pointer', fontWeight: mode===val ? 700 : 400 }}>
            {label}
          </button>
        ))}
        {selected && (
          <button onClick={()=>setSelected(null)}
            style={{ ...M, fontSize:10, padding:'5px 12px', border:'1px solid #ef4444', background:'transparent', color:'#ef4444', cursor:'pointer', marginLeft:'auto' }}>
            ✕ Clear selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        {!selected ? (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, background:'#1d4ed8', borderRadius:2 }} />
              <span style={{ ...M, fontSize:10, color:'#9ca3af' }}>Const. Carry</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, background:'#374151', borderRadius:2 }} />
              <span style={{ ...M, fontSize:10, color:'#9ca3af' }}>Permit Required</span>
            </div>
            <span style={{ ...M, fontSize:10, color:'#6b7280' }}>Click a state to see reciprocity</span>
          </>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, background:'#C8922A', borderRadius:2 }} />
              <span style={{ ...M, fontSize:10, color:'#9ca3af' }}>Selected: {selData?.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, background:'#22c55e', borderRadius:2 }} />
              <span style={{ ...M, fontSize:10, color:'#9ca3af' }}>
                {mode === 'honored' ? `Honors ${selData?.name} permit (${honCount})` : `Accepted by ${selData?.name} (${honorsCount})`}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, background:'#374151', borderRadius:2 }} />
              <span style={{ ...M, fontSize:10, color:'#9ca3af' }}>Does not honor</span>
            </div>
          </>
        )}
      </div>

      {/* SVG Map */}
      <div style={{ position:'relative', background:'var(--bg)', border:'1px solid var(--border)' }}>
        <svg viewBox="0 0 900 400" style={{ width:'100%', display:'block', cursor:'pointer' }}
          onMouseLeave={() => setHovered(null)}>
          {Object.entries(STATE_PATHS).map(([abbr, path]) => (
            <g key={abbr}>
              <path
                d={path}
                fill={getStateColor(abbr, selected, mode)}
                stroke="#09090B"
                strokeWidth={hovered === abbr ? 2 : 0.8}
                opacity={hovered === abbr ? 1 : 0.92}
                style={{ transition:'fill 0.15s, opacity 0.1s' }}
                onClick={() => handleClick(abbr)}
                onMouseMove={(e) => handleMouseMove(e, abbr)}
                onMouseEnter={() => setHovered(abbr)}
              />
              {STATE_LABELS[abbr] && (
                <text
                  x={STATE_LABELS[abbr][0]}
                  y={STATE_LABELS[abbr][1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize: ['RI','DE','CT','NH','VT','NJ','MA'].includes(abbr) ? 5.5 : 7, fontWeight:700, fill:'#fff', pointerEvents:'none', userSelect:'none' }}
                >
                  {abbr}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Hover tooltip */}
        {hovered && CCW_DATA[hovered] && (
          <div style={{
            position:'absolute', zIndex:20, pointerEvents:'none',
            left: Math.min(tooltipPos.x + 14, 680), top: Math.max(tooltipPos.y - 80, 4),
            background:'#111318', border:`1px solid ${selected && (CCW_DATA[selected]?.honored?.includes(hovered) || CCW_DATA[selected]?.honors?.[0]==='ALL') ? '#22c55e' : '#374151'}`,
            padding:'10px 14px', minWidth:200, boxShadow:'0 4px 24px rgba(0,0,0,.7)',
          }}>
            <div style={{ ...bN, fontSize:'1.15rem', color:'#C8922A', letterSpacing:'.04em', marginBottom:4 }}>
              {CCW_DATA[hovered].name}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
              <span style={{ ...M, fontSize:9, padding:'2px 6px', background: CCW_DATA[hovered].cc ? 'rgba(34,197,94,.15)' : 'rgba(100,116,139,.15)', color: CCW_DATA[hovered].cc ? '#22c55e' : '#9ca3af' }}>
                {CCW_DATA[hovered].cc ? 'CONST. CARRY' : 'PERMIT REQ.'}
              </span>
              <span style={{ ...M, fontSize:9, padding:'2px 6px', background:'rgba(200,146,42,.1)', color:'#C8922A' }}>
                {CCW_DATA[hovered].permitType}
              </span>
            </div>
            {selected && (
              <div style={{ ...M, fontSize:10, color: CCW_DATA[selected]?.honored?.includes(hovered) ? '#22c55e' : '#ef4444', marginTop:2 }}>
                {mode==='honored'
                  ? (CCW_DATA[selected]?.honored?.includes(hovered) ? `✓ Honors ${CCW_DATA[selected]?.name} permit` : `✗ Does NOT honor ${CCW_DATA[selected]?.name} permit`)
                  : (CCW_DATA[selected]?.honors?.[0]==='ALL' || CCW_DATA[selected]?.honors?.includes(hovered) ? `✓ ${CCW_DATA[selected]?.name} honors this permit` : `✗ ${CCW_DATA[selected]?.name} does NOT honor this permit`)
                }
              </div>
            )}
            <div style={{ ...M, fontSize:9, color:'#6b7280', marginTop:4 }}>Min age: {CCW_DATA[hovered].minAge} · Click for details</div>
          </div>
        )}
      </div>

      {/* Selected state detail panel */}
      {selected && selData && (
        <div style={{ marginTop:20, padding:20, background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap', marginBottom:16 }}>
            <div>
              <div style={{ ...bN, fontSize:'2rem', color:'var(--text)', letterSpacing:'.04em', lineHeight:1 }}>{selData.name}</div>
              <div style={{ ...M, fontSize:10, color:'#C8922A', marginTop:4 }}>{selData.permitType} · Min age: {selData.minAge}</div>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div style={{ textAlign:'center', padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)' }}>
                <div style={{ ...bN, fontSize:'2rem', color:'#22c55e', lineHeight:1 }}>{honCount}</div>
                <div style={{ ...M, fontSize:9, color:'#6b7280', marginTop:2 }}>STATES HONOR PERMIT</div>
              </div>
              <div style={{ textAlign:'center', padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)' }}>
                <div style={{ ...bN, fontSize:'2rem', color:'#3b82f6', lineHeight:1 }}>{honorsCount === 50 ? 'All' : honorsCount}</div>
                <div style={{ ...M, fontSize:9, color:'#6b7280', marginTop:2 }}>PERMITS HONORED HERE</div>
              </div>
              <div style={{ textAlign:'center', padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)' }}>
                <div style={{ ...bN, fontSize:'2rem', color: selData.cc ? '#22c55e' : '#9ca3af', lineHeight:1 }}>{selData.cc ? 'YES' : 'NO'}</div>
                <div style={{ ...M, fontSize:9, color:'#6b7280', marginTop:2 }}>CONST. CARRY</div>
              </div>
            </div>
          </div>

          <div style={{ ...M, fontSize:11, color:'#9ca3af', lineHeight:1.7, marginBottom:16, padding:'10px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderLeft:'2px solid #C8922A' }}>
            {selData.notes}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* States that honor this permit */}
            <div>
              <div style={{ ...M, fontSize:10, color:'#22c55e', fontWeight:700, marginBottom:8, letterSpacing:'.06em' }}>
                ✓ HONORED IN ({honCount} states)
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {selData.honored.map(abbr => (
                  <button key={abbr} onClick={()=>setSelected(abbr)}
                    style={{ ...M, fontSize:10, padding:'3px 8px', background:'rgba(34,197,94,.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,.3)', cursor:'pointer' }}>
                    {abbr}
                  </button>
                ))}
                {honCount === 0 && <span style={{ ...M, fontSize:10, color:'#6b7280' }}>No reciprocity</span>}
              </div>
            </div>

            {/* States whose permits this state honors */}
            <div>
              <div style={{ ...M, fontSize:10, color:'#3b82f6', fontWeight:700, marginBottom:8, letterSpacing:'.06em' }}>
                ✓ HONORS ({honorsCount === 50 ? 'All states' : honorsCount + ' states'})
              </div>
              {selData.honors[0] === 'ALL' ? (
                <div style={{ ...M, fontSize:10, color:'#3b82f6', padding:'6px 10px', background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)' }}>
                  Honors all valid out-of-state permits
                </div>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {selData.honors.map(abbr => (
                    <button key={abbr} onClick={()=>setSelected(abbr)}
                      style={{ ...M, fontSize:10, padding:'3px 8px', background:'rgba(59,130,246,.1)', color:'#3b82f6', border:'1px solid rgba(59,130,246,.3)', cursor:'pointer' }}>
                      {abbr}
                    </button>
                  ))}
                  {selData.honors.length === 0 && <span style={{ ...M, fontSize:10, color:'#6b7280' }}>Honors no out-of-state permits</span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <a href={`/state-hub/${selected.toLowerCase()}`}
              style={{ ...M, fontSize:11, padding:'8px 16px', border:'1px solid #C8922A', color:'#C8922A', textDecoration:'none' }}>
              Full {selData.name} Gun Laws →
            </a>
            <button onClick={()=>setSelected(null)}
              style={{ ...M, fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', background:'transparent', color:'#6b7280', cursor:'pointer' }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
