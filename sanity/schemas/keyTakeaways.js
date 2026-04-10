import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'keyTakeaways',
  title: 'Key Takeaways',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Takeaway Points',
      type: 'array',
      of: [{type: 'string'}],
      validation: Rule => Rule.max(4)
    })
  ],
  preview: {
    select: {items: 'items'},
    prepare({items}) {
      return {
        title: '📌 Key Takeaways',
        subtitle: items?.slice(0, 2).join(' · ')
      }
    }
  }
})
