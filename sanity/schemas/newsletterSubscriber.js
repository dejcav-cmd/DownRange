// Newsletter Subscriber Schema - auto-deployed via GitHub Actions
export default {
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) =>
        Rule.required().email(),
    },
    {
      name: 'status',
      title: 'Subscription Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Unsubscribed', value: 'unsubscribed' },
          { title: 'Bounced', value: 'bounced' },
          { title: 'Complained', value: 'complained' },
        ],
      },
      initialValue: 'active',
    },
    {
      name: 'subscribedAt',
      title: 'Subscribed Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'source',
      title: 'Signup Source',
      type: 'string',
      options: {
        list: [
          { title: 'Website Form', value: 'website' },
          { title: 'Manual Import', value: 'manual' },
          { title: 'Admin Added', value: 'admin' },
        ],
      },
      initialValue: 'website',
    },
    {
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
    },
  ],
  preview: {
    select: {
      email: 'email',
      status: 'status',
      date: 'subscribedAt',
    },
    prepare(selection) {
      const { email, status, date } = selection;
      const dateStr = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        title: email,
        subtitle: `${status} • ${dateStr}`,
      };
    },
  },
}
