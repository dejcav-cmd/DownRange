export const priceAlert = {
  name: 'priceAlert',
  title: 'Ammo Price Alert',
  type: 'document',
  fields: [
    { name: 'email',     title: 'Email',        type: 'string' },
    { name: 'caliber',   title: 'Caliber',      type: 'string' },
    { name: 'threshold', title: 'Price per round ($)', type: 'number' },
    { name: 'active',    title: 'Active',       type: 'boolean', initialValue: true },
    { name: 'lastFired', title: 'Last Alert Sent', type: 'datetime' },
    { name: 'createdAt', title: 'Created',      type: 'datetime' },
  ],
}
