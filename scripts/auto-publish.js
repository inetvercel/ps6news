/**
 * PS6News Auto-Publisher
 * Fetches latest PS6 news from RSS feeds, rewrites uniquely with Gemini,
 * then publishes to Sanity CMS.
 *
 * Usage: node scripts/auto-publish.js
 * Env vars needed: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN, GEMINI_API
 */

require('dotenv').config({ path: '.env.local' })
const Parser = require('rss-parser')
const { createClient } = require('@sanity/client')
const OpenAI = require('openai').default || require('openai')

// ── Clients ──────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const rssParser = new Parser({ timeout: 10000 })

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_ARTICLES_PER_RUN = 1

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=PlayStation+6+OR+PS6+release&hl=en-GB&gl=GB&ceid=GB:en',
  'https://www.videogameschronicle.com/feed/',
  'https://www.eurogamer.net/feed',
]

const PS6_KEYWORDS = /ps6|playstation\s?6|next.gen playstation/i

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomKey() {
  return Math.random().toString(36).substr(2, 12)
}

function textToBlocks(paragraphs) {
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

// ── RSS Fetching ──────────────────────────────────────────────────────────────

async function fetchPS6NewsItems() {
  const seen = new Set()
  const items = []

  for (const feedUrl of RSS_FEEDS) {
    try {
      console.log(`  Checking feed: ${feedUrl}`)
      const feed = await rssParser.parseURL(feedUrl)
      for (const item of feed.items) {
        const combined = `${item.title || ''} ${item.contentSnippet || ''}`
        if (!PS6_KEYWORDS.test(combined)) continue
        if (seen.has(item.title)) continue
        seen.add(item.title)
        items.push({
          title: item.title,
          description: stripHtml(item.contentSnippet || item.content || '').substring(0, 600),
          link: item.link,
          pubDate: item.pubDate,
        })
        if (items.length >= MAX_ARTICLES_PER_RUN * 2) break
      }
    } catch (err) {
      console.warn(`  ⚠️  Feed failed (${feedUrl}): ${err.message}`)
    }
  }

  return items.slice(0, MAX_ARTICLES_PER_RUN)
}

// ── Gemini Rewriter ───────────────────────────────────────────────────────────

async function rewriteWithGemini(title, description) {
  const prompt = `You are a senior gaming journalist writing for PS6News.com, a specialist PlayStation 6 news website.

Based on the following news snippet, write a complete, original, unique article. Do NOT copy the source text. Write from scratch in your own words.

SOURCE:
Title: "${title}"
Summary: "${description || 'No summary available'}"

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Compelling headline under 70 characters, different from source title",
  "slug": "seo-url-slug-lowercase-hyphens-max-55-chars",
  "excerpt": "Meta description 120-150 characters, summarising the article",
  "body": [
    "Opening paragraph 60-90 words: hook + main news angle",
    "Second paragraph: context and background about PS6",
    "Third paragraph: analysis of what this means for gamers",
    "Fourth paragraph: relevant PS6 specs/release/price context",
    "Fifth paragraph: closing thoughts and what to watch for"
  ],
  "keyTakeaways": [
    "First key point in one clear sentence",
    "Second key point in one clear sentence",
    "Third key point in one clear sentence"
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content)
}

// ── Sanity Helpers ────────────────────────────────────────────────────────────

async function slugExists(slug) {
  const id = await sanity.fetch(
    `*[_type == "article" && slug.current == $slug][0]._id`,
    { slug }
  )
  return !!id
}

async function getDefaultAuthorId() {
  return await sanity.fetch(`*[_type == "author"][0]._id`)
}

async function getCategoryId(slugName) {
  return await sanity.fetch(
    `*[_type == "category" && slug.current == $slugName][0]._id`,
    { slugName }
  )
}

async function publishToSanity(data, authorId, categoryId) {
  const body = []

  if (data.keyTakeaways?.length) {
    body.push({
      _type: 'keyTakeaways',
      _key: randomKey(),
      items: data.keyTakeaways,
    })
  }

  body.push(...textToBlocks(data.body))

  const doc = {
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🚀 PS6News Auto-Publisher starting...\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY env var is missing. Add it to .env.local')
    process.exit(1)
  }
  if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
    console.error('❌ SANITY_API_TOKEN env var is missing. Add it to .env.local')
    process.exit(1)
  }

  console.log('📡 Fetching PS6 news from RSS feeds...')
  const items = await fetchPS6NewsItems()

  if (!items.length) {
    console.log('ℹ️  No new PS6 news found today.')
    return
  }

  console.log(`\nFound ${items.length} items to process\n`)

  const authorId = await getDefaultAuthorId()
  const categoryId = await getCategoryId('news')
  console.log(`Author: ${authorId || 'none'} | Category: ${categoryId || 'none'}\n`)

  let published = 0
  let skipped = 0
  const results = []

  for (const item of items) {
    console.log(`📰 Processing: "${item.title}"`)
    try {
      console.log('   ✍️  Rewriting with Gemini...')
      const data = await rewriteWithGemini(item.title, item.description)

      if (await slugExists(data.slug)) {
        console.log(`   ⏭️  Skipped — slug already exists: /${data.slug}\n`)
        skipped++
        continue
      }

      const result = await publishToSanity(data, authorId, categoryId)
      console.log(`   ✅ Published: "${data.title}"`)
      console.log(`      URL: https://ps6news.com/${data.slug}`)
      console.log(`      ID:  ${result._id}\n`)
      results.push({ title: data.title, slug: data.slug, id: result._id })
      published++

      // Respect Gemini free tier rate limits (15 req/min)
      if (items.indexOf(item) < items.length - 1) {
        console.log('   ⏳ Waiting 8s before next request...')
        await new Promise(r => setTimeout(r, 8000))
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}\n`)
    }
  }

  console.log(`\n✅ Done! Published: ${published} | Skipped: ${skipped}`)
  if (results.length) {
    console.log('\nPublished articles:')
    results.forEach(r => console.log(`  • ${r.title} → /${r.slug}`))
  }

  return results
}

// Run if called directly
if (require.main === module) {
  run().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

module.exports = { run }
