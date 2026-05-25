// ─── lib/utils.js ────────────────────────────────────────────────────────────
// Shared utility functions across DownRange frontend and agent

// ── Date / Time ────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Slug ───────────────────────────────────────────────────────────────────────
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Text ───────────────────────────────────────────────────────────────────────
export function truncate(text, maxLen = 120) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Category labels & colors ──────────────────────────────────────────────────
export const CATEGORY_LABELS = {
  breaking:    { label: 'BREAKING', color: '#B91C1C', bg: '#3B0000' },
  legislation: { label: 'LAW',      color: '#C8922A', bg: '#2A1A00' },
  industry:    { label: 'INDUSTRY', color: '#60A5FA', bg: '#0A1F3A' },
  opinion:     { label: 'OPINION',  color: '#A78BFA', bg: '#1A0A3A' },
  review:      { label: 'REVIEW',   color: '#34D399', bg: '#001F14' },
  release:     { label: 'NEW',      color: '#FB923C', bg: '#2A1000' },
};

export function getCategoryStyle(cat) {
  return CATEGORY_LABELS[cat] || { label: cat?.toUpperCase() || 'NEWS', color: '#94A3B8', bg: '#1A1F26' };
}

// ── Urgency ───────────────────────────────────────────────────────────────────
export function urgencyLabel(score) {
  if (score >= 9) return { label: 'CRITICAL', color: '#FF0000' };
  if (score >= 7) return { label: 'MAJOR',    color: '#B91C1C' };
  if (score >= 5) return { label: 'NOTABLE',  color: '#C8922A' };
  return              { label: 'STANDARD',    color: '#64748B' };
}

// ── Ammo trend ────────────────────────────────────────────────────────────────
export function trendIcon(change) {
  if (change > 2)  return { icon: '↑', color: '#EF4444' };
  if (change < -2) return { icon: '↓', color: '#34D399' };
  return                   { icon: '→', color: '#94A3B8' };
}

// ── State law badges ──────────────────────────────────────────────────────────
export const LAW_BADGES = {
  cc_status:    { true: { label: 'CONST. CARRY', color: '#34D399' }, false: { label: 'PERMIT REQ.', color: '#F59E0B' } },
  red_flag_law: { true: { label: 'RED FLAG', color: '#EF4444' },    false: { label: 'NO RED FLAG', color: '#34D399' } },
  awb_status:   {
    none:    { label: 'NO AWB',      color: '#34D399' },
    partial: { label: 'PARTIAL AWB', color: '#F59E0B' },
    full:    { label: 'FULL AWB',    color: '#EF4444' },
  }
};

// ── Number formatting ─────────────────────────────────────────────────────────
export function formatNumber(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// ── Score rendering ───────────────────────────────────────────────────────────
export function scoreStars(score) {
  const full = Math.floor(score / 2);
  const half = (score % 2) >= 1 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Legislation status ────────────────────────────────────────────────────────
export const BILL_STATUS = {
  INTRODUCED:  { label: 'INTRODUCED',  color: '#60A5FA', bg: '#0A1F3A' },
  ADVANCING:   { label: 'ADVANCING',   color: '#F59E0B', bg: '#2A1A00' },
  PASSED:      { label: 'PASSED',      color: '#34D399', bg: '#001F14' },
  FAILED:      { label: 'FAILED',      color: '#EF4444', bg: '#2A0000' },
  CHALLENGED:  { label: 'CHALLENGED',  color: '#A78BFA', bg: '#1A0A3A' },
  PENDING:     { label: 'PENDING',     color: '#94A3B8', bg: '#1A1F26' },
};

export function getBillStatus(raw) {
  const key = raw?.toUpperCase().replace(/\s+/g, '_');
  return BILL_STATUS[key] || BILL_STATUS.PENDING;
}

// ── OG / SEO meta ─────────────────────────────────────────────────────────────
export function buildMeta({ title, description, image, path = '' }) {
  const base = 'https://downrangeco.com';
  return {
    title: title ? `${title} | DownRange` : 'DownRange — America\'s Firearms Intelligence Hub',
    description: description || 'Live firearms news, laws, reviews, and market data. The most complete 2A resource in America.',
    openGraph: {
      title,
      description,
      url: `${base}${path}`,
      images: image ? [{ url: image }] : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
    alternates: { canonical: `${base}${path}` },
  };
}

// ── Environment check ────────────────────────────────────────────────────────
export const isDev  = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

export function readingTime(text) {
  if (!text) return '1 min read'
  const words = text.trim().split(/\s+/).length
  const mins  = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}
