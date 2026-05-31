import {defineType, defineField} from 'sanity'

export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  title: 'HTML / Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'html',
      title: 'HTML Code',
      type: 'text',
      rows: 6,
      description: 'Paste raw HTML here — tables, iframes, embeds etc.',
    }),
  ],
  preview: {
    select: {html: 'html'},
    prepare({html}: {html: string}) {
      return {title: '⟨/⟩ HTML Embed', subtitle: (html || '').substring(0, 60)}
    },
  },
})

export const youtube = defineType({
  name: 'youtube',
  title: 'YouTube Video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      description: 'Paste a YouTube video URL e.g. https://www.youtube.com/watch?v=...',
    }),
  ],
  preview: {
    select: {url: 'url'},
    prepare({url}: {url: string}) {
      return {title: '▶ YouTube', subtitle: url || ''}
    },
  },
})
