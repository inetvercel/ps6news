import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'imageSlider',
  title: 'Image Slider',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Slider Title (optional)',
      type: 'string',
      description: 'Shown above the slider, e.g. "PS6 Concept Designs".',
    }),
    defineField({
      name: 'images',
      title: 'Slides',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {name: 'alt', type: 'string', title: 'Alternative text'},
            {name: 'caption', type: 'string', title: 'Caption'},
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).error('Add at least one image.'),
    }),
  ],
  preview: {
    select: {images: 'images', title: 'title'},
    prepare({images, title}: {images?: any[]; title?: string}) {
      return {
        title: title || 'Image Slider',
        subtitle: `🖼️ ${images?.length || 0} slide(s)`,
        media: images?.[0],
      }
    },
  },
})
