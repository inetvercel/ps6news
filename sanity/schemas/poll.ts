export default {
  name: 'poll',
  title: 'Poll',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Option Text',
              type: 'string',
            },
            {
              name: 'votes',
              title: 'Votes',
              type: 'number',
              initialValue: 0,
            },
          ],
        },
      ],
      validation: (Rule: any) => Rule.min(2).max(4),
    },
    {
      name: 'article',
      title: 'Article',
      type: 'reference',
      to: [{type: 'article'}],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'totalVotes',
      title: 'Total Votes',
      type: 'number',
      initialValue: 0,
    },
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'article.title',
    },
  },
}
