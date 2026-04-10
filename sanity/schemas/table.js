import {defineType, defineField} from 'sanity'

export const tableRow = defineType({
  name: 'tableRow',
  title: 'Table Row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [{type: 'string'}],
    }),
  ],
})

export const table = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [{type: 'tableRow'}],
    }),
  ],
  preview: {
    select: {rows: 'rows'},
    prepare({rows}) {
      const count = rows?.length || 0
      return {title: `Table (${count} rows)`}
    },
  },
})
