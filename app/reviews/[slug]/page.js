// ─── app/site/reviews/[slug]/page.js ─────────────────────────────────────────
import { notFound } from 'next/navigation';
import { getReviewBySlug } from '@/sanity/lib/client';
import { formatDate, timeAgo, truncate } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const review = await getReviewBySlug(params.slug);
  if (!review) return { title: 'Review Not Found | DownRange' };
  return {
    title: `${review.title} Review | DownRange`,
    description: review.verdict || review.title,
  };
}

const SCORE_COLOR = (s) => {
  if (s >= 9) return '#34D399';
  if (s >= 7) return '#C8922A';
  if (s >= 5) return '#F59E0B';
  return '#EF4444';
};

const SCORE_LABEL = (s) => {
  if (s >= 9.5) return 'OUTSTANDING';
  if (s >= 9)   return 'EXCELLENT';
  if (s >= 8)   return 'GREAT';
  if (s >= 7)   return 'GOOD';
  if (s >= 5)   return 'AVERAGE';
  return 'BELOW AVERAGE';
};

export default async function ReviewPage({ params }) {
  const review = await getReviewBySlug(params.slug);
  if (!review) notFound();

  const scoreColor = SCORE_COLOR(review.score);
  const scoreLabel = SCORE_LABEL(review.score);

  return (
    <div style={{ background: '#0A0B0C', minHeight: '100vh', color: '#E8E6E1' }}>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {review.heroImage && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={review.heroImage} alt={review.title}
                 style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0A0B0C30 0%, #0A0B0C 100%)' }} />
          </div>
        )}
        <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>HOME</Link>
            <span style={{ color: '#374151' }}>›</span>
            <Link href="/reviews" style={{ color: '#64748B', textDecoration: 'none' }}>REVIEWS</Link>
            <span style={{ color: '#374151' }}>›</span>
            <span style={{ color: '#C8922A' }}>{review.category?.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                FIELD TEST REVIEW — {review.category?.toUpperCase()}
              </div>
              <h1 style={{
                fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05,
                color: '#F5F5F3', letterSpacing: '0.02em', marginBottom: '1rem'
              }}>
                {review.title}
              </h1>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {review.author && <span>BY {review.author.toUpperCase()}</span>}
                <span>|</span>
                <span>{formatDate(review.publishedAt)}</span>
                {review.testRounds && <><span>|</span><span>{review.testRounds.toLocaleString()} ROUNDS TESTED</span></>}
              </div>
            </div>

            {/* Score Badge */}
            <div style={{
              textAlign: 'center', background: '#111318', border: `2px solid ${scoreColor}`,
              borderRadius: '4px', padding: '1rem 1.5rem', minWidth: '110px'
            }}>
              <div style={{ fontSize: '3rem', fontFamily: '"Bebas Neue", sans-serif', color: scoreColor, lineHeight: 1 }}>
                {review.score?.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: scoreColor, letterSpacing: '0.12em', marginTop: '0.25rem' }}>
                {scoreLabel}
              </div>
              <div style={{ fontSize: '0.5rem', color: '#64748B', fontFamily: 'monospace', marginTop: '0.25rem' }}>/10</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>

        {/* Left column */}
        <div>
          {/* Verdict */}
          {review.verdict && (
            <div style={{ background: '#0D1117', border: '1px solid #C8922A40', borderRadius: '4px', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                THE VERDICT
              </div>
              <p style={{ fontSize: '1rem', color: '#D1D5DB', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{review.verdict}"
              </p>
            </div>
          )}

          {/* Pros / Cons */}
          {(review.pros?.length > 0 || review.cons?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#001F0F', border: '1px solid #34D39930', borderRadius: '4px', padding: '1rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#34D399', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                  ✓ PROS
                </div>
                {(review.pros || []).map((p, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#D1D5DB', paddingLeft: '0.5rem', borderLeft: '2px solid #34D39960', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ background: '#1F0000', border: '1px solid #EF444430', borderRadius: '4px', padding: '1rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#EF4444', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                  ✗ CONS
                </div>
                {(review.cons || []).map((c, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#D1D5DB', paddingLeft: '0.5rem', borderLeft: '2px solid #EF444460', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#D1D5DB' }}>
            {review.body
              ? <div dangerouslySetInnerHTML={{ __html: review.body }} />
              : <p style={{ color: '#64748B' }}>Full review content coming soon.</p>
            }
          </div>
        </div>

        {/* Right sidebar */}
        <aside>
          {/* Specs */}
          {review.specs && Object.keys(review.specs).length > 0 && (
            <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '0.75rem', fontWeight: 700 }}>
                SPECS
              </div>
              {Object.entries(review.specs).map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '0.35rem 0', borderBottom: '1px solid #1A1E25', fontSize: '0.8rem'
                }}>
                  <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.7rem', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ color: '#D1D5DB', fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Category scores */}
          {review.categoryScores && (
            <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '0.75rem', fontWeight: 700 }}>
                CATEGORY SCORES
              </div>
              {Object.entries(review.categoryScores).map(([cat, score]) => (
                <div key={cat} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'capitalize' }}>{cat}</span>
                    <span style={{ fontSize: '0.75rem', color: SCORE_COLOR(score), fontFamily: 'monospace', fontWeight: 700 }}>{score}/10</span>
                  </div>
                  <div style={{ height: '4px', background: '#1F2428', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score * 10}%`, background: SCORE_COLOR(score), borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/reviews" style={{
            display: 'block', textAlign: 'center', padding: '0.6rem',
            background: '#111318', border: '1px solid #1F2428', color: '#C8922A',
            textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.7rem',
            letterSpacing: '0.1em', borderRadius: '2px'
          }}>
            ALL REVIEWS →
          </Link>
        </aside>
      </div>
    </div>
  );
}
