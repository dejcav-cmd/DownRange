/**
 * DownRange Analytics — GA4 event helpers
 * Import sendGAEvent from @next/third-parties/google
 * Usage: import { trackEvent, trackSearch, trackDeal } from '@/lib/analytics'
 */
'use client'
import { sendGAEvent } from '@next/third-parties/google'

// ── PAGE/CONTENT EVENTS ────────────────────────────────────────────────────

/** Track article reads — fires when a news/blog article is opened */
export function trackArticleView(article) {
  sendGAEvent('event', 'article_view', {
    article_title:    article.title,
    article_category: article.category,
    article_source:   article.source,
    article_slug:     article.slug?.current || article._id,
  })
}

/** Track review reads */
export function trackReviewView(review) {
  sendGAEvent('event', 'review_view', {
    firearm_brand:    review.brand,
    firearm_model:    review.model,
    firearm_category: review.category,
    review_score:     review.score,
  })
}

/** Track which law/legislation items are clicked */
export function trackLawClick(bill) {
  sendGAEvent('event', 'law_click', {
    bill_title:   bill.title,
    bill_number:  bill.billNumber,
    bill_level:   bill.level,
    bill_state:   bill.state || 'federal',
    bill_status:  bill.status,
  })
}

// ── DEALS EVENTS ───────────────────────────────────────────────────────────

/** Track deal clicks — most valuable conversion event */
export function trackDealClick(deal) {
  sendGAEvent('event', 'deal_click', {
    deal_title:    deal.title?.slice(0, 100),
    deal_flair:    deal.flair,
    deal_source:   deal.source,
    deal_domain:   deal.domain,
    deal_price:    deal.price,
    deal_score:    deal.score,
  })
}

// ── SEARCH EVENTS ──────────────────────────────────────────────────────────

/** Track site searches */
export function trackSearch(query, resultCount) {
  sendGAEvent('event', 'search', {
    search_term:   query,
    result_count:  resultCount,
  })
}

// ── ENGAGEMENT EVENTS ──────────────────────────────────────────────────────

/** Track filter/category tab usage */
export function trackFilter(page, filterType, value) {
  sendGAEvent('event', 'filter_use', {
    page_section:  page,
    filter_type:   filterType,
    filter_value:  value,
  })
}

/** Track external link clicks (source sites, retailers, etc.) */
export function trackExternalLink(url, label) {
  sendGAEvent('event', 'external_link_click', {
    link_url:   url,
    link_label: label,
  })
}

/** Track newsletter signups */
export function trackNewsletterSignup(source) {
  sendGAEvent('event', 'newsletter_signup', {
    signup_source: source,
  })
}

/** Track state hub interactions */
export function trackStateView(stateAbbr) {
  sendGAEvent('event', 'state_view', {
    state: stateAbbr,
  })
}

/** Track AI assistant usage (law assistant, etc.) */
export function trackAIQuery(tool, queryLength) {
  sendGAEvent('event', 'ai_query', {
    tool_name:    tool,
    query_length: queryLength,
  })
}
