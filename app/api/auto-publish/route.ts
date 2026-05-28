import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@sanity/client'
import OpenAI from 'openai'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=PlayStation+6+OR+PS6+release&hl=en-GB&gl=GB&ceid=GB:en',
  'https://www.videogameschronicle.com/feed/',
  'https://www.eurogamer.net/feed',
]

const PS6_KEYWORDS = /ps6|playstation\s?6|next.gen playstation/i

function randomKey() {
  return Math.random().toString(36).substr(2, 12)
}

function textToBlocks(paragraphs: string[]) {
  return paragraphs.map(text => ({
    _type: 'block',
    _key: randomKey(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: randomKey(), text: text.trim(), marks: [] }],
  }))
}

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

async function fetchPS6NewsItems() {
  const rssParser = new Parser({ timeout: 10000 })
  const seen = new Set<string>()
  const items: { title: string; description: string; link: string }[] = []

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await rssParser.parseURL(feedUrl)
      for (const item of feed.items) {
        const combined = `${item.title || ''} ${item.contentSnippet || ''}`
        if (!PS6_KEYWORDS.test(combined)) continue
        if (seen.has(item.title || '')) continue
        seen.add(item.title || '')
        items.push({
          title: item.title || '',
          description: stripHtml(item.contentSnippet || item.content || '').substring(0, 600),
          link: item.link || '',
        })
        if (items.length >= 6) break
      }
    } catch {
      // Feed failed, continue to next
    }
  }
  return items.slice(0, 3)
}

async function rewriteWithGemini(title: string, description: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `You are a senior gaming journalist writing for PS6News.com.

Based on this news snippet, write a complete original article about PlayStation 6. Do NOT copy source text.

SOURCE:
Title: "${title}"
Summary: "${description || 'No summary'}"

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Compelling headline under 70 characters",
  "slug": "seo-url-slug-lowercase-hyphens-max-55-chars",
  "excerpt": "Meta description 120-150 characters",
  "body": [
    "Opening paragraph 60-90 words: hook + main news angle",
    "Second paragraph: context and background about PS6",
    "Third paragraph: analysis of what this means for gamers",
    "Fourth paragraph: relevant PS6 specs/release/price context",
    "Fifth paragraph: closing thoughts and what to watch for"
  ],
  "keyTakeaways": [
    "First key point in one sentence",
    "Second key point in one sentence",
    "Third key point in one sentence"
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content!)
}

async function slugExists(slug: string) {
  const id = await sanity.fetch(`*[_type == "article" && slug.current == $slug][0]._id`, { slug })
  return !!id
}

async function publishToSanity(data: any) {
  const authorId = await sanity.fetch(`*[_type == "author"][0]._id`)
  const categoryId = await sanity.fetch(
    `*[_type == "category" && slug.current == "news"][0]._id`
  )

  const body: any[] = []
  if (data.keyTakeaways?.length) {
    body.push({ _type: 'keyTakeaways', _key: randomKey(), items: data.keyTakeaways })
  }
  body.push(...textToBlocks(data.body))

  const doc: any = {
    _type: 'article',
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    excerpt: data.excerpt,
    body,
    publishedAt: new Date().toISOString(),
    featured: false,
  }

  if (authorId) doc.author = { _type: 'reference', _ref: authorId }
  if (categoryId) doc.category = { _type: 'reference', _ref: categoryId }

  return await sanity.create(doc)
}

export async function POST(request: NextRequest) {
  // Protect with secret key
  const secret = request.headers.get('x-publish-secret')
  if (!secret || secret !== process.env.AUTO_PUBLISH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const items = await fetchPS6NewsItems()
    if (!items.length) {
      return NextResponse.json({ message: 'No new PS6 news found', published: [] })
    }

    const published = []
    const skipped = []

    for (const item of items) {
      try {
        const data = await rewriteWithGemini(item.title, item.description)

        if (await slugExists(data.slug)) {
          skipped.push(data.slug)
          continue
        }

        const result = await publishToSanity(data)
        published.push({ title: data.title, slug: data.slug, id: result._id })

        await new Promise(r => setTimeout(r, 2000))
      } catch (err: any) {
        console.error('Article failed:', err.message)
      }
    }

    return NextResponse.json({ published, skipped, total: published.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
