import {defineType, defineField} from 'sanity'
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
  {name: 'originalAssetId', type: 'string', hidden: true, readOnly: true},
]

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
          components: {input: WatermarkImageInput},
          fields: [
            {name: 'alt', type: 'string', title: 'Alternative text'},
            {name: 'caption', type: 'string', title: 'Caption'},
            ...watermarkFields,
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
