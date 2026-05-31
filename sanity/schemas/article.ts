import {defineField, defineType} from 'sanity'
import {WatermarkImageInput} from '../components/WatermarkImageInput'

const watermarkFields = [
  {
    name: 'watermark',
    type: 'boolean',
    title: 'Apply PS6News watermark',
    description: 'Burns the PS6News logo + ps6news.com onto the image. Untick to restore the original.',
    initialValue: false,
  },
  {name: 'watermarkApplied', type: 'boolean', hidden: true, readOnly: true},
  {
    name: 'originalAsset',
    type: 'reference',
    to: [{type: 'sanity.imageAsset'}],
    hidden: true,
    readOnly: true,
  },
]

export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}]
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      components: {input: WatermarkImageInput},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text'
        },
        ...watermarkFields,
      ]
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}]
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(200)
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strike', value: 'strike-through' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule: any) => Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: true,
                  },
                ],
              },
              {
                name: 'highlight',
                type: 'object',
                title: 'Highlight',
                fields: [{ name: 'color', type: 'string', title: 'Colour', initialValue: 'yellow' }],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          components: {input: WatermarkImageInput},
          fields: [
            { name: 'alt', type: 'string', title: 'Alternative text' },
            { name: 'caption', type: 'string', title: 'Caption' },
            ...watermarkFields,
          ]
        },
        { type: 'youtube' },
        { type: 'htmlEmbed' },
        {
          type: 'keyTakeaways'
        },
        {
          type: 'table'
        }
      ]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Article',
      type: 'boolean',
      description: 'Show this article in featured sections'
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      description: 'When this article was last updated — shown to readers instead of published date'
    }),
    defineField({
      name: 'wordpressId',
      title: 'WordPress ID',
      type: 'number',
      description: 'Original WordPress post ID (for migration tracking)'
    })
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage'
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    }
  }
})
