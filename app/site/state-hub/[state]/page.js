// ─── app/site/state-hub/[state]/page.js ──────────────────────────────────────
import { notFound } from 'next/navigation';
import { getStateProfile } from '@/sanity/lib/client';
import { formatDateShort, getBillStatus } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 3600;

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

const LawBadge = ({ active, trueLabel, falseLabel, trueColor = '#34D399', falseColor = '#EF4444' }) => (
  <span style={{
    display: 'inline-block',
    background: active ? '#001F0F' : '#1F0000',
    color: active ? trueColor : falseColor,
    border: `1px solid ${active ? trueColor : falseColor}40`,
    padding: '0.2rem 0.6rem', fontFamily: 'monospace', fontSize: '0.7rem',
    letterSpacing: '0.08em', borderRadius: '2px'
  }}>
    {active ? trueLabel : falseLabel}
  </span>
);

export default async function StatePage({ params }) {
  const abbr = params.state.toUpperCase();
  const stateName = STATE_NAMES[abbr];
  if (!stateName) notFound();

  const profile = await getStateProfile(abbr);

  // Fallback data if not in Sanity yet
  const data = profile || {
    cc_status: false, ccw_permit: 'Required', red_flag_law: false,
    mag_limit: null, wait_period: null, awb_status: 'none',
    reciprocity: [], recent_bills: [], nics_monthly: null,
    rating: null, notes: null
  };

  return (
    <div style={{ background: '#0A0B0C', minHeight: '100vh', color: '#E8E6E1' }}>

      {/* Header */}
      <div style={{ background: '#111318', borderBottom: '1px solid #1F2428', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>HOME</Link>
            <span style={{ color: '#374151' }}>›</span>
            <Link href="/state-hub" style={{ color: '#64748B', textDecoration: 'none' }}>STATE HUB</Link>
            <span style={{ color: '#374151' }}>›</span>
            <span style={{ color: '#C8922A' }}>{abbr}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{
              width: '70px', height: '70px', background: '#1A1E25',
              border: '2px solid #C8922A40', borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.8rem', color: '#C8922A'
            }}>
              {abbr}
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#F5F5F3',
                letterSpacing: '0.03em', marginBottom: '0.5rem'
              }}>
                {stateName}
              </h1>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <LawBadge active={data.cc_status} trueLabel="CONSTITUTIONAL CARRY" falseLabel="PERMIT REQUIRED" />
                <LawBadge active={!data.red_flag_law} trueLabel="NO RED FLAG" falseLabel="RED FLAG LAW" />
                <LawBadge
                  active={data.awb_status === 'none'}
                  trueLabel="NO AWB"
                  falseLabel={data.awb_status === 'full' ? 'ASSAULT WEAPONS BAN' : 'PARTIAL AWB'}
                  falseColor={data.awb_status === 'full' ? '#EF4444' : '#F59E0B'}
                />
              </div>
            </div>
            {data.rating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '3rem', color: '#C8922A', lineHeight: 1 }}>
                  {data.rating}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#64748B' }}>2A SCORE</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Carry Laws */}
        <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>
            CARRY LAWS
          </div>
          {[
            ['Constitutional Carry', data.cc_status ? 'YES — No permit required' : 'NO — Permit required'],
            ['CCW Permit',           data.ccw_permit || 'N/A'],
            ['Open Carry',           data.open_carry || 'N/A'],
            ['Mag Limit',            data.mag_limit ? `${data.mag_limit} rounds max` : 'No limit'],
            ['Wait Period',          data.wait_period ? `${data.wait_period} days` : 'None'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #1A1E25', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>{label}</span>
              <span style={{ color: '#D1D5DB', fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Restrictions */}
        <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>
            RESTRICTIONS
          </div>
          {[
            ['Assault Weapons Ban',   data.awb_status === 'full' ? 'FULL BAN' : data.awb_status === 'partial' ? 'PARTIAL BAN' : 'None'],
            ['Red Flag / ERPO',       data.red_flag_law ? 'YES — Active law' : 'NO'],
            ['Suppressor Legal',      data.suppressor_legal ? 'YES' : data.suppressor_legal === false ? 'NO' : 'Check state law'],
            ['NFA Items',             data.nfa_legal ? 'Allowed' : data.nfa_legal === false ? 'Restricted' : 'Check ATF'],
            ['Background Check',      data.private_sale_bgc ? 'Required (private sales)' : 'FFL transfers only'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #1A1E25', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>{label}</span>
              <span style={{ color: '#D1D5DB', fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Reciprocity */}
        <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>
            CCW RECIPROCITY — HONORS PERMITS FROM
          </div>
          {data.reciprocity?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {data.reciprocity.map(st => (
                <Link key={st} href={`/state-hub/${st.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    background: '#0A1F3A', color: '#60A5FA', border: '1px solid #60A5FA30',
                    padding: '0.2rem 0.5rem', fontFamily: 'monospace', fontSize: '0.7rem',
                    borderRadius: '2px', cursor: 'pointer'
                  }}>{st}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No reciprocity agreements or data unavailable.</p>
          )}
        </div>

        {/* Recent legislation */}
        <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>
            RECENT LEGISLATION
          </div>
          {data.recent_bills?.length > 0 ? (
            data.recent_bills.slice(0, 5).map((bill, i) => {
              const status = getBillStatus(bill.status);
              return (
                <div key={i} style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #1A1E25' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#D1D5DB', lineHeight: 1.4, flex: 1 }}>{bill.title}</span>
                    <span style={{
                      background: status.bg, color: status.color,
                      padding: '0.15rem 0.4rem', fontFamily: 'monospace', fontSize: '0.6rem',
                      border: `1px solid ${status.color}40`, borderRadius: '2px', whiteSpace: 'nowrap'
                    }}>{status.label}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                    {bill.number} · {formatDateShort(bill.actionDate)}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No recent bills tracked. Data updates daily.</p>
          )}
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ gridColumn: '1 / -1', background: '#0D1117', border: '1px solid #C8922A30', borderRadius: '4px', padding: '1.25rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              EDITOR NOTES
            </div>
            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.7 }}>{data.notes}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ gridColumn: '1 / -1', background: '#111318', border: '1px solid #374151', borderRadius: '4px', padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.6 }}>
            <strong style={{ color: '#94A3B8' }}>DISCLAIMER:</strong> This information is provided for educational purposes only and may not reflect recent law changes.
            Always consult a licensed attorney in your jurisdiction before making any decisions regarding firearms laws.
            DownRange is not responsible for inaccuracies. Laws change — verify current status with official state sources.
          </p>
        </div>
      </div>
    </div>
  );
}
