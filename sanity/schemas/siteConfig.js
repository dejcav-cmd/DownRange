export const siteConfig = {
  name: 'siteConfig',
  title: 'Site Configuration',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    { name: 'rssFeeds', title: 'RSS Feed URLs', type: 'array', of: [
      { type: 'object', fields: [
        { name: 'name', title: 'Feed Name', type: 'string' },
        { name: 'url',  title: 'Feed URL',  type: 'url' },
        { name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: true },
      ]}
    ]},
    { name: 'youtubeChannels', title: 'YouTube Channels', type: 'array', of: [
      { type: 'object', fields: [
        { name: 'name',    title: 'Channel Name', type: 'string' },
        { name: 'id',      title: 'Channel ID',   type: 'string' },
        { name: 'enabled', title: 'Enabled',      type: 'boolean', initialValue: true },
      ]}
    ]},
    { name: 'breakingUrgencyThreshold', title: 'Breaking Alert Urgency Threshold', type: 'number', initialValue: 8 },
  ],
}
