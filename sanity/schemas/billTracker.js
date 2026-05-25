export const billTracker = {
  name: 'billTracker',
  title: 'Bill Tracker',
  type: 'document',
  fields: [
    { name: 'email',     title: 'Email',       type: 'string' },
    { name: 'billId',    title: 'Bill ID',     type: 'string' },
    { name: 'billTitle', title: 'Bill Title',  type: 'string' },
    { name: 'active',    title: 'Active',      type: 'boolean', initialValue: true },
    { name: 'lastStatus',title: 'Last Status', type: 'string' },
    { name: 'createdAt', title: 'Created',     type: 'datetime' },
  ],
}
