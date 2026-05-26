import { defineType, defineField } from 'sanity'

export const dailyBriefing = defineType({
  name: 'dailyBriefing',
  title: 'Daily Intelligence Briefing',
  type: 'document',
  fields: [
    defineField({ name: 'date',      title: 'Date',   type: 'date',     validation: R => R.required() }),
    defineField({ name: 'runAt',     title: 'Run At', type: 'datetime' }),
    defineField({ name: 'status',    title: 'Status', type: 'string',
      options: { list: ['running','complete','failed'] }, initialValue: 'running' }),
    defineField({ name: 'score',     title: 'Site Health Score (0–100)', type: 'number' }),
    defineField({ name: 'headline',  title: 'Executive Headline', type: 'string' }),
    defineField({ name: 'summary',   title: 'Executive Summary', type: 'text', rows: 4 }),

    // Competitor intelligence
    defineField({ name: 'competitorFindings', title: 'Competitor Findings', type: 'array', of: [{
      type: 'object', fields: [
        { name: 'source',   type: 'string', title: 'Source / Competitor' },
        { name: 'finding',  type: 'text',   title: 'What They Have / Are Doing' },
        { name: 'gap',      type: 'text',   title: 'Our Gap or Opportunity' },
        { name: 'priority', type: 'string', title: 'Priority', options: { list: ['high','medium','low'] } },
      ]
    }]}),

    // Recommendations
    defineField({ name: 'recommendations', title: 'Recommendations', type: 'array', of: [{
      type: 'object', fields: [
        { name: 'category', type: 'string', title: 'Category',
          options: { list: ['content','features','seo','ux','bugs','data','outreach','monetization'] } },
        { name: 'title',    type: 'string', title: 'Recommendation' },
        { name: 'why',      type: 'text',   title: 'Why This Matters' },
        { name: 'howTo',    type: 'text',   title: 'How to Implement' },
        { name: 'effort',   type: 'string', title: 'Effort', options: { list: ['quick-win','medium','large'] } },
        { name: 'impact',   type: 'string', title: 'Impact', options: { list: ['high','medium','low'] } },
        { name: 'done',     type: 'boolean', title: 'Completed', initialValue: false },
      ]
    }]}),

    // Bugs / broken things
    defineField({ name: 'issues', title: 'Issues Found', type: 'array', of: [{
      type: 'object', fields: [
        { name: 'severity', type: 'string', title: 'Severity', options: { list: ['critical','high','medium','low'] } },
        { name: 'page',     type: 'string', title: 'Page / Route' },
        { name: 'issue',    type: 'text',   title: 'Issue Description' },
        { name: 'fixed',    type: 'boolean', title: 'Fixed', initialValue: false },
      ]
    }]}),

    // Content gaps
    defineField({ name: 'contentGaps', title: 'Content Gaps & Trending Topics', type: 'array', of: [{
      type: 'object', fields: [
        { name: 'topic',     type: 'string', title: 'Topic / Keyword' },
        { name: 'volume',    type: 'string', title: 'Search Volume / Trend Signal' },
        { name: 'angle',     type: 'text',   title: 'Suggested Angle for DownRange' },
        { name: 'urgency',   type: 'string', title: 'Urgency', options: { list: ['breaking','timely','evergreen'] } },
      ]
    }]}),

    // Raw data
    defineField({ name: 'siteHealthData', title: 'Site Health Raw Data', type: 'text' }),
    defineField({ name: 'searchData',     title: 'Search Trends Raw Data', type: 'text' }),
    defineField({ name: 'emailSent',      title: 'Digest Email Sent', type: 'boolean', initialValue: false }),
    defineField({ name: 'emailSentAt',    title: 'Email Sent At', type: 'datetime' }),
    defineField({ name: 'errorLog',       title: 'Error Log', type: 'text' }),
  ],
  preview: {
    select: { title: 'date', subtitle: 'headline', description: 'status' },
    prepare: ({ title, subtitle, description }) => ({
      title: `Briefing — ${title}`,
      subtitle: `[${description?.toUpperCase()}] ${subtitle || ''}`,
    })
  },
  orderings: [{ title: 'Date (newest)', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
})
