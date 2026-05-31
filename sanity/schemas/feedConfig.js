export const feedConfig = {
  name: 'feedConfig',
  title: 'Feed Configuration',
  type: 'document',
  fields: [
    { name: 'sourceId',    title: 'Source ID',          type: 'string' },
    { name: 'feedType',    title: 'Feed Type',          type: 'string', options: { list: ['news','laws','releases','market','video','blog'] } },
    { name: 'status',      title: 'Status',             type: 'string', options: { list: ['active','paused','deleted'] } },
    { name: 'customName',  title: 'Custom Name',        type: 'string' },
    { name: 'customUrl',   title: 'Custom URL',         type: 'url' },
    { name: 'customType',  title: 'Type (rss/api/youtube)', type: 'string' },
    { name: 'addedAt',     title: 'Added At',           type: 'datetime' },
    { name: 'pausedAt',    title: 'Paused At',          type: 'datetime' },
    { name: 'deletedAt',   title: 'Deleted At',         type: 'datetime' },
    { name: 'deleteContent', title: 'Delete Content',   type: 'boolean' },
  ],
  preview: { select: { title: 'sourceId', subtitle: 'status' } },
}
