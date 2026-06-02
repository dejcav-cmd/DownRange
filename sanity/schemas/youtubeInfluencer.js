import { defineType, defineField } from 'sanity'

export const youtubeInfluencer = defineType({
  name: 'youtubeInfluencer',
  title: 'YouTube Influencer',
  type: 'document',
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
    defineField({ name: 'channelName',  title: 'Channel Name',   type: 'string', validation: R => R.required() }),
    defineField({ name: 'hostName',     title: 'Host / Creator Name', type: 'string' }),
    defineField({ name: 'email',        title: 'Contact Email',  type: 'string' }),
    defineField({ name: 'email2',       title: 'Secondary Email', type: 'string' }),

    // ── Channel info ──────────────────────────────────────────────────────────
    defineField({ name: 'youtubeUrl',   title: 'YouTube Channel URL', type: 'url' }),
    defineField({ name: 'channelId',    title: 'YouTube Channel ID (UCxxx)', type: 'string' }),
    defineField({ name: 'subscribers',  title: 'Subscribers (approx)',  type: 'number' }),
    defineField({ name: 'monthlyViews', title: 'Monthly Views (approx)', type: 'number' }),
    defineField({ name: 'videoCount',   title: 'Total Videos', type: 'number' }),
    defineField({ name: 'startedYear',  title: 'Channel Started (year)', type: 'number' }),

    // ── Content focus ─────────────────────────────────────────────────────────
    defineField({
      name: 'focus',
      title: 'Content Focus',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'gun-reviews', 'CCW-EDC', 'AR-15', 'AK-platform', 'pistols',
          'revolvers', 'shotguns', 'suppressors-NFA', 'long-range',
          'competition-USPSA-IDPA', 'hunting', '2A-advocacy', '2A-law',
          'home-defense', 'training-tactics', 'ammo-testing', 'gear-accessories',
          'historical-firearms', 'budget-guns', 'beginners', 'women-shooters',
          'minority-2A', 'military-veteran', 'law-enforcement',
        ],
      },
    }),
    defineField({
      name: 'tier',
      title: 'Size Tier',
      type: 'string',
      options: { list: ['nano (<10K)', 'micro (10K–50K)', 'mid (50K–150K)'] },
    }),
    defineField({ name: 'engagementRate', title: 'Est. Engagement Rate (%)', type: 'number' }),
    defineField({ name: 'avgViews',       title: 'Avg Views per Video', type: 'number' }),
    defineField({ name: 'uploadFreq',     title: 'Upload Frequency', type: 'string',
      options: { list: ['daily','2-3x/week','weekly','bi-weekly','monthly','irregular'] } }),

    // ── Social ────────────────────────────────────────────────────────────────
    defineField({ name: 'instagram',    title: 'Instagram Handle (@)', type: 'string' }),
    defineField({ name: 'twitter',      title: 'Twitter/X Handle (@)', type: 'string' }),
    defineField({ name: 'tiktok',       title: 'TikTok Handle (@)', type: 'string' }),
    defineField({ name: 'website',      title: 'Website / Link in Bio', type: 'url' }),

    // ── Outreach status ───────────────────────────────────────────────────────
    defineField({
      name: 'outreachStatus',
      title: 'Outreach Status',
      type: 'string',
      initialValue: 'identified',
      options: {
        list: [
          { title: '🔵 Identified',      value: 'identified' },
          { title: '📤 Contacted',       value: 'contacted' },
          { title: '💬 Replied',         value: 'replied' },
          { title: '🤝 Partnership Active', value: 'active' },
          { title: '⏸ Paused',          value: 'paused' },
          { title: '❌ Not Interested',  value: 'declined' },
          { title: '🚫 Do Not Contact',  value: 'dnc' },
        ],
      },
    }),
    defineField({ name: 'lastContactedAt', title: 'Last Contacted', type: 'datetime' }),
    defineField({ name: 'nextFollowUpAt',  title: 'Next Follow-Up', type: 'datetime' }),
    defineField({ name: 'partnershipType', title: 'Partnership Type', type: 'string',
      options: { list: ['content-mention','review-collab','affiliate','sponsored','ambassador','press-kit','giveaway'] } }),
    defineField({ name: 'dealValue',       title: 'Deal Value / Notes', type: 'string' }),

    // ── Intel ─────────────────────────────────────────────────────────────────
    defineField({ name: 'bio',          title: 'Channel Bio / About', type: 'text', rows: 3 }),
    defineField({ name: 'whyGoodFit',  title: 'Why Good Fit for DownRange', type: 'text', rows: 2 }),
    defineField({ name: 'notes',        title: 'Internal Notes', type: 'text', rows: 2 }),
    defineField({ name: 'tags',         title: 'Tags', type: 'array', of: [{ type: 'string' }] }),

    // ── Meta ──────────────────────────────────────────────────────────────────
    defineField({ name: 'verified',     title: 'Email Verified', type: 'boolean', initialValue: false }),
    defineField({ name: 'active',       title: 'Active / Enabled', type: 'boolean', initialValue: true }),
    defineField({ name: 'addedAt',      title: 'Added', type: 'datetime' }),
    defineField({ name: 'source',       title: 'Discovery Source', type: 'string',
      options: { list: ['feedspot','manual','referral','reddit','google','social','other'] } }),
  ],
  preview: {
    select: {
      title:    'channelName',
      subtitle: 'subscribers',
      status:   'outreachStatus',
    },
    prepare({ title, subtitle, status }) {
      const icons = { identified:'🔵', contacted:'📤', replied:'💬', active:'🤝', paused:'⏸', declined:'❌', dnc:'🚫' }
      const subs = subtitle ? (subtitle >= 1000 ? (subtitle/1000).toFixed(1) + 'K' : subtitle) : '?'
      return { title, subtitle: `${subs} subs · ${icons[status] || '🔵'} ${status || 'identified'}` }
    },
  },
  orderings: [
    { title: 'Subscribers ↓', name: 'subsDesc', by: [{ field: 'subscribers', direction: 'desc' }] },
    { title: 'Status',        name: 'status',   by: [{ field: 'outreachStatus', direction: 'asc' }] },
    { title: 'Channel Name',  name: 'name',     by: [{ field: 'channelName', direction: 'asc' }] },
  ],
})
